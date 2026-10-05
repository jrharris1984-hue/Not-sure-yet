"""Exercise the prompt route without loading the database-connected app."""
import ast
import asyncio
from pathlib import Path
from types import SimpleNamespace
import unittest
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from ai_research import prompt_research_messages, prompt_research_metadata, prompt_research_query


class FreeformPromptTests(unittest.TestCase):
    def call(self, freeform, research=False):
        seen = {}

        async def chat(system, user, response_format_json):
            seen.update(system=system, user=user, json=response_format_json)
            return {"positive": "Watercolor forest", "negative": "blur", "changes":["Clarified light"], "source_ids":["S1", "FAKE"]}

        async def retrieve(prompt, workflow, style, focus):
            seen['retrieval'] = (prompt, workflow, style, focus)
            return [{'id':'S1','title':'Author guide','url':'https://author.example/guide','content':'Use clear wording'}]

        path = Path(__file__).resolve().parents[1] / "server.py"
        route = next(node for node in ast.parse(path.read_text()).body
                     if isinstance(node, ast.AsyncFunctionDef) and node.name == "ai_improve_generated_prompt")
        route.decorator_list = []
        namespace = dict(ImproveGeneratedPromptBody=object, HTTPException=RuntimeError,
                         extract_json=lambda value: value, openrouter_chat=chat, retrieve_prompt_sources=retrieve,
                         prompt_research_messages=prompt_research_messages, prompt_research_metadata=prompt_research_metadata)
        exec(compile(ast.Module(body=[route], type_ignores=[]), str(path), "exec"), namespace)
        result = asyncio.run(namespace[route.name](SimpleNamespace(
            positive="watercolor forest", negative="", prompt_style="chroma",
            workflow_name="Chroma", freeform=freeform, use_web_research=research, research_focus="architecture")))
        self.assertEqual(result["positive"], "Watercolor forest")
        seen["result"] = result
        return seen

    def test_freeform_preserves_nonphotographic_intent(self):
        seen = self.call(True)
        self.assertIn("Do not impose photography", seen["system"])
        self.assertIn("subject count", seen["system"])
        self.assertNotIn("already compiled adult", seen["system"])
        self.assertIn("watercolor forest", seen["user"])
        self.assertTrue(seen["json"])

    def test_researched_refinement_preserves_requirements_and_returns_actual_sources(self):
        for freeform in (False, True):
            seen=self.call(freeform, True)
            self.assertIn("never override",seen["system"])
            self.assertIn("UNTRUSTED REFERENCE DATA",seen["user"])
            self.assertNotIn("exactly two strings",seen["system"])
            self.assertEqual(seen["result"]["sources"][0]["url"],"https://author.example/guide")
            self.assertEqual(seen["result"]["changes"],["Clarified light"])
        self.assertNotIn("retrieval",self.call(True))

    def test_video_research_keeps_mode_specific_rules(self):
        path=Path(__file__).resolve().parents[1]/"server.py"
        node=next(node for node in ast.parse(path.read_text()).body if isinstance(node,ast.AsyncFunctionDef) and node.name=="ai_video_prompt")
        node.decorator_list=[]
        seen={}
        async def retrieve(*args): return [{'id':'S1','title':'WAN guide','url':'https://author.example/wan','content':'Clear motion'}]
        async def chat(system,user,response_format_json):
            seen.update(system=system,json=response_format_json)
            return {'positive':'Slow pan','negative':'','source_ids':['S1']} if response_format_json else 'Slow pan'
        ns=dict(VideoPromptBody=object,retrieve_prompt_sources=retrieve,openrouter_chat=chat,extract_json=lambda value:value,HTTPException=RuntimeError,prompt_research_messages=prompt_research_messages,prompt_research_metadata=prompt_research_metadata)
        exec(compile(ast.Module(body=[node],type_ignores=[]),str(path),'exec'),ns)
        for mode in ('image','text'):
            for web in (False,True):
                result=asyncio.run(ns['ai_video_prompt'](SimpleNamespace(mode=mode,instruction='pan',use_web_research=web,research_focus='')))
                self.assertEqual(result['prompt'],'Slow pan')
                self.assertEqual(seen['json'],web)
                self.assertIn('source image already defines' if mode=='image' else 'one coherent shot',seen['system'])
                self.assertEqual('sources' in result,web)

    def test_existing_builder_assistance_keeps_its_rules(self):
        seen = self.call(False)
        self.assertIn("already compiled adult", seen["system"])
        self.assertNotIn("Do not impose photography", seen["system"])


if __name__ == "__main__":
    unittest.main()
