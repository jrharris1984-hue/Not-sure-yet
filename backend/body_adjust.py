"""Body Adjust strength policy; independent of normal variation settings."""
import math

STRENGTH_POINTS = ((0, .55), (25, .40), (50, .28), (60, .38), (75, .50), (100, .62))


def body_adjust_denoise(value):
    amount = float(value)
    if not math.isfinite(amount):
        raise ValueError("Body adjustment amount must be finite")
    amount = max(0, min(100, amount))
    for (start, low), (end, high) in zip(STRENGTH_POINTS, STRENGTH_POINTS[1:]):
        if amount <= end:
            return round(low + (amount - start) / (end - start) * (high - low), 4)
    return .62


def patch_img2img_denoise(workflow, strength):
    patched = False
    for node in workflow.values():
        if not isinstance(node, dict):
            continue
        inputs = node.get("inputs", {})
        if node.get("class_type") in {"SplitSigmasDenoise", "KSampler"} and "denoise" in inputs:
            inputs["denoise"] = strength
            patched = True
    return patched
