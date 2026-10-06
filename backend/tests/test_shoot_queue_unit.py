import ast
import asyncio
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from shoot_queue import shoot_render_slots, link_shoot_render


class ShootQueueTests(unittest.IsolatedAsyncioTestCase):
    def test_resolves_queued_and_legacy_frames_without_shifting_slots(self):
        frames = [{"queue_id": "q1"}, {"queue_id": "q2"}, {"render_id": "old"}]
        jobs = {"q1": {"id": "q1", "status": "queued"},
                "q2": {"id": "q2", "status": "done", "render_id": "new"}}
        slots = shoot_render_slots(frames, jobs, {"new": {"id": "new", "output_files": ["new.png"]}, "old": {"id": "old"}})
        self.assertEqual([s["id"] for s in slots], ["q1", "new", "old"])
        self.assertEqual(slots[1]["output_files"], ["new.png"])
        self.assertEqual(slots[1]["queue_id"], "q2")

    def test_retry_and_cancel_do_not_expose_previous_outputs(self):
        for status in ["queued", "dispatching", "cancelled"]:
            slots = shoot_render_slots([{"queue_id": "q"}], {"q": {"id": "q", "status": status, "render_id": "old"}},
                                       {"old": {"id": "old", "output_files": ["old.png"], "output_variants": {"enhanced": ["old.png"]}}})
            self.assertNotIn("output_files", slots[0])
            self.assertNotIn("output_variants", slots[0])

    def test_cleared_queue_retains_linked_photos(self):
        slots = shoot_render_slots([{"queue_id": "cleared", "render_id": "photo"}], {},
                                   {"photo": {"id": "photo", "output_files": ["photo.png"]}})
        self.assertEqual(slots[0]["output_files"], ["photo.png"])

    async def test_render_link_only_updates_the_matching_queue_attempt(self):
        db = SimpleNamespace(shoots=SimpleNamespace(update_one=AsyncMock()))
        await link_shoot_render(db, {"id": "q", "render_id": "r", "payload": {"shoot_id": "s", "shoot_frame_index": 2}})
        self.assertEqual(db.shoots.update_one.call_args.args, ({"id": "s", "frames.2.queue_id": "q"}, {"$set": {"frames.2.render_id": "r"}}))

    async def test_shoot_enqueues_each_frame_and_never_directly_submits(self):
        tree = ast.parse((Path(__file__).parents[1] / "server.py").read_text())
        node = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "_run_shoot_background")
        class Frame:
            def __init__(self, seed):
                self.seed = seed
                self.prompt_positive = f"frame {seed}"
                self.prompt_negative = "negative"
                self.edit_instruction = ""
                self.pose_action = self.scene_direction = ""
                self.outfit_overrides = self.face_overrides = {}
                self.render_id = self.queue_id = None
                self.status = "pending"
            def model_dump(self): return dict(self.__dict__)
        frames = [Frame(42), Frame(43)]
        shoot = SimpleNamespace(frames=frames, character_id="c", workflow_id="wf", lora_overrides={}, lock_scenario=True, dispatch_settings={"steps": 4}, reference_image="input-photo.png", source_render_id="photo", set_overrides={})
        db = SimpleNamespace(shoots=SimpleNamespace(find_one=AsyncMock(return_value={"id": "s"}), update_one=AsyncMock()),
                             characters=SimpleNamespace(find_one=AsyncMock(return_value={"name": "Character", "dna": {}})))
        enqueue = AsyncMock(side_effect=[{"id": "q1", "status": "queued"}, {"id": "q2", "status": "queued"}])
        submit = AsyncMock()
        ns = {"db": db, "Shoot": lambda **kw: shoot, "DispatchBody": lambda **kw: SimpleNamespace(**kw),
              "shoot_base_dna": lambda dna, _: dna, "_enqueue_render": enqueue, "_perform_dispatch": submit, "_apply_frame_to_dna": lambda dna, *args: dna,
              "now_iso": lambda: "now", "logger": SimpleNamespace(warning=lambda *a: None)}
        exec(compile(ast.Module(body=[node], type_ignores=[]), "shoot", "exec"), ns)
        await ns["_run_shoot_background"]("s")
        submit.assert_not_called()
        self.assertEqual([call.args[0].seed for call in enqueue.call_args_list], [42, 43])
        self.assertEqual([call.args[0].shoot_frame_index for call in enqueue.call_args_list], [0, 1])
        self.assertEqual([call.args[0].reference_image for call in enqueue.call_args_list], ["input-photo.png", "input-photo.png"])
        self.assertTrue(all(call.args[0].parent_render_id == "photo" and call.args[0].steps == 4 for call in enqueue.call_args_list))
        self.assertEqual([frame.queue_id for frame in frames], ["q1", "q2"])
        self.assertTrue(all(frame.render_id is None for frame in frames))

    async def test_worker_does_not_claim_next_job_while_one_is_running(self):
        tree = ast.parse((Path(__file__).parents[1] / "server.py").read_text())
        node = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "_render_queue_worker")
        stop = asyncio.Event()
        async def sleep(_): stop.set()
        active = {"id": "q", "render_id": "r", "status": "running"}
        queue = SimpleNamespace(find_one=AsyncMock(return_value=active))
        submit = AsyncMock()
        ns = {"db": SimpleNamespace(render_queue=queue), "_queue_stop": stop,
              "_sync_queue_job": AsyncMock(return_value=active), "_perform_dispatch": submit,
              "asyncio": SimpleNamespace(sleep=sleep, CancelledError=asyncio.CancelledError),
              "logger": SimpleNamespace(info=lambda *a: None, exception=lambda *a: None)}
        exec(compile(ast.Module(body=[node], type_ignores=[]), "worker", "exec"), ns)
        await ns["_render_queue_worker"]()
        submit.assert_not_called()
        queue.find_one.assert_awaited_once()
