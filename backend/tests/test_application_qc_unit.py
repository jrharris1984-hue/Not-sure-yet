"""Real API routes against disposable SQLite; no GPU or external services."""
import importlib
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch, AsyncMock
import httpx
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlite_storage import SQLiteDatabase

class ApplicationQcTests(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        import media_library
        cls.media=media_library
        cls.providers=(media_library._url_provider, media_library._overlay_provider)
        cls.bootstrap=tempfile.TemporaryDirectory()
        with patch.dict(os.environ,{'ULTRA_STUDIO_STORAGE':'sqlite','ULTRA_STUDIO_DATA_DIR':cls.bootstrap.name}):
            cls.server=importlib.import_module('server')
        cls.original_db=cls.server.db
    @classmethod
    def tearDownClass(cls):
        cls.media.configure_media_library_url(cls.providers[0])
        cls.media.configure_media_overlays(cls.providers[1])
        cls.server.db=cls.original_db
        cls.server.client.close()
        cls.bootstrap.cleanup()
    async def asyncSetUp(self):
        self.folder=tempfile.TemporaryDirectory()
        self.db=SQLiteDatabase(Path(self.folder.name)/'qc.sqlite3')
        self.server.db=self.db
        self.http=httpx.AsyncClient(transport=httpx.ASGITransport(app=self.server.app),base_url='http://qc')
    async def asyncTearDown(self):
        await self.http.aclose()
        self.db.close()
        self.folder.cleanup()
    async def test_character_save_duplicate_and_tags_preserve_selections(self):
        dna={'identity':{'age':42},'hair':{'color':'silver'},'wardrobe':{'bottom':'jeans'}}
        response=await self.http.post('/api/characters',json={'name':'QC [A]','dna':dna,'tags':['qc'],'field_locks':{'hair':{'color':True}},'collapsed':{'hair':False}})
        self.assertEqual(response.status_code,200)
        character=response.json()
        duplicate=await self.http.post(f"/api/characters/{character['id']}/duplicate")
        self.assertEqual(duplicate.status_code,200)
        self.assertNotEqual(duplicate.json()['id'],character['id'])
        self.assertEqual(duplicate.json()['dna'],dna)
        self.assertEqual((await self.http.get('/api/characters/tags')).json(),[{'tag':'qc','count':2}])
        loaded=(await self.http.get(f"/api/characters/{character['id']}")).json()
        self.assertEqual(loaded['field_locks'],character['field_locks'])
        self.assertEqual(loaded['collapsed'],{'hair':False})
    async def test_search_treats_punctuation_as_literal_text(self):
        await self.http.post('/api/characters',json={'name':'QC [A]'})
        await self.http.post('/api/characters',json={'name':'Other'})
        response=await self.http.get('/api/characters',params={'q':'['})
        self.assertEqual(response.status_code,200)
        self.assertEqual([item['name'] for item in response.json()],['QC [A]'])
    async def test_invalid_settings_do_not_poison_future_requests(self):
        before=(await self.http.get('/api/settings')).json()
        response=await self.http.put('/api/settings',json={'ai_provider':'unsupported','comfyui_url':'http://changed'})
        self.assertEqual(response.status_code,422)
        after=(await self.http.get('/api/settings')).json()
        self.assertEqual(after['ai_provider'],before['ai_provider'])
        self.assertEqual(after['comfyui_url'],before['comfyui_url'])
    async def test_settings_types_are_validated_before_persistence(self):
        await self.http.get('/api/settings')
        for body in ({'ollama_url':{}},{'default_workflow_id':[]},{'image_workflow_json':{}}):
            with self.subTest(body=body):
                self.assertEqual((await self.http.put('/api/settings',json=body)).status_code,422)
                self.assertEqual((await self.http.get('/api/settings')).status_code,200)
    async def test_negative_list_limits_are_rejected_at_the_route_boundary(self):
        for path in ('characters','queue','shoots'):
            with self.subTest(path=path):
                self.assertEqual((await self.http.get('/api/'+path,params={'limit':-1})).status_code,422)
    async def test_catalog_validation_is_atomic_with_connection_settings(self):
        before=(await self.http.get('/api/settings')).json()
        response=await self.http.put('/api/settings',json={'comfyui_url':'http://changed','prompt_catalog':{'sections':'invalid'}})
        self.assertEqual(response.status_code,400)
        self.assertEqual((await self.http.get('/api/settings')).json()['comfyui_url'],before['comfyui_url'])
    async def test_gallery_pagination_and_bulk_albums_keep_records_independent(self):
        for index in range(3):
            await self.db.renders.insert_one({'id':f'r{index}','status':'done','output_files':[f'/image{index}.png'],'created_at':'2026-10-11T12:00:00Z'})
        page=(await self.http.get('/api/renders',params={'limit':2,'skip':1})).json()
        self.assertEqual([item['id'] for item in page],['r1','r0'])
        response=await self.http.post('/api/renders/albums/bulk',json={'ids':['r0','r0','r1'],'album':'QC'})
        self.assertEqual(response.json()['updated'],2)
        self.assertIsNone((await self.db.renders.find_one({'id':'r2'})).get('album'))
    async def test_character_gallery_filters_before_pagination_and_keeps_video(self):
        for index in range(5):
            await self.db.renders.insert_one({'id':f'r{index}', 'character_id':'a' if index % 2 == 0 else 'b',
                'status':'done','output_files':[f'/image{index}.png'],'created_at':'2026-10-11T12:00:00Z',
                'workflow_type':'video' if index == 2 else 'image'})
        await self.db.renders.insert_one({'id':'hidden','character_id':'a','hidden_from_gallery':True,'output_files':['hidden.png']})
        page=(await self.http.get('/api/renders',params={'character_id':'a','limit':2,'skip':1})).json()
        self.assertEqual([item['id'] for item in page],['r2','r0'])
        self.assertEqual(page[0]['workflow_type'],'video')
        self.assertEqual((await self.http.get('/api/renders',params={'character_id':'missing'})).json(),[])

    async def test_queued_render_retry_keeps_exact_seed_and_recipe(self):
        settings=(await self.http.get('/api/settings')).json()
        workflow=settings['workflows'][0]
        dna={'identity':{'age':42},'hair':{'color':'silver'}}
        response=await self.http.post('/api/renders/dispatch',json={'workflow_id':workflow['id'],'prompt_positive':'QC portrait','seed':42,'dna':dna})
        self.assertEqual(response.status_code,200)
        job=response.json()
        self.assertEqual(job['status'],'queued')
        stored=await self.db.render_queue.find_one({'id':job['id']})
        self.assertEqual(stored['payload']['dna'],dna)
        self.assertEqual(stored['payload']['seed'],42)
        self.assertEqual((await self.http.post(f"/api/queue/{job['id']}/retry")).status_code,409)
        await self.db.render_queue.update_one({'id':job['id']},{'$set':{'status':'failed','error':'Test failure'}})
        self.assertEqual((await self.http.post(f"/api/queue/{job['id']}/retry")).json()['status'],'queued')
        updated=await self.db.render_queue.find_one({'id':job['id']})
        self.assertEqual(updated['payload'],stored['payload'])
    async def test_chroma_hd_dispatch_sends_exact_prompts_settings_and_seed(self):
        import json
        settings = (await self.http.get('/api/settings')).json()
        selected = next(workflow for workflow in settings['workflows'] if workflow['name'] == 'Chroma1-HD · Golden T2I')
        original = json.loads(selected['json_str'])
        captured = {}
        class ComfyClient:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def post(self, url, *, json):
                captured.update(json)
                return httpx.Response(200, json={'prompt_id':'qc-chroma-job'})
        body = self.server.DispatchBody(workflow_id=selected['id'], character_id='qc-character',
            prompt_positive='One adult woman in a navy linen suit, full-length photograph, soft daylight',
            prompt_negative='blur, extra limbs', width=896, height=1344, steps=30, cfg=4.0,
            sampler_name='heun', seed=987654321, batch_size=1,
            scene_review={'task':'text-to-image','subject_count':1,'sections':[{'label':'Subject','details':['Navy linen suit']}], 'framing':['full body'], 'missing':['scene']})
        with patch.object(self.server.httpx, 'AsyncClient', return_value=ComfyClient()):
            result = await self.server._perform_dispatch(body)
        graph = captured['prompt']
        self.assertEqual(graph['748']['inputs']['text'], body.prompt_positive)
        self.assertEqual(graph['749']['inputs']['text'], body.prompt_negative)
        self.assertEqual(graph['718']['inputs']['noise_seed'], 987654321)
        self.assertEqual(graph['694']['inputs']['cfg'], 4.0)
        self.assertEqual(graph['700']['inputs']['sampler_name'], 'heun')
        self.assertEqual(graph['751']['inputs']['steps'], 30)
        self.assertEqual(graph['737']['inputs']['width'], 896)
        self.assertEqual(graph['737']['inputs']['height'], 1344)
        for node in ['731','733','710','741','701']:
            self.assertEqual(graph[node], original[node])
        self.assertEqual(graph['751']['inputs']['alpha'], original['751']['inputs']['alpha'])
        self.assertEqual(graph['751']['inputs']['beta'], original['751']['inputs']['beta'])
        self.assertEqual(result['mapping'], {'positive':True,'negative':True})
        self.assertEqual(result['seed_used'], 987654321)
        self.assertEqual(result['render_recipe']['steps'], 30)
        self.assertEqual(result['render_recipe']['prompt_positive'], body.prompt_positive)
        self.assertEqual(result['learning_context']['version'],1)
        self.assertIn('graph_signature',result['learning_context'])
        self.assertEqual(result['scene_review'], body.scene_review.model_dump())
        stored=await self.db.renders.find_one({'id':result['id']})
        self.assertEqual(stored['scene_review'], stored['render_recipe']['scene_review'])
        self.assertEqual(result['comfy_prompt_id'], 'qc-chroma-job')
        self.assertEqual((await self.server.get_settings()).workflows[[item['id'] for item in settings['workflows']].index(selected['id'])].json_str, selected['json_str'])

    async def test_chroma_variation_dispatch_uses_source_strength_and_requested_seed(self):
        import json
        settings = (await self.http.get('/api/settings')).json()
        selected = next(workflow for workflow in settings['workflows'] if workflow['name'] == 'Chroma1-HD · Image Variations')
        legacy = (Path(__file__).parent / 'fixtures/chroma_variation_legacy.json').read_text()
        # Persist the old bundle to exercise dispatch-time repair for existing installs.
        for workflow in settings['workflows']:
            if workflow['id'] == selected['id']: workflow['json_str'] = legacy
        await self.db.settings.update_one({'id':'singleton'}, {'$set': {'workflows': settings['workflows']}})
        captured = []
        class ComfyClient:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def post(self, url, *, json):
                captured.append(json['prompt'])
                return httpx.Response(200, json={'prompt_id':'qc-variation-job'})
        for strength, seed in [(0.22, 101), (0.35, 202)]:
            body = self.server.DispatchBody(workflow_id=selected['id'], reference_image='selected_source.png',
                prompt_positive='A slight natural smile, same photograph', refine_denoise=strength, seed=seed)
            with patch.object(self.server.httpx, 'AsyncClient', return_value=ComfyClient()):
                result = await self.server._perform_dispatch(body)
            graph = captured[-1]
            self.assertEqual(graph['14']['inputs']['image'], 'selected_source.png')
            self.assertEqual(graph['12']['inputs']['noise_seed'], seed)
            self.assertEqual(graph['10']['inputs']['denoise'], strength)
            self.assertEqual(graph['10']['inputs']['scheduler'], 'simple')
            self.assertEqual(graph['16']['inputs']['sigmas'], ['10', 0])
            self.assertEqual(graph['6']['inputs']['text'], body.prompt_positive)
            self.assertEqual(result['seed_used'], seed)
            self.assertEqual(result['render_recipe']['refine_denoise'], strength)
            self.assertEqual(result['effective_node_settings']['10']['denoise'], strength)
        self.assertNotEqual(captured[0]['12'], captured[1]['12'])
        stored = await self.server.get_settings()
        self.assertEqual(next(w.json_str for w in stored.workflows if w.id == selected['id']), legacy)

    async def test_glamour_bf16_dispatch_preserves_selected_model_and_both_prompts(self):
        import json
        settings = (await self.http.get('/api/settings')).json()
        selected = next(workflow for workflow in settings['workflows'] if workflow['name'] == 'Krea 2 · CamGlam BF16 Test')
        self.assertIn('Experimental', selected['notes'])
        graph = json.loads(selected['json_str'])
        info = {node['class_type']: {'input': {'required': {}}} for node in graph.values()}
        for node in graph.values():
            for field in ['unet_name','clip_name','vae_name']:
                if field in node['inputs']: info[node['class_type']]['input']['required'][field] = [[node['inputs'][field]]]
            if node['class_type'] == 'CLIPLoader': info['CLIPLoader']['input']['required']['type'] = [['krea2']]
        captured = {}
        class ComfyClient:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def post(self, url, *, json):
                captured.update(json)
                return httpx.Response(200, json={'prompt_id':'qc-glamour-job'})
        body = self.server.DispatchBody(workflow_id=selected['id'], prompt_positive='Adult fashion portrait in a navy gown',
            prompt_negative='blur, watermark', steps=20, cfg=3.5, sampler_name='heun', seed=77)
        with patch.object(self.server, '_krea2_object_info', AsyncMock(return_value=info)), patch.object(self.server.httpx, 'AsyncClient', return_value=ComfyClient()):
            result = await self.server._perform_dispatch(body)
        dispatched = captured['prompt']
        self.assertEqual(dispatched['1']['inputs']['unet_name'], graph['1']['inputs']['unet_name'])
        self.assertEqual(dispatched['4']['inputs']['text'], body.prompt_positive)
        self.assertEqual(dispatched['5']['inputs']['text'], body.prompt_negative)
        self.assertEqual(dispatched['7']['inputs']['steps'], 20)
        self.assertEqual(dispatched['7']['inputs']['cfg'], 3.5)
        self.assertEqual(dispatched['7']['inputs']['seed'], 77)
        self.assertEqual(result['status'], 'running')

    async def test_kroma_dispatch_preserves_model_shift_and_adjustable_turbo_recipe(self):
        import json
        settings = (await self.http.get('/api/settings')).json()
        selected = next(workflow for workflow in settings['workflows'] if workflow['name'] == 'Kroma · v0.3.1 Turbo OPD')
        self.assertEqual(selected['prompt_style'], 'kroma')
        graph = json.loads(selected['json_str'])
        info = {node['class_type']: {'input': {'required': {}}} for node in graph.values()}
        for node in graph.values():
            for field in ['unet_name','clip_name','vae_name']:
                if field in node['inputs']: info[node['class_type']]['input']['required'][field] = [[node['inputs'][field]]]
            if node['class_type'] == 'CLIPLoader': info['CLIPLoader']['input']['required']['type'] = [['krea2']]
        captured = {}
        class ComfyClient:
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def post(self, url, *, json):
                captured.update(json)
                return httpx.Response(200, json={'prompt_id':'qc-kroma-job'})
        body = self.server.DispatchBody(workflow_id=selected['id'], prompt_positive='Adult fashion portrait in a navy gown',
            prompt_negative='blur, watermark', steps=12, cfg=1.5, sampler_name='euler', seed=77)
        with patch.object(self.server, '_krea2_object_info', AsyncMock(return_value=info)), patch.object(self.server.httpx, 'AsyncClient', return_value=ComfyClient()):
            result = await self.server._perform_dispatch(body)
        dispatched = captured['prompt']
        self.assertEqual(dispatched['1']['inputs']['unet_name'], graph['1']['inputs']['unet_name'])
        self.assertEqual(dispatched['4']['inputs']['text'], body.prompt_positive)
        self.assertEqual(dispatched['5']['inputs']['text'], body.prompt_negative)
        self.assertEqual(dispatched['7']['inputs']['steps'], 12)
        self.assertEqual(dispatched['7']['inputs']['cfg'], 1.5)
        self.assertEqual(dispatched['7']['inputs']['seed'], 77)
        self.assertEqual(dispatched['7']['inputs']['model'], ['10', 0])
        self.assertEqual(dispatched['10']['inputs']['model'], ['1', 0])
        self.assertEqual(dispatched['10']['inputs']['max_shift'], 1.15)
        self.assertEqual(dispatched['10']['inputs']['base_shift'], 1.15)
        self.assertEqual(dispatched['7']['inputs']['scheduler'], 'simple')
        self.assertEqual(result['status'], 'running')

    async def test_new_local_workflows_dispatch_actual_graphs_and_store_reference_roles(self):
        import json
        from test_local_model_workflows_unit import info_for
        settings=(await self.http.get('/api/settings')).json()
        for style in ['flux1_dev','flux2_klein_edit','qwen_reference','wan5b_t2v']:
            selected=next(w for w in settings['workflows'] if w['prompt_style']==style)
            template=json.loads(selected['json_str']);info=info_for(template)
            captured={}
            class ComfyClient:
                async def __aenter__(self):return self
                async def __aexit__(self,*args):pass
                async def post(self,url,*,json):
                    captured.update(json)
                    return httpx.Response(200,json={'prompt_id':'qc-new-'+style})
            options={'workflow_id':selected['id'],'prompt_positive':'Studio portrait','seed':91,'width':512,'height':768}
            if style in ['flux2_klein_edit','qwen_reference']:
                options.update(reference_images=['refs/a.png','refs/b.png'],edit_instruction='Combine image 1 and image 2 in a studio.')
            if style=='wan5b_t2v':options.update(video_instruction='A sailboat moves slowly.',video_width=643,video_height=387,video_frames=82,video_fps=20)
            with patch.object(self.server,'_krea2_object_info',AsyncMock(return_value=info)),patch.object(self.server.httpx,'AsyncClient',return_value=ComfyClient()):
                result=await self.server._perform_dispatch(self.server.DispatchBody(**options))
            self.assertEqual(result['status'],'running',result.get('error'))
            g=captured['prompt']
            if style in ['flux2_klein_edit','qwen_reference']:
                self.assertEqual(g['reference_image_1']['inputs']['image'],'refs/a.png')
                self.assertEqual(g['reference_image_2']['inputs']['image'],'refs/b.png')
                self.assertEqual(result['render_recipe']['reference_images'],['refs/a.png','refs/b.png'])
                prompt_key='prompt' if style=='qwen_reference' else 'text'
                self.assertEqual(g['positive']['inputs'][prompt_key],options['edit_instruction'])
            if style=='wan5b_t2v':
                self.assertEqual(g['55']['inputs']['width'],640)
                self.assertEqual(g['55']['inputs']['height'],384)
                self.assertEqual(g['55']['inputs']['length'],81)
                self.assertNotIn('start_image',g['55']['inputs'])
                self.assertEqual(g['47']['inputs']['fps'],20)
                self.assertEqual(result['render_recipe']['video_width'],640)
                self.assertEqual(result['render_recipe']['video_frames'],81)
            if style=='flux1_dev':self.assertEqual(g['positive_text']['inputs']['text'],'Studio portrait')
            stored=next(w for w in (await self.server.get_settings()).workflows if w.id==selected['id'])
            self.assertEqual(selected['json_str'],stored.json_str)

    async def test_reference_composer_rejects_one_image_before_contacting_comfy(self):
        settings=(await self.http.get('/api/settings')).json()
        selected=next(w for w in settings['workflows'] if w['prompt_style']=='qwen_reference')
        with patch.object(self.server,'_krea2_object_info',AsyncMock()) as lookup:
            result=await self.server._perform_dispatch(self.server.DispatchBody(workflow_id=selected['id'],reference_images=['a.png'],edit_instruction='Combine images'))
        self.assertEqual(result['status'],'failed')
        self.assertIn('2–3',result['error'])
        lookup.assert_not_awaited()

    async def test_zimage_dispatch_resolves_moved_files_and_survives_missing_detector(self):
        import json
        from test_zimage_setup_unit import info_for
        settings=(await self.http.get('/api/settings')).json()
        for name in ['Z-image Turbo · NSFW','Z-Image Turbo · Base (No LoRA)']:
            selected=next(w for w in settings['workflows'] if w['name']==name)
            graph=json.loads(selected['json_str']);info=info_for(graph)
            if 'UltralyticsDetectorProvider' in info:info['UltralyticsDetectorProvider']['input']['required']['model_name']=[[]]
            captured={}
            class ComfyClient:
                async def __aenter__(self):return self
                async def __aexit__(self,*args):pass
                async def post(self,url,*,json):
                    captured.update(json);return httpx.Response(200,json={'prompt_id':'qc-zimage'})
            with patch.object(self.server,'_krea2_object_info',AsyncMock(return_value=info)),patch.object(self.server.httpx,'AsyncClient',return_value=ComfyClient()):
                result=await self.server._perform_dispatch(self.server.DispatchBody(workflow_id=selected['id'],prompt_positive='A sailboat on a calm lake.',seed=72))
            self.assertEqual(result['status'],'running',result.get('error'))
            sent=captured['prompt']
            self.assertEqual(sent['57:27']['inputs']['text'],'A sailboat on a calm lake.')
            self.assertEqual(sent['57:3']['inputs']['seed'],72)
            self.assertIn('9',sent);self.assertNotIn('105',sent)
            if '57:62' in sent:
                self.assertEqual(sent['57:62']['inputs']['lora_name'],'local/ZITnsfwLoRA.safetensors')
                self.assertIn('Original image only',result['setup_notes'][0])
            stored=next(w for w in (await self.server.get_settings()).workflows if w.id==selected['id'])
            self.assertEqual(stored.json_str,selected['json_str'])

    async def test_missing_records_return_not_found(self):
        for path in ('characters/missing','renders/missing','renders/missing/recipe','shoots/missing'):
            self.assertEqual((await self.http.get('/api/'+path)).status_code,404)

    async def test_missing_selected_workflow_cannot_silently_use_the_default(self):
        await self.http.get('/api/settings')
        response=await self.http.post('/api/renders/dispatch',json={'workflow_id':'missing','prompt_positive':'QC portrait'})
        self.assertEqual(response.status_code,404)
        self.assertEqual(await self.db.render_queue.count_documents({}),0)
        with self.assertRaises(self.server.HTTPException) as caught:
            await self.server._perform_dispatch(self.server.DispatchBody(workflow_id='missing'))
        self.assertEqual(caught.exception.status_code,404)

    async def test_legacy_dispatch_freezes_the_default_workflow_before_it_can_change(self):
        settings=(await self.http.get('/api/settings')).json()
        first=settings['default_workflow_id']
        response=await self.http.post('/api/renders/dispatch',json={'prompt_positive':'QC portrait'})
        self.assertEqual(response.status_code,200)
        await self.http.put('/api/settings',json={'default_workflow_id':settings['workflows'][1]['id']})
        stored=await self.db.render_queue.find_one({'id':response.json()['id']})
        self.assertEqual(stored['payload']['workflow_id'],first)

    async def test_danrisimix_seed_refresh_and_missing_scheduler_error(self):
        settings = (await self.http.get('/api/settings')).json()
        default = settings['default_workflow_id']
        initial = next(workflow for workflow in settings['workflows'] if workflow['prompt_style'] == 'chroma_turbo')
        self.assertEqual((await self.http.delete('/api/workflows/' + initial['id'])).status_code, 200)
        refreshed = await self.http.post('/api/workflows/seed')
        self.assertEqual(refreshed.status_code, 200)
        self.assertEqual(refreshed.json()['added'], 1)
        current = (await self.http.get('/api/settings')).json()
        self.assertEqual(current['default_workflow_id'], default)
        selected = next(workflow for workflow in current['workflows'] if workflow['prompt_style'] == 'chroma_turbo')
        self.assertEqual(selected['positive_node_id'], '748')
        self.assertEqual(selected['negative_node_id'], '749')
        self.assertEqual((await self.http.post('/api/workflows/seed')).json()['added'], 0)
        from test_separate_image_models_unit import SeparateImageModelsTests
        import json
        graph = json.loads(selected['json_str'])
        info = SeparateImageModelsTests().info(graph)
        del info['SigmoidOffsetScheduler']
        with patch.object(self.server, '_krea2_object_info', AsyncMock(return_value=info)):
            result = await self.server._perform_dispatch(self.server.DispatchBody(workflow_id=selected['id'], prompt_positive='Mountain lake'))
        self.assertEqual(result['status'], 'failed')
        self.assertIn('ComfyUI node: SigmoidOffsetScheduler', result['error'])
        self.assertIn('https://github.com/silveroxides/ComfyUI_SigmoidOffsetScheduler', result['error'])

    async def test_unlocked_and_clyb_refresh_adds_exact_models_and_keeps_existing_ids(self):
        import json
        before = (await self.http.get('/api/settings')).json()
        names = {'Chroma · Unlocked v50': 'chroma-unlocked-v50.safetensors',
                 'Chroma · Clyb Uncanny 2K Flash v19': 'ClybUncannyChroma1-2K-Flash-v19.safetensors'}
        for workflow in before['workflows']:
            if workflow['name'] in names:
                self.assertEqual((await self.http.delete('/api/workflows/' + workflow['id'])).status_code, 200)
        refreshed = await self.http.post('/api/workflows/seed')
        self.assertEqual(refreshed.json()['added'], 2)
        current = (await self.http.get('/api/settings')).json()
        self.assertEqual(current['default_workflow_id'], before['default_workflow_id'])
        kept = {w['name']: w['id'] for w in current['workflows'] if w['name'] not in names}
        self.assertEqual(kept, {w['name']: w['id'] for w in before['workflows'] if w['name'] not in names})
        for workflow in current['workflows']:
            if workflow['name'] in names:
                graph = json.loads(workflow['json_str'])
                self.assertEqual(graph['731']['inputs']['unet_name'], names[workflow['name']])
                self.assertEqual(workflow['positive_node_id'], '748')
                self.assertEqual(workflow['negative_node_id'], '749')
        self.assertEqual((await self.http.post('/api/workflows/seed')).json()['added'], 0)

    async def test_scene_feedback_persists_without_rewriting_render_intentions(self):
        plan={'version':1,'task':'text-to-image','subject_count':1,'sections':[{'label':'Subject','details':['Navy suit']}],'missing':[],'adjustments':[]}
        recipe={'scene_review':plan,'seed':123,'prompt_positive':'Navy suit in a studio'}
        await self.db.renders.insert_one({'id':'review-me','render_recipe':recipe,'scene_review':plan,'status':'done'})
        response=await self.http.put('/api/renders/review-me/scene-feedback',json={'ratings':{'pose':'matched','framing':'missed'},'notes':'Feet were cropped.'})
        self.assertEqual(response.status_code,200)
        feedback=response.json()
        self.assertEqual(feedback['ratings']['framing'],'missed')
        self.assertTrue(feedback['updated_at'])
        loaded=(await self.http.get('/api/renders/review-me')).json()
        self.assertEqual(loaded['scene_feedback'],feedback)
        self.assertEqual(loaded['scene_review'],plan)
        self.assertEqual(loaded['render_recipe'],recipe)
        cleared=await self.http.put('/api/renders/review-me/scene-feedback',json={'ratings':{},'notes':''})
        self.assertEqual(cleared.status_code,200)
        self.assertEqual(cleared.json()['ratings']['framing'],'')
        self.assertEqual((await self.http.get('/api/renders/review-me/recipe')).json()['recipe'],recipe)

    async def test_scene_feedback_and_intentions_validate_at_api_boundary(self):
        self.assertEqual((await self.http.put('/api/renders/missing/scene-feedback',json={})).status_code,404)
        await self.db.renders.insert_one({'id':'review-me','status':'done'})
        for body in ({'ratings':{'pose':'invented'}}, {'ratings':{'unrecognized':'matched'}}, {'notes':'x'*2001}, {'scene_review':{}}):
            with self.subTest(body=str(body)[:80]):
                self.assertEqual((await self.http.put('/api/renders/review-me/scene-feedback',json=body)).status_code,422)
        self.assertNotIn('scene_feedback',await self.db.renders.find_one({'id':'review-me'}))
        for plan in ({'task':'unknown','subject_count':1,'sections':[]}, {'task':'text-to-image','subject_count':0,'sections':[]}):
            self.assertEqual((await self.http.post('/api/renders/dispatch',json={'scene_review':plan})).status_code,422)

    async def test_learning_history_decisions_persist_and_recheck_evidence(self):
        from learning_history import LearningContext, workflow_revision, profile
        from test_learning_history_unit import example
        workflow=next(item for item in (await self.server.get_settings()).workflows if item.kind=='image')
        context=LearningContext(workflow_id=workflow.id,generation={'steps':8,'cfg':1},framing=['full body'])
        for index in range(3):
            record=example(index+1,workflow_id=workflow.id)
            record['learning_context'].update(workflow_revision=workflow_revision(workflow),profile=profile(context,workflow.prompt_style))
            await self.db.renders.insert_one(record)
        request=context.model_dump()
        response=await self.http.post('/api/learning/history',json=request)
        self.assertEqual(response.status_code,200)
        item=response.json()['recommendations'][0]
        url=f"/api/learning/recommendations/{item['id']}/decision"
        for action in ('dismissed','active','applied'):
            decision=await self.http.post(url,json={'context':request,'action':action})
            self.assertEqual(decision.status_code,200)
            loaded=(await self.http.post('/api/learning/history',json=request)).json()
            self.assertEqual(loaded['recommendations'][0]['decision'],action)
        record=await self.db.renders.find_one({'id':'1'})
        self.assertEqual(record['generation_settings'],{'width':896,'height':1344})
        await self.http.put('/api/renders/1/scene-feedback',json={'ratings':{'framing':'missed'}})
        self.assertEqual((await self.http.post('/api/learning/history',json=request)).json()['recommendations'],[])
        stale=await self.http.post(url,json={'context':request,'action':'applied'})
        self.assertEqual(stale.status_code,409)
        self.assertEqual((await self.http.post('/api/learning/history',json={**request,'workflow_id':'missing'})).status_code,404)
        self.assertEqual((await self.http.post('/api/learning/history',json={**request,'generation':{'steps':{}}})).status_code,422)
        self.assertEqual((await self.http.post(url,json={'context':request,'action':'auto_train'})).status_code,422)
