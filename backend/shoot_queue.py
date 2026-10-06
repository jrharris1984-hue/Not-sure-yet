"""Resolve shoot frames through persistent queue jobs, preserving legacy renders."""

def shoot_render_slots(frames, jobs, renders):
    slots = []
    for frame in frames:
        job = jobs.get(frame.get("queue_id"))
        if job:
            render = renders.get(job.get("render_id")) or {}
            slot = {**render, "id": render.get("id") or job["id"], "queue_id": job["id"],
                    "status": job["status"], "error": job.get("error") or render.get("error")}
            if job["status"] in {"queued", "dispatching", "cancelled"}:
                slot.pop("output_files", None)
                slot.pop("output_variants", None)
            slots.append(slot)
        elif frame.get("queue_id") and not frame.get("render_id"):
            slots.append({"status": "failed", "error": "The shoot queue job is missing."})
        else:
            slots.append(renders.get(frame.get("render_id")))
    return slots


async def load_shoot_renders(db, frames):
    queue_ids = [f["queue_id"] for f in frames if f.get("queue_id")]
    records = await db.render_queue.find({"id": {"$in": queue_ids}}, {"_id": 0}).to_list(len(queue_ids)) if queue_ids else []
    jobs = {job["id"]: job for job in records}
    ids = list({f["render_id"] for f in frames if f.get("render_id")} |
               {job["render_id"] for job in records if job.get("render_id")})
    records = await db.renders.find({"id": {"$in": ids}}, {"_id": 0}).to_list(len(ids)) if ids else []
    return shoot_render_slots(frames, jobs, {r["id"]: r for r in records})


async def link_shoot_render(db, job):
    payload = job.get("payload") or {}
    sid = payload.get("shoot_id")
    index = payload.get("shoot_frame_index")
    if sid and isinstance(index, int) and index >= 0:
        prefix = f"frames.{index}"
        await db.shoots.update_one({"id": sid, f"{prefix}.queue_id": job["id"]},
                                   {"$set": {f"{prefix}.render_id": job.get("render_id")}})
