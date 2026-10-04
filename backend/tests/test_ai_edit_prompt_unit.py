"""Exercise edit instruction routing without starting the database or calling AI."""
import ast
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock


class EditInstructionTests(unittest.IsolatedAsyncioTestCase):
    async def clarify(self, workflow_kind, preserve=True):
        tree = ast.parse((Path(__file__).resolve().parents[1] / "server.py").read_text())
        function = next(node for node in tree.body if isinstance(node, ast.AsyncFunctionDef)
                        and node.name == "ai_edit_prompt")
        function.decorator_list = []
        function.args.args[0].annotation = None
        chat = AsyncMock(return_value="  Make the dress blue.  ")
        namespace = {"openrouter_chat": chat}
        exec(compile(ast.Module(body=[function], type_ignores=[]), "server.py", "exec"), namespace)
        result = await namespace["ai_edit_prompt"](SimpleNamespace(
            instruction="blue dress", workflow_kind=workflow_kind, preserve_unmentioned=preserve))
        return result, chat.call_args

    async def test_variation_uses_source_variation_instructions(self):
        result, call = await self.clarify("variation")
        self.assertEqual(result, {"prompt": "Make the dress blue."})
        self.assertIn("Chroma", call.args[0])
        self.assertIn("Do not invent changes", call.args[0])
        self.assertIn("preserve every unmentioned", call.args[0])
        self.assertEqual(call.args[1], "blue dress")

    async def test_edit_keeps_qwen_instruction_routing(self):
        _, call = await self.clarify("edit")
        self.assertIn("Qwen Image Edit", call.args[0])
        self.assertNotIn("Chroma", call.args[0])

    async def test_preservation_remains_optional(self):
        _, call = await self.clarify("edit", preserve=False)
        self.assertNotIn("preserve every unmentioned", call.args[0])
