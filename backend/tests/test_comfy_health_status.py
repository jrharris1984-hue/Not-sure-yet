"""Tests for richer ComfyUI health states without importing the database-connected app."""
import ast
import asyncio
from pathlib import Path
from types import SimpleNamespace
import unittest


class _Queue:
    def __init__(self, active):
        self.active = active

    async def count_documents(self, query):
        return self.active


class _DB:
    def __init__(self, active):
        self.render_queue = _Queue(active)


class _Response:
    status_code = 200

    def raise_for_status(self):
        return None


class ComfyHealthTests(unittest.TestCase):
    def load_route(self):
        source = Path(__file__).resolve().parents[1] / "server.py"
        node = next(
            item for item in ast.parse(source.read_text()).body
            if isinstance(item, ast.AsyncFunctionDef) and item.name == "comfyui_health"
        )
        return source, node

    def run_route(self, active_jobs=0, fail=False):
        source, node = self.load_route()

        async def get_settings():
            return SimpleNamespace(comfyui_url="http://comfy:8188")

        class Client:
            def __init__(self, timeout):
                self.timeout = timeout

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            async def get(self, url):
                if fail:
                    raise RuntimeError("timeout")
                return _Response()

        namespace = {
            "get_settings": get_settings,
            "db": _DB(active_jobs),
            "asyncio": asyncio,
            "httpx": SimpleNamespace(AsyncClient=Client),
            "now_iso": lambda: "2026-10-07T16:00:00+00:00",
            "comfy_health_state": {
                "last_response_at": None,
                "last_success_monotonic": None,
                "response_ms": None,
            },
        }
        exec(compile(ast.Module(body=[node], type_ignores=[]), str(source), "exec"), namespace)
        return asyncio.run(namespace["comfyui_health"]())

    def test_active_render_is_busy_when_comfy_responds(self):
        result = self.run_route(active_jobs=1)
        self.assertTrue(result["online"])
        self.assertEqual(result["state"], "busy")
        self.assertEqual(result["active_jobs"], 1)

    def test_active_render_timeout_is_not_marked_offline(self):
        result = self.run_route(active_jobs=1, fail=True)
        self.assertTrue(result["online"])
        self.assertEqual(result["state"], "busy")
        self.assertIn("slow to answer", result["warning"])

    def test_idle_timeout_is_unreachable(self):
        result = self.run_route(active_jobs=0, fail=True)
        self.assertFalse(result["online"])
        self.assertEqual(result["state"], "unreachable")


if __name__ == "__main__":
    unittest.main()
