import copy
import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from prompt_catalog import validate_prompt_catalog

class PromptCatalogTests(unittest.TestCase):
    def library(self):
        return {'sections':[{'key':'custom_lighting','title':'Lighting recipes','fields':[{'key':'custom_key','label':'Main light','type':'chips','options':[{'value':'custom_window','label':'Window light','keywords':'soft window light from the left','group':'Indoor'}]}]}]}
    def test_valid_library_normalizes_and_preserves_stable_identifiers(self):
        result=validate_prompt_catalog(self.library())
        self.assertEqual(result,self.library())
        self.assertEqual(validate_prompt_catalog({'sections':[]}),{'sections':[]})
    def test_rejects_duplicate_category_field_and_option_identifiers(self):
        for level in ['sections','fields','options']:
            value=self.library()
            target=value['sections'] if level=='sections' else value['sections'][0]['fields'] if level=='fields' else value['sections'][0]['fields'][0]['options']
            target.append(copy.deepcopy(target[0]))
            with self.assertRaises(ValueError):validate_prompt_catalog(value)
    def test_rejects_invalid_schema_and_oversized_keywords(self):
        for value in [None,{}, {'sections':'oops'}, {'sections':[None]}]:
            with self.assertRaises(ValueError):validate_prompt_catalog(value)
        value=self.library();value['sections'][0]['fields'][0]['options'][0]['keywords']='x'*1501
        with self.assertRaises(ValueError):validate_prompt_catalog(value)
    def test_rejects_reserved_identifiers_and_unknown_control_types(self):
        value=self.library();value['sections'][0]['key']='constructor'
        with self.assertRaises(ValueError):validate_prompt_catalog(value)
        value=self.library();value['sections'][0]['fields'][0]['type']='executable'
        with self.assertRaises(ValueError):validate_prompt_catalog(value)
    def test_labels_and_keywords_are_text_not_code(self):
        value=self.library();value['sections'][0]['fields'][0]['options'][0]['keywords']='<script>example</script>'
        self.assertEqual(validate_prompt_catalog(value),value)

    def test_rules_preserve_user_wording_scope_and_disabled_state(self):
        value=self.library();value['rules']=[{'key':'custom_rule','label':'Avoid haze','text':'clear air without haze','kind':'positive','scope':'image','enabled':False}]
        self.assertEqual(validate_prompt_catalog(value),value)
        value['rules'][0]['enabled']='false'
        with self.assertRaises(ValueError):validate_prompt_catalog(value)


class PromptLibraryAssistantTests(unittest.IsolatedAsyncioTestCase):
    async def run_assistant(self, response):
        import ast
        import json
        from unittest.mock import AsyncMock
        tree=ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
        node=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='ai_prompt_library')
        node.decorator_list=[]
        chat=AsyncMock(return_value=json.dumps(response))
        namespace={'PromptLibraryAssistBody':object,'openrouter_chat':chat,'extract_json':json.loads,'HTTPException':lambda status,detail:ValueError(detail)}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'<assistant-test>','exec'),namespace)
        class Body:
            def model_dump_json(self):return '{"label":"Morning mist","keywords":"gentle mist"}'
        return await namespace['ai_prompt_library'](Body()),chat
    async def test_returns_reviewable_phrase_and_instructs_model_to_preserve_selection(self):
        result,chat=await self.run_assistant({'keywords':'gentle morning mist'})
        self.assertEqual(result,{'keywords':'gentle morning mist'})
        self.assertIn('not a whole scene',chat.call_args.args[0])
        self.assertTrue(chat.call_args.kwargs['response_format_json'])
    async def test_rejects_malformed_empty_or_oversized_output(self):
        for response in [[],{}, {'keywords':''},{'keywords':['mist']},{'keywords':'x'*1501}]:
            with self.assertRaises(ValueError):await self.run_assistant(response)

class PromptCatalogSettingsTests(unittest.IsolatedAsyncioTestCase):
    async def setup_update(self):
        import ast
        from typing import Dict, Any
        from types import SimpleNamespace
        from unittest.mock import AsyncMock
        tree=ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
        node=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='update_settings')
        node.decorator_list=[]
        class Settings:
            def __init__(self,**doc):self.doc=doc
            def model_dump(self):return self.doc.copy()
        update=AsyncMock()
        namespace={'Dict':Dict,'Any':Any,'Body':lambda *args,**kwargs:None,'get_settings':AsyncMock(return_value=Settings(comfyui_url='http://comfy:8188',ollama_text_model='my-model',prompt_catalog={'sections':[]})),
                   'Settings':Settings,'db':SimpleNamespace(settings=SimpleNamespace(update_one=update)),
                   'validate_prompt_catalog':validate_prompt_catalog,'HTTPException':lambda status,detail:ValueError(detail),'now_iso':lambda:'now'}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'<settings-test>','exec'),namespace)
        return namespace['update_settings'], update
    async def test_persists_catalog_without_replacing_connection_or_assistant_settings(self):
        fn,update=await self.setup_update()
        library=PromptCatalogTests().library()
        result=await fn({'prompt_catalog':library})
        self.assertEqual(result.model_dump()['prompt_catalog'],library)
        written=update.call_args.args[1]['$set']
        self.assertEqual(written['comfyui_url'],'http://comfy:8188')
        self.assertEqual(written['ollama_text_model'],'my-model')
        self.assertEqual(written['prompt_catalog'],library)
    async def test_invalid_catalog_is_rejected_before_database_write(self):
        fn,update=await self.setup_update()
        with self.assertRaises(ValueError):await fn({'prompt_catalog':{'sections':'invalid'}})
        update.assert_not_awaited()
