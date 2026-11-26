"""Normalize ComfyUI system_stats for read-only resource reporting."""
from typing import Any, Dict, List


def _memory_number(value: Any) -> int:
    try:
        return max(0, int(value))
    except (TypeError, ValueError, OverflowError):
        return 0


def summarize_comfy_resources(payload: Any) -> Dict[str, Any]:
    """Return safe device memory fields; unknown values stay explicitly unknown."""
    raw_devices = payload.get("devices", []) if isinstance(payload, dict) else []
    devices: List[Dict[str, Any]] = []
    if isinstance(raw_devices, list):
        for position, raw in enumerate(raw_devices):
            if not isinstance(raw, dict):
                continue
            total = _memory_number(raw.get("vram_total"))
            free = min(total, _memory_number(raw.get("vram_free"))) if total else 0
            used = max(0, total - free) if total else 0
            free_ratio = (free / total) if total else None
            pressure = (
                "unknown" if free_ratio is None else
                "high" if free_ratio <= 0.12 else
                "elevated" if free_ratio <= 0.28 else
                "normal"
            )
            devices.append({
                "index": raw.get("index", position),
                "name": str(raw.get("name") or f"ComfyUI device {position + 1}"),
                "type": str(raw.get("type") or "unknown"),
                "vram_total": total or None,
                "vram_free": free if total else None,
                "vram_used": used if total else None,
                "vram_used_percent": round((used / total) * 100, 1) if total else None,
                "pressure": pressure,
            })
    return {"devices": devices}


def should_defer_dispatch(resources: Any, enabled: bool, override: bool = False) -> bool:
    """Hold only when the optional policy is enabled and every known CUDA GPU is high pressure."""
    if not enabled or override or not isinstance(resources, dict):
        return False
    devices = resources.get("devices")
    if not isinstance(devices, list):
        return False
    gpus = [device for device in devices if isinstance(device, dict)
            and str(device.get("type", "")).lower() in {"cuda", "gpu"}]
    return bool(gpus) and all(device.get("pressure") == "high" for device in gpus)
