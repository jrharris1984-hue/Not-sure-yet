import ast
import asyncio
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from typing import Any, Dict, Optional

from queue_reliability import submit_render, interrupted_submission_patch, SUBMISSION_UNKNOWN


class QueueReliabilityTests(unittest.IsolatedAsyncioTestCase):
    def setup_submission(self):
        self.events = []
        self.renders = SimpleNamespace(insert_one=AsyncMock(side_effect=lambda doc: self.events.append("saved")), update_one=AsyncMock())
        self.queue = SimpleNamespace(update_one=AsyncMock(side_effect=lambda *args: self.events.append("linked")))
        self.doc = {"id": "render", "seed_used": 42, "render_recipe": {"seed": 42}}

    async def test_intent_and_queue_link_precede_submission(self):
        self.setup_submission()
        async def post():
            self.assertEqual(self.events, ["saved", "linked"])
            return SimpleNamespace(status_code=200, json=lambda: {"prompt_id": "prompt"})
        result = await submit_render(self.doc, "job", self.renders, self.queue, post, lambda: "now")
        self.assertEqual(result["status"], "running")
        self.assertEqual(result["comfy_prompt_id"], "prompt")
        self.assertEqual(result["seed_used"], 42)

    async def test_failed_persistence_never_sends_a_prompt(self):
        self.setup_submission()
        self.renders.insert_one.side_effect = RuntimeError("database unavailable")
        post = AsyncMock()
        with self.assertRaises(RuntimeError):
            await submit_render(self.doc, "job", self.renders, self.queue, post, lambda: "now")
        post.assert_not_called()

    async def test_failed_queue_link_never_sends_a_prompt(self):
        self.setup_submission()
        self.queue.update_one.side_effect = RuntimeError("database unavailable")
        post = AsyncMock()
        with self.assertRaises(RuntimeError):
            await submit_render(self.doc, "job", self.renders, self.queue, post, lambda: "now")
        post.assert_not_called()

    async def test_cancelled_claim_does_not_submit_a_prompt(self):
        self.setup_submission()
        self.queue.update_one.side_effect = None
        self.queue.update_one.return_value = SimpleNamespace(matched_count=0)
        post = AsyncMock()
        result = await submit_render(self.doc, "job", self.renders, self.queue, post, lambda: "now")
        self.assertEqual(result["status"], "cancelled")
        post.assert_not_called()

    async def test_connect_failure_is_safe_to_retry_but_read_timeout_is_uncertain(self):
        for name, expected in [("ConnectError", "offline"), ("ConnectTimeout", "offline"), ("ReadTimeout", "failed")]:
            with self.subTest(name=name):
                self.setup_submission()
                post = AsyncMock(side_effect=type(name, (Exception,), {})())
                result = await submit_render(self.doc, "job", self.renders, self.queue, post, lambda: "now")
                self.assertEqual(result["status"], expected)
                self.assertEqual(result["submission_state"], "not_sent" if expected == "offline" else "unknown")

    async def test_missing_prompt_id_and_http_rejection_are_not_auto_retried(self):
        for code, body in [(200, {}), (400, {})]:
            self.setup_submission()
            post = AsyncMock(return_value=SimpleNamespace(status_code=code, text="Missing model", json=lambda: body))
            result = await submit_render(self.doc, "job", self.renders, self.queue, post, lambda: "now")
            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["submission_state"], "unknown" if code == 200 else "rejected")

    def test_restart_does_not_blindly_resubmit_uncertain_intent(self):
        patch = interrupted_submission_patch({"status": "dispatching"}, "now")
        self.assertEqual(patch["status"], "failed")
        self.assertEqual(patch["error"], SUBMISSION_UNKNOWN)
        self.assertIsNone(interrupted_submission_patch({"status": "running", "comfy_prompt_id": "prompt"}, "now"))
        self.assertIsNone(interrupted_submission_patch({"status": "done", "output_files": ["image.png"]}, "now"))

    async def test_startup_relinks_persisted_intent_before_requeueing_unlinked_claims(self):
        # Execute the actual startup function without importing application/network dependencies.
        tree = ast.parse((Path(__file__).parents[1] / "server.py").read_text())
        node = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "_startup")
        node.decorator_list = []
        queue = SimpleNamespace(find=lambda *a: SimpleNamespace(to_list=AsyncMock(return_value=[{"id": "job", "status": "dispatching", "render_id": None}])),
                                update_one=AsyncMock(), update_many=AsyncMock())
        renders = SimpleNamespace(find_one=AsyncMock(return_value={"id": "render", "status": "dispatching"}), update_one=AsyncMock())
        async def worker(): pass
        namespace = {"db": SimpleNamespace(render_queue=queue, renders=renders), "asyncio": asyncio,
                     "now_iso": lambda: "now", "interrupted_submission_patch": interrupted_submission_patch,
                     "_render_queue_worker": worker}
        exec(compile(ast.Module(body=[node], type_ignores=[]), "startup", "exec"), namespace)
        await namespace["_startup"]()
        self.assertEqual(queue.update_one.call_args.args[1]["$set"]["render_id"], "render")
        self.assertEqual(renders.update_one.call_args.args[1]["$set"]["status"], "failed")
        self.assertEqual(queue.update_many.call_args.args[0], {"status": "dispatching", "render_id": None})
        await namespace["_queue_worker_task"]

    async def test_offline_worker_keeps_job_queued_without_claiming_or_dispatching(self):
        tree = ast.parse((Path(__file__).parents[1] / "server.py").read_text())
        node = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "_render_queue_worker")
        stop = asyncio.Event()
        async def sleep(_): stop.set()
        queue = SimpleNamespace(find_one=AsyncMock(side_effect=[None, {"id": "job", "status": "queued"}]), update_one=AsyncMock())
        dispatch = AsyncMock()
        namespace = {"db": SimpleNamespace(render_queue=queue), "_queue_stop": stop,
                     "asyncio": SimpleNamespace(sleep=sleep, CancelledError=asyncio.CancelledError),
                     "logger": SimpleNamespace(info=lambda *a: None, exception=lambda *a: None),
                     "now_iso": lambda: "now", "comfyui_health": AsyncMock(return_value={"online": False}),
                     "_perform_dispatch": dispatch}
        exec(compile(ast.Module(body=[node], type_ignores=[]), "worker", "exec"), namespace)
        await namespace["_render_queue_worker"]()
        dispatch.assert_not_called()
        patch = queue.update_one.call_args.args[1]["$set"]
        self.assertTrue(patch["connection_wait"])
        self.assertNotIn("status", patch)

    async def test_poll_connection_failure_retains_running_job_and_media(self):
        tree = ast.parse((Path(__file__).parents[1] / "server.py").read_text())
        node = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "_poll_render_doc")
        doc = {"id": "render", "status": "running", "comfy_prompt_id": "prompt", "output_files": ["saved.png"]}
        renders = SimpleNamespace(find_one=AsyncMock(return_value=dict(doc)), update_one=AsyncMock())
        class Client:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def get(self, *args): raise ConnectionError("offline")
        namespace = {"db": SimpleNamespace(renders=renders), "Dict": Dict, "Any": Any, "Optional": Optional,
                     "get_settings": AsyncMock(return_value=SimpleNamespace(comfyui_url="http://comfy")),
                     "httpx": SimpleNamespace(AsyncClient=lambda **kw: Client()),
                     "logger": SimpleNamespace(warning=lambda *a: None)}
        exec(compile(ast.Module(body=[node], type_ignores=[]), "poll", "exec"), namespace)
        result = await namespace["_poll_render_doc"]("render")
        self.assertEqual(result["status"], "running")
        self.assertEqual(result["output_files"], ["saved.png"])
        self.assertIn("connection interrupted", result["connection_error"])
        self.assertNotIn("status", renders.update_one.call_args.args[1]["$set"])


if __name__ == "__main__":
    unittest.main()
