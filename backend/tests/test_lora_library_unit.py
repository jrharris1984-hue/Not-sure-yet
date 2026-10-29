import ast
import asyncio
from pathlib import Path
from types import SimpleNamespace
import sys
import unittest
from unittest.mock import AsyncMock
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lora_library import *

class LibraryTests(unittest.TestCase):
    def test_paths_and_hashes(self):
        self.assertEqual(record_id('Flux\\Light.safetensors'), record_id('flux/light.safetensors'))
        for name in ['../x', '/x', 'C:\\models\\x', '', 'x/../a']:
            with self.assertRaises(ValueError): file_key(name)
        self.assertEqual(validate_hash_import({'files':[{'name':'Flux/x.safetensors','sha256':'A'*64}]})[0]['sha256'],'a'*64)
        with self.assertRaises(ValueError): validate_hash_import({'files':[{'name':'x','sha256':'short'}]})

    def test_metadata_does_not_treat_caption_frequency_or_base_hash_as_trigger_or_file_hash(self):
        profile=metadata_profile({'ss_base_model_version':'sdxl_base_v1-0','ss_tag_frequency':'{"photo":90}', 'ss_new_sd_model_hash':'a'*64})
        self.assertEqual(profile['family'],'sdxl')
        self.assertEqual(profile['triggerWords'],[])
        self.assertNotIn('sha256',profile)
        self.assertEqual(metadata_profile({'modelspec.trigger_phrase':'photo style, photo style'})['triggerWords'],['photo style'])
        self.assertEqual(family_from_metadata('FLUX.2 dev'),'')

    def test_hash_match_requires_exact_file_and_lora_type(self):
        data={'id':2,'modelId':1,'baseModel':'SDXL 1.0','trainedWords':['light'], 'model':{'type':'LORA','name':'Light'},'files':[{'hashes':{'SHA256':'a'*64}}]}
        self.assertEqual(hash_profile(data,'a'*64)['family'],'sdxl')
        self.assertEqual(hash_profile(data,'a'*64)['sourceUrl'],'https://civitai.com/models/1?modelVersionId=2')
        with self.assertRaises(ValueError): hash_profile(data,'b'*64)
        with self.assertRaises(ValueError): hash_profile({**data,'files':None},'a'*64)
        with self.assertRaises(ValueError): hash_profile({**data,'model':{'type':'Checkpoint'}},'a'*64)

    def test_strength_validation(self):
        profile={'family':'sdxl','triggerWords':[' light ','light'],'minStrength':-2,'defaultStrength':-.5,'maxStrength':2}
        self.assertEqual(validate_profile(profile)['triggerWords'],['light'])
        self.assertEqual(signed_strength(-.75),-.75)
        self.assertEqual(signed_strength(-9),-2)
        for value in [float('nan'),float('inf'),'bad']:
            with self.assertRaises(ValueError): signed_strength(value)
        for patch in [{'defaultStrength':3},{'minStrength':2},{'maxStrength':float('nan')},{'family':'made-up'}]:
            with self.assertRaises(ValueError): validate_profile({**profile,**patch})

    def test_real_injection_keeps_negative_strength_and_shared_model_connections(self):
        tree=ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
        fn=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='_inject_selected_lora')
        class Response:
            def raise_for_status(self): pass
            def json(self): return {'LoraLoaderModelOnly':{}}
        class Client:
            def __init__(self,**kwargs): pass
            async def __aenter__(self): return self
            async def __aexit__(self,*args): pass
            async def get(self,*args): return Response()
        from typing import Any,Dict,Optional
        ns=dict(Any=Any,Dict=Dict,Optional=Optional,httpx=SimpleNamespace(AsyncClient=Client),signed_strength=signed_strength,
                _all_lora_options=lambda x:['light.safetensors'],_resolve_installed_lora=lambda a,b:a,
                _next_workflow_node_id=lambda w:str(max(map(int,w))+1))
        exec(compile(ast.Module(body=[fn],type_ignores=[]),'server.py','exec'),ns)
        graph={'1':{'class_type':'UNETLoader'},'2':{'class_type':'KSampler','inputs':{'model':['1',0]}},'3':{'class_type':'BasicGuider','inputs':{'model':['1',0]}}}
        result=asyncio.run(ns[fn.name](graph,'http://comfy','light.safetensors',-.7))
        self.assertEqual(result,('light.safetensors',1,None))
        self.assertEqual(graph['4']['inputs']['strength_model'],-.7)
        self.assertEqual(graph['2']['inputs']['model'],graph['3']['inputs']['model'])

if __name__=='__main__': unittest.main()

class RouteTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        class HTTPException(Exception): pass
        from typing import Dict,Any
        from datetime import datetime,timezone
        self.requests=[]
        self.old={'id':record_id('SDXL/light.safetensors'),'name':'SDXL/light.safetensors','profile':{'family':'sdxl'}}
        self.patches=[]
        async def find(query): return self.old
        async def update(query,patch,upsert): self.patches.append(patch['$set'])
        async def settings(): return SimpleNamespace(comfyui_url='http://comfy')
        async def installed(): return {'loras':['SDXL/light.safetensors']}
        owner=self
        class Response:
            status_code=200
            def json(self): return {'ss_base_model_version':'sdxl_base_v1-0','ss_new_sd_model_hash':'a'*64}
        class Client:
            def __init__(self,**kwargs): pass
            async def __aenter__(self): return self
            async def __aexit__(self,*args): pass
            async def get(self,url,**kwargs): owner.requests.append(url);return Response()
        self.error=HTTPException
        self.ns=dict(globals(),Dict=Dict,Any=Any,HTTPException=HTTPException,Body=lambda x:x,
            datetime=datetime,timezone=timezone,re=re,
            httpx=SimpleNamespace(AsyncClient=Client,HTTPError=OSError),get_settings=settings,comfyui_loras=installed,
            db=SimpleNamespace(lora_library=SimpleNamespace(find_one=find,update_one=update)))
        tree=ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
        for name in ['scan_lora_library_file','import_lora_hashes']:
            fn=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name==name)
            fn.decorator_list=[]
            exec(compile(ast.Module(body=[fn],type_ignores=[]),'server.py','exec'),self.ns)

    async def test_local_scan_preserves_reviewed_profile(self):
        result=await self.ns['scan_lora_library_file']({'name':self.old['name']})
        self.assertEqual(result['profile'],{'family':'sdxl'})
        self.assertNotIn('profile',self.patches[0])
        self.assertEqual(len(self.requests),1)
        self.assertTrue(self.requests[0].startswith('http://comfy/'))

    async def test_base_model_hash_is_never_used_for_online_lookup(self):
        result=await self.ns['scan_lora_library_file']({'name':self.old['name'],'online':True})
        self.assertEqual(len(self.requests),1)
        self.assertIn('Import file hashes',result['lookup_status'])

    async def test_uninstalled_paths_are_not_requested(self):
        with self.assertRaises(self.error):
            await self.ns['scan_lora_library_file']({'name':'other.safetensors'})
        self.assertEqual(self.requests,[])

    async def test_replaced_hash_invalidates_stale_profiles_and_basename_is_not_matched(self):
        result=await self.ns['import_lora_hashes']({'files':[{'name':self.old['name'],'sha256':'a'*64},{'name':'light.safetensors','sha256':'b'*64}]})
        self.assertEqual(result,{'imported':1,'unmatched':1,'invalidated':['SDXL/light.safetensors']})
        self.assertEqual(self.patches[0]['profile'],{})
        self.assertEqual(self.patches[0]['detected'],{})
