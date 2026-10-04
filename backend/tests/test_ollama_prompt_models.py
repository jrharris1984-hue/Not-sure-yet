"""Exercise the actual text route without importing the database-connected app."""
import ast
import asyncio
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ollama_prompt_models import configure_prompt_request, GEMMA_PROMPT_MODELS, LLAMA_PROMPT_MODELS


class PromptModelTests(unittest.TestCase):
    def call_route(self, model, as_json):
        seen = {}

        async def get_settings():
            return SimpleNamespace(ai_provider="ollama", ollama_url="http://ollama:11434/")

        async def selected_model(settings, vision):
            self.assertFalse(vision)
            return model

        class Client:
            def __init__(self, timeout):
                seen["timeout"] = timeout

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            async def post(self, url, json):
                seen.update(url=url, payload=json)
                return SimpleNamespace(raise_for_status=lambda: None,
                                       json=lambda: {"message": {"content": "assistant response"}})

        source = Path(__file__).resolve().parents[1] / "server.py"
        route = next(node for node in ast.parse(source.read_text()).body
                     if isinstance(node, ast.AsyncFunctionDef) and node.name == "openrouter_chat")
        namespace = dict(get_settings=get_settings, _ollama_model=selected_model,
                         configure_prompt_request=configure_prompt_request,
                         httpx=SimpleNamespace(AsyncClient=Client, HTTPError=RuntimeError),
                         HTTPException=RuntimeError)
        exec(compile(ast.Module(body=[route], type_ignores=[]), str(source), "exec"), namespace)
        self.assertEqual(asyncio.run(namespace["openrouter_chat"]("system", "user", as_json)),
                         "assistant response")
        return seen

    def test_all_gemma_tags_use_bounded_context_and_unload(self):
        for model in GEMMA_PROMPT_MODELS:
            for as_json in (False, True):
                with self.subTest(model=model, as_json=as_json):
                    seen = self.call_route(model, as_json)
                    self.assertEqual(seen["timeout"], 600)
                    self.assertEqual(seen["url"], "http://ollama:11434/api/chat")
                    payload = seen["payload"]
                    self.assertEqual(payload["model"], model)
                    self.assertEqual(payload["keep_alive"], 0)
                    self.assertEqual(payload["options"]["num_ctx"], 8192)
                    self.assertEqual(payload["options"]["num_predict"], 1400)
                    self.assertEqual(payload.get("format"), "json" if as_json else None)
                    self.assertEqual(payload["options"]["temperature"], .2 if as_json else .7)

    def test_llama_aliases_and_sources_use_smaller_context_and_unload(self):
        for model in LLAMA_PROMPT_MODELS:
            for as_json in (False, True):
                with self.subTest(model=model, as_json=as_json):
                    seen = self.call_route(model, as_json)
                    self.assertEqual(seen["timeout"], 600)
                    payload = seen["payload"]
                    self.assertEqual(payload["model"], model)
                    self.assertEqual(payload["options"]["num_ctx"], 4096)
                    self.assertEqual(payload["options"]["num_predict"], 1400)
                    self.assertEqual(payload["keep_alive"], 0)
                    self.assertEqual(payload.get("format"), "json" if as_json else None)

    def test_other_models_keep_existing_request_behavior(self):
        seen = self.call_route("dolphin3:8b", False)
        self.assertEqual(seen["timeout"], 180)
        self.assertEqual(seen["payload"]["options"], {"temperature": .7})
        self.assertNotIn("keep_alive", seen["payload"])


if __name__ == "__main__":
    unittest.main()
