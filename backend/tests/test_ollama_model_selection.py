"""Unit tests for Ollama text/vision model selection."""
import ast
import asyncio
from pathlib import Path
from types import SimpleNamespace
import unittest


class OllamaModelSelectionTests(unittest.TestCase):
    def selected(self, models, vision=False, text_model="", vision_model=""):
        source = Path(__file__).resolve().parents[1] / "server.py"
        node = next(
            item for item in ast.parse(source.read_text()).body
            if isinstance(item, ast.AsyncFunctionDef) and item.name == "_ollama_model"
        )

        class Response:
            def raise_for_status(self):
                pass

            def json(self):
                return {"models": [{"name": name} for name in models]}

        class Client:
            def __init__(self, timeout):
                self.timeout = timeout

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                pass

            async def get(self, url):
                return Response()

        class HTTPException(Exception):
            def __init__(self, status_code, detail):
                super().__init__(detail)

        namespace = {
            "httpx": SimpleNamespace(AsyncClient=Client, HTTPError=RuntimeError),
            "HTTPException": HTTPException,
            "Settings": object,
        }
        exec(compile(ast.Module(body=[node], type_ignores=[]), str(source), "exec"), namespace)
        settings = SimpleNamespace(
            ollama_url="http://ollama:11434",
            ollama_text_model=text_model,
            ollama_vision_model=vision_model,
        )
        return asyncio.run(namespace["_ollama_model"](settings, vision))

    def test_text_auto_prefers_gradient_over_qwen_vision(self):
        models = ["qwen3-vl:8b-instruct", "dolphin3:8b", "llama3-gradient:8b-instruct-1048k-q4_K_M"]
        self.assertEqual(
            self.selected(models),
            "llama3-gradient:8b-instruct-1048k-q4_K_M",
        )

    def test_saved_qwen_vision_text_model_is_ignored(self):
        models = ["qwen3-vl:8b-instruct", "llama3-gradient:8b-instruct-1048k-q4_K_M"]
        self.assertEqual(
            self.selected(models, text_model="qwen3-vl:8b-instruct"),
            "llama3-gradient:8b-instruct-1048k-q4_K_M",
        )

    def test_vision_auto_still_uses_qwen(self):
        models = ["llama3-gradient:8b-instruct-1048k-q4_K_M", "qwen3-vl:8b-instruct"]
        self.assertEqual(self.selected(models, vision=True), "qwen3-vl:8b-instruct")


if __name__ == "__main__":
    unittest.main()
