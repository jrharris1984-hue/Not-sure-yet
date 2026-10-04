"""Durable dispatch bookkeeping and conservative recovery decisions."""

SUBMISSION_UNKNOWN = "Submission could not be confirmed. Check ComfyUI history before retrying to avoid a duplicate image."


def submission_failure(error):
    # A connect failure precedes transmission. Timeouts after connection can mean
    # ComfyUI accepted the request; those require a deliberate retry.
    if type(error).__name__ in {"ConnectError", "ConnectTimeout"}:
        return "offline", "not_sent", "ComfyUI is unreachable. The job will wait and reconnect automatically."
    return "failed", "unknown", SUBMISSION_UNKNOWN


def interrupted_submission_patch(render, now):
    if render.get("status") == "dispatching" and not render.get("comfy_prompt_id"):
        return {"status": "failed", "submission_state": "unknown", "error": SUBMISSION_UNKNOWN, "updated_at": now}
    return None


async def submit_render(doc, queue_id, renders, queue, post_prompt, now):
    """Persist intent and queue link before making the non-idempotent request."""
    doc.update(status="dispatching", submission_state="pending", queue_id=queue_id)
    await renders.insert_one(dict(doc))
    if queue_id:
        linked = await queue.update_one({"id": queue_id, "status": "dispatching"},
                                        {"$set": {"render_id": doc["id"], "updated_at": now()}})
        if getattr(linked, "matched_count", 1) == 0:
            patch = {"status": "cancelled", "submission_state": "not_sent", "updated_at": now()}
            await renders.update_one({"id": doc["id"]}, {"$set": patch})
            doc.update(patch)
            return doc
    try:
        response = await post_prompt()
        if response.status_code >= 400:
            patch = {"status": "failed", "submission_state": "rejected",
                     "error": f"ComfyUI rejected this workflow (HTTP {response.status_code}): {response.text[:300]}"}
        else:
            prompt_id = response.json().get("prompt_id")
            patch = {"status": "running" if prompt_id else "failed", "comfy_prompt_id": prompt_id,
                     "submission_state": "accepted" if prompt_id else "unknown",
                     "error": None if prompt_id else SUBMISSION_UNKNOWN}
    except Exception as error:
        status, state, message = submission_failure(error)
        if not queue_id and status == "offline":
            message = "ComfyUI is unreachable. Reconnect and retry this render."
        patch = {"status": status, "submission_state": state, "error": message}
    patch["updated_at"] = now()
    await renders.update_one({"id": doc["id"]}, {"$set": patch})
    doc.update(patch)
    return doc
