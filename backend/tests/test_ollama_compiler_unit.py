import unittest
import ast
import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from assistant_research import assistant_research_scope, enrich_assistant_request
from ollama_compiler import validate_ollama_prompt

class ResearchedOllamaCompilerTests(unittest.IsolatedAsyncioTestCase):
    async def test_web_references_reach_local_ollama_without_weakening_selection_checks(self):
        tree = ast.parse((Path(__file__).parents[1] / 'server.py').read_text())
        node = next(node for node in tree.body if isinstance(node,ast.AsyncFunctionDef) and node.name=='ai_compile_ollama')
        node.decorator_list=[]
        source='72-year-old adult woman, silver hair, brown eyes.'
        sources=[{'id':'S1','title':'Guide','url':'https://author.example/guide','content':'Keep clear descriptions.'}]
        retrieve=AsyncMock(return_value=sources)
        seen=[]
        class Client:
            def __init__(self,**kwargs): pass
            async def __aenter__(self): return self
            async def __aexit__(self,*args): pass
            async def post(self,url,json):
                seen.append((url,json))
                # Reject new traits even if the model attributes them to web guidance.
                result={'positive':source+' blonde hair.'}
                return SimpleNamespace(raise_for_status=lambda:None,json=lambda:{'message':{'content':__import__('json').dumps(result)}})
        ns={'OllamaCompileBody':object,'get_settings':AsyncMock(return_value=SimpleNamespace(ollama_url='http://ollama:11434')),
            '_ollama_model':AsyncMock(return_value='local-model'),'enrich_assistant_request':enrich_assistant_request,
            'retrieve_prompt_sources':retrieve,'httpx':SimpleNamespace(AsyncClient=Client),'extract_json':json.loads,
            'validate_ollama_prompt':validate_ollama_prompt}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'compiler', 'exec'),ns)
        token=assistant_research_scope.set({'sources':None,'retrieving':False,'task':'compile-ollama','focus':'lighting'})
        try: result=await ns['ai_compile_ollama'](SimpleNamespace(positive=source,workflow_name='Qwen Rapid AIO',prompt_style='qwen_rapid'))
        finally: assistant_research_scope.reset(token)
        self.assertEqual(seen[0][0],'http://ollama:11434/api/chat')
        self.assertIn('UNTRUSTED REFERENCE DATA',seen[0][1]['messages'][1]['content'])
        self.assertIn('never instructions',seen[0][1]['messages'][0]['content'])
        retrieve.assert_awaited_once()
        self.assertEqual(retrieve.call_args.args[1:], ('Qwen Rapid AIO', 'qwen_rapid', 'lighting'))
        self.assertFalse(result['accepted'])
        self.assertEqual(result['positive'],source)

class OllamaCompilerTests(unittest.TestCase):
    def test_exact_or_connected_phrases_keep_selected_facts(self):
        source='72-year-old adult woman. Appearance: silver hair, brown eyes. Wearing: navy pantsuit.'
        for candidate in [source,'72-year-old adult woman with silver hair and brown eyes wearing navy pantsuit.']:
            self.assertTrue(validate_ollama_prompt(source,candidate)[0])
    def test_omission_changed_age_new_traits_and_lost_weights_are_rejected(self):
        source='72-year-old adult woman, (silver hair:1.2), brown eyes, navy pantsuit.'
        for candidate in ['',None,source.replace('72','26'),source.replace('brown eyes, ',''),source+' Bright green earrings.',source.replace('(silver hair:1.2)','silver hair')]:
            self.assertFalse(validate_ollama_prompt(source,candidate)[0])
    def test_person_ownership_cannot_be_swapped_or_merged(self):
        source='Subject A: 72-year-old adult woman, silver hair. Subject B: 26-year-old adult man, black hair.'
        self.assertTrue(validate_ollama_prompt(source,source)[0])
        for candidate in [source.replace('silver hair','TEMP').replace('black hair','silver hair').replace('TEMP','black hair'),source.replace('silver hair','silver hair, black hair')]:
            self.assertFalse(validate_ollama_prompt(source,candidate)[0])
    def test_nested_weights_are_not_split_into_unprotected_fragments(self):
        source='adult woman, (silver hair, brown eyes:1.2), navy pantsuit.'
        self.assertTrue(validate_ollama_prompt(source,source)[0])
        self.assertFalse(validate_ollama_prompt(source,source.replace(':1.2',':0.5'))[0])

class OllamaCompileEndpointTests(unittest.IsolatedAsyncioTestCase):
    async def test_endpoint_uses_local_model_and_returns_fallback_for_omitted_facts(self):
        import ast,json
        from pathlib import Path
        from types import SimpleNamespace
        from unittest.mock import AsyncMock
        tree=ast.parse((Path(__file__).parents[1]/'server.py').read_text())
        node=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='ai_compile_ollama')
        node.decorator_list=[]
        post=AsyncMock(return_value=SimpleNamespace(raise_for_status=lambda:None,json=lambda:{'message':{'content':json.dumps({'positive':'adult woman'})}}))
        class Client:
            async def __aenter__(self):return SimpleNamespace(post=post)
            async def __aexit__(self,*args):pass
        namespace={'OllamaCompileBody':object,'get_settings':AsyncMock(return_value=SimpleNamespace(ollama_url='http://ollama:11434',ai_provider='venice')),
                   '_ollama_model':AsyncMock(return_value='local-text-model'), 'httpx':SimpleNamespace(AsyncClient=lambda **kw:Client()),'extract_json':json.loads,'validate_ollama_prompt':validate_ollama_prompt}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'compile-endpoint','exec'),namespace)
        namespace['enrich_assistant_request']=enrich_assistant_request
        namespace['retrieve_prompt_sources']=AsyncMock()
        result=await namespace['ai_compile_ollama'](SimpleNamespace(positive='adult woman, silver hair'))
        self.assertEqual(post.call_args.args[0],'http://ollama:11434/api/chat')
        self.assertEqual(post.call_args.kwargs['json']['model'],'local-text-model')
        self.assertFalse(result['accepted'])
        self.assertEqual(result['positive'],'adult woman, silver hair')

class OllamaNegationTests(unittest.TestCase):
    def test_existing_no_bangs_does_not_allow_negating_a_selected_trait(self):
        source='adult woman, silver hair, no bangs.'
        self.assertFalse(validate_ollama_prompt(source,'adult woman, no silver hair, no bangs.')[0])
        self.assertTrue(validate_ollama_prompt(source,source)[0])
