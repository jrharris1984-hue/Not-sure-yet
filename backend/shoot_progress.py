"""Shoot completion follows render results, not submission to ComfyUI."""

TERMINAL_FAILURES = {"failed", "offline", "cancelled", "rejected"}


def refresh_shoot_progress(shoot, renders):
    frames = shoot.get("frames") or []
    if not frames:
        return shoot
    complete = 0
    failed = 0
    active = False
    for index, frame in enumerate(frames):
        render = renders[index] if index < len(renders) else None
        render = render or {}
        variants = render.get("output_variants") or {}
        has_output = bool(render.get("output_files") or variants.get("enhanced"))
        status = "done" if has_output else render.get("status") or frame.get("status", "pending")
        # A stale frame-level 'done' without output is not a finished photo.
        if status == "done" and not has_output:
            status = "pending"
        frame["status"] = status
        complete += int(has_output)
        failed += int(status in TERMINAL_FAILURES)
        active = active or status == "running"
    shoot["rendered_count"] = complete
    shoot["progress"] = (complete + failed) / len(frames)
    if complete + failed == len(frames):
        shoot["status"] = "failed" if failed else "done"
    else:
        shoot["status"] = "running" if active or complete or shoot.get("status") != "queued" else "queued"
    return shoot
