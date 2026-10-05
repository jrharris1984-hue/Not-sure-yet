"""Exercise the prompt route without loading the database-connected app."""
import ast
import asyncio
from pathlib import Path
from types import SimpleNamespace
import unittest


class FreeformPromptTests(unittest.TestCase):
    def call(self, freeform):
        seen = {}

        async def chat(system, user, response_format_json):
            seen.update(system=system, user=user, json=response_format_json)
            return {"positive": "Watercolor forest", "negative": "blur"}

        path = Path(__file__).resolve().parents[1] / "server.py"
        route = next(node for node in ast.parse(path.read_text()).body
                     if isinstance(node, ast.AsyncFunctionDef) and node.name == "ai_improve_generated_prompt")
        route.decorator_list = []
        namespace = dict(ImproveGeneratedPromptBody=object, HTTPException=RuntimeError,
                         extract_json=lambda value: value, openrouter_chat=chat)
        exec(compile(ast.Module(body=[route], type_ignores=[]), str(path), "exec"), namespace)
        result = asyncio.run(namespace[route.name](SimpleNamespace(
            positive="watercolor forest", negative="", prompt_style="chroma",
            workflow_name="Chroma", freeform=freeform)))
        self.assertEqual(result["positive"], "Watercolor forest")
        return seen

    def test_freeform_preserves_nonphotographic_intent(self):
        seen = self.call(True)
        self.assertIn("Do not impose photography", seen["system"])
        self.assertIn("subject count", seen["system"])
        self.assertNotIn("already compiled adult", seen["system"])
        self.assertIn("watercolor forest", seen["user"])
        self.assertTrue(seen["json"])

    def test_existing_builder_assistance_keeps_its_rules(self):
        seen = self.call(False)
        self.assertIn("already compiled adult", seen["system"])
        self.assertNotIn("Do not impose photography", seen["system"])


if __name__ == "__main__":
    unittest.main()
