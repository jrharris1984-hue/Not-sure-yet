"""Run application handlers against an actual SQLite database, without services."""
import ast
import asyncio
from copy import deepcopy
from datetime import datetime, timezone
import os
from pathlib import Path
import tempfile
import subprocess
import sys
from types import SimpleNamespace
from typing import Any, Dict, List, Optional, Literal
import unittest
from unittest.mock import AsyncMock, patch
import uuid
import re
from urllib.parse import urlparse

from bson import ObjectId, Binary, Decimal128
from fastapi import HTTPException, Query, Body
from pydantic import BaseModel, ConfigDict, Field
from pymongo.errors import DuplicateKeyError

from desktop_data import write_snapshot, import_snapshot, inspect_snapshot
from queue_reliability import submit_render, interrupted_submission_patch
from shoot_queue import link_shoot_render, load_shoot_renders
from sqlite_storage import SQLiteDatabase
from storage_backend import open_storage
from storage_paths import StoragePaths
from wardrobe_catalog_upgrade import upgrade_wardrobe_catalog
from prompt_catalog import validate_prompt_catalog


def handlers(database):
    names = {'now_iso', 'new_id', 'Character', 'CharacterUpsert', 'Settings', 'WorkflowTemplate',
             'create_character', 'update_character', 'get_character', 'delete_character', 'list_characters',
             'list_character_tags', '_gallery_visibility_filter', 'list_renders', 'get_render',
             'get_settings', 'update_settings', '_startup'}
    tree = ast.parse((Path(__file__).parents[1] / 'server.py').read_text())
    nodes = [node for node in tree.body if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names]
    for node in nodes:
        node.decorator_list = []
    namespace = dict(globals(), db=database, _load_seed_workflows=lambda: [],
                     _render_queue_worker=AsyncMock())
    exec(compile(ast.Module(body=nodes, type_ignores=[]), 'actual_server_handlers', 'exec'), namespace)
    return namespace


class SQLiteStorageTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.path = Path(self.temporary.name) / 'studio.sqlite3'
        self.db = SQLiteDatabase(self.path)
        self.api = handlers(self.db)

    async def asyncTearDown(self):
        self.db.close()
        self.temporary.cleanup()

    def reopen(self):
        self.db.close()
        self.db = SQLiteDatabase(self.path)
        self.api = handlers(self.db)

    async def test_character_save_update_search_thumbnail_and_delete_handlers(self):
        body = self.api['CharacterUpsert'](name='Alice', tags=['portrait', 'studio'], dna={'seed': 42})
        character = await self.api['create_character'](body)
        await self.db.renders.insert_one({'id': 'image', 'character_id': character.id, 'output_files': ['/old.png'], 'created_at': '1'})
        await self.db.renders.insert_one({'id': 'latest', 'character_id': character.id, 'output_files': ['/new.png'], 'created_at': '2'})
        await self.api['update_character'](character.id, self.api['CharacterUpsert'](favorite=True, default_image_render_id='image'))
        self.reopen()
        listed = await self.api['list_characters'](q='ALICE', tag=['studio'], favorite=True)
        self.assertEqual([(doc['name'], doc['thumbnail']) for doc in listed], [('Alice', '/old.png')])
        self.assertNotIn('_id', listed[0])
        self.assertEqual((await self.api['get_character'](character.id)).dna, {'seed': 42})
        with self.assertRaises(HTTPException):
            await self.api['update_character'](character.id, self.api['CharacterUpsert'](default_image_render_id='missing'))
        await self.api['delete_character'](character.id)
        self.assertEqual(await self.db.renders.count_documents({}), 0)
        self.assertEqual(await self.db.characters.count_documents({}), 0)

    async def test_tag_aggregation_and_latest_thumbnail_handlers(self):
        for identifier, tags in [('a', ['studio', 'portrait']), ('b', ['studio'])]:
            await self.db.characters.insert_one({'id': identifier, 'tags': tags})
        for identifier, created in [('older', '1'), ('newer', '2')]:
            await self.db.renders.insert_one({'id': identifier, 'character_id': 'a', 'created_at': created, 'output_files': [identifier]})
        self.assertEqual(await self.api['list_character_tags'](), [{'tag': 'studio', 'count': 2}, {'tag': 'portrait', 'count': 1}])
        listed = await self.api['list_characters'](q=None, tag=None, favorite=None)
        self.assertEqual(next(doc for doc in listed if doc['id'] == 'a')['thumbnail'], 'newer')

    async def test_gallery_visibility_pagination_and_render_handlers(self):
        for identifier, extra in [('a', {}), ('b', {'hidden_from_gallery': True}),
                                  ('c', {'hidden_from_gallery': True, 'anatomy_guard_status': 'failed', 'output_files': ['c.png']})]:
            await self.db.renders.insert_one({'id': identifier, 'created_at': 'same', **extra})
        self.assertEqual([doc['id'] for doc in await self.api['list_renders'](limit=1)], ['c'])
        self.assertEqual([doc['id'] for doc in await self.api['list_renders'](limit=1, skip=1)], ['a'])
        self.assertEqual((await self.api['get_render']('c'))['output_files'], ['c.png'])

    async def test_settings_handlers_preserve_custom_data_and_workflows_after_restart(self):
        settings = await self.api['get_settings']()
        settings.workflows = [self.api['WorkflowTemplate'](name='Custom', json_str='{"node":{}}')]
        await self.db.settings.update_one({'id': 'singleton'}, {'$set': settings.model_dump()})
        preset = {'key': 'custom', 'label': 'Custom', 'sequence': [{'title': 'Portrait', 'expression': 'playful'}]}
        await self.api['update_settings']({'comfyui_url': 'http://localhost:8188', 'custom_photoshoot_presets': [preset]})
        self.reopen()
        saved = await self.api['get_settings']()
        self.assertEqual(saved.custom_photoshoot_presets[0]['sequence'][0]['expression'], 'playful')
        self.assertEqual(saved.workflows[0].json_str, '{"node":{}}')
        self.assertEqual(await self.db.settings.count_documents({}), 1)

    async def test_concurrent_conditional_claims_across_connections_have_one_winner(self):
        await self.db.render_queue.insert_one({'id': 'job', 'status': 'queued', 'seed': 42})
        other = SQLiteDatabase(self.path)
        try:
            claims = await asyncio.gather(*(database.render_queue.update_one({'id': 'job', 'status': 'queued'}, {'$set': {'status': 'dispatching'}}) for database in [self.db, other] * 8))
            self.assertEqual(sum(result.matched_count for result in claims), 1)
        finally:
            other.close()
        self.reopen()
        self.assertEqual((await self.db.render_queue.find_one({'id': 'job'}))['seed'], 42)

    async def test_submission_persists_intent_before_post_and_cancellation_prevents_post(self):
        await self.db.render_queue.insert_one({'id': 'job', 'status': 'dispatching'})
        async def post():
            self.assertEqual((await self.db.render_queue.find_one({'id': 'job'}))['render_id'], 'render')
            self.assertEqual((await self.db.renders.find_one({'id': 'render'}))['seed_used'], 42)
            return SimpleNamespace(status_code=200, json=lambda: {'prompt_id': 'prompt'})
        await submit_render({'id': 'render', 'seed_used': 42}, 'job', self.db.renders, self.db.render_queue, post, lambda: 'now')
        self.reopen()
        self.assertEqual((await self.db.renders.find_one({'id': 'render'}))['comfy_prompt_id'], 'prompt')
        await self.db.render_queue.update_one({'id': 'job'}, {'$set': {'status': 'cancelled'}})
        denied_post = AsyncMock()
        cancelled = await submit_render({'id': 'cancelled-render'}, 'job', self.db.renders, self.db.render_queue, denied_post, lambda: 'now')
        self.assertEqual(cancelled['status'], 'cancelled')
        denied_post.assert_not_called()

    async def test_actual_startup_recovers_intent_without_resubmitting_uncertain_job(self):
        for identifier in ['unlinked', 'uncertain', 'accepted']:
            await self.db.render_queue.insert_one({'id': identifier, 'status': 'dispatching', 'render_id': None})
        await self.db.renders.insert_one({'id': 'pending', 'queue_id': 'uncertain', 'status': 'dispatching', 'seed_used': 77})
        await self.db.renders.insert_one({'id': 'running', 'queue_id': 'accepted', 'status': 'running', 'comfy_prompt_id': 'existing'})
        self.reopen()
        await self.api['_startup']()
        await self.api['_queue_worker_task']
        self.assertEqual((await self.db.render_queue.find_one({'id': 'unlinked'}))['status'], 'queued')
        self.assertEqual((await self.db.render_queue.find_one({'id': 'uncertain'}))['render_id'], 'pending')
        self.assertEqual((await self.db.renders.find_one({'id': 'pending'}))['submission_state'], 'unknown')
        self.assertEqual((await self.db.renders.find_one({'id': 'running'}))['comfy_prompt_id'], 'existing')

    async def test_shoot_helpers_update_nested_frame_and_resolve_job(self):
        await self.db.shoots.insert_one({'id': 'shoot', 'frames': [{'queue_id': 'job'}, {'queue_id': 'other'}]})
        job = {'id': 'job', 'render_id': 'image', 'status': 'running', 'payload': {'shoot_id': 'shoot', 'shoot_frame_index': 0}}
        await self.db.render_queue.insert_one(job)
        await self.db.renders.insert_one({'id': 'image', 'status': 'running', 'seed_used': 42})
        await link_shoot_render(self.db, job)
        shoot = await self.db.shoots.find_one({'id': 'shoot'})
        self.assertEqual(shoot['frames'], [{'queue_id': 'job', 'render_id': 'image'}, {'queue_id': 'other'}])
        slots = await load_shoot_renders(self.db, shoot['frames'])
        self.assertEqual(slots[0]['seed_used'], 42)
        self.assertEqual(slots[0]['queue_id'], 'job')
        self.assertIsNone(slots[1].get('output_files'))

    async def test_unique_index_upsert_race_and_transaction_rollback(self):
        await self.db.media_corrections.create_index([('source', 1), ('media_id', 1)], unique=True)
        await asyncio.gather(*(self.db.media_corrections.update_one({'source': 'library', 'media_id': 'one'}, {'$setOnInsert': {'tags': ['one']}}, upsert=True) for _ in range(8)))
        self.assertEqual(await self.db.media_corrections.count_documents({}), 1)
        self.reopen()
        with self.assertRaises(DuplicateKeyError):
            await self.db.media_corrections.insert_one({'source': 'library', 'media_id': 'one'})
        await self.db.media_corrections.insert_one({'source': 'library', 'media_id': 'two'})
        with self.assertRaises(DuplicateKeyError):
            await self.db.media_corrections.update_many({}, {'$set': {'media_id': 'same'}})
        self.assertEqual(set(await self.db.media_corrections.distinct('media_id')), {'one', 'two'})

    async def test_bson_roundtrip_projections_results_and_fail_loudly(self):
        doc = {'_id': ObjectId(), 'id': 'typed', 'binary': Binary(b'\x00\xff', 128), 'decimal': Decimal128('1.20'), 'tags': ['a', 'b']}
        await self.db.extra.insert_one(doc)
        self.reopen()
        self.assertEqual(await self.db.extra.find_one({'id': 'typed'}), doc)
        self.assertEqual(await self.db.extra.find_one({}, {'_id': 1}), {'_id': doc['_id']})
        self.assertEqual(await self.db.extra.distinct('tags'), ['a', 'b'])
        result = await self.db.extra.update_one({'id': 'typed'}, {'$set': {'id': 'typed'}})
        self.assertEqual((result.matched_count, result.modified_count), (1, 0))
        for collection in [self.db.extra, self.db.empty]:
            with self.assertRaises(ValueError):
                await collection.find_one({'id': {'$unsupported': 1}})
        with self.assertRaises(ValueError):
            await self.db.extra.update_one({}, {'$inc': {'count': 1}})
        self.assertEqual((await self.db.extra.delete_one({'id': 'typed'})).deleted_count, 1)

    async def test_import_preserves_bson_unknown_collections_and_source(self):
        source = Path(self.temporary.name) / 'snapshot.sqlite3'
        target = Path(self.temporary.name) / 'imported.sqlite3'
        document = {'_id': ObjectId(), 'id': 'custom', 'binary': Binary(b'custom', 128), 'future_field': {'deep': [42]}}
        write_snapshot([('unknown', [document]), ('empty', [])], source)
        before = source.read_bytes()
        with self.assertRaises(ValueError):
            SQLiteDatabase(source)
        result = await asyncio.to_thread(import_snapshot, source, target)
        self.assertEqual(result['documents'], 1)
        imported = SQLiteDatabase(target)
        try:
            self.assertEqual(await imported.unknown.find_one({'id': 'custom'}), document)
            self.assertEqual(await imported.command('ping'), {'ok': 1})
        finally:
            imported.close()
        self.assertEqual(source.read_bytes(), before)
        self.assertEqual(inspect_snapshot(source)['collections'], {'unknown': 1, 'empty': 0})
        with self.assertRaises(FileExistsError):
            await asyncio.to_thread(import_snapshot, source, target)

    async def test_invalid_import_never_publishes_target(self):
        source = Path(self.temporary.name) / 'duplicates.sqlite3'
        target = Path(self.temporary.name) / 'bad-import.sqlite3'
        write_snapshot([('media_corrections', [{'_id': ObjectId(), 'source': 'same', 'media_id': 'same'} for _ in range(2)])], source)
        with self.assertRaises(DuplicateKeyError):
            await asyncio.to_thread(import_snapshot, source, target)
        self.assertFalse(target.exists())
        self.assertFalse(list(Path(self.temporary.name).glob('ultra-import-*')))

    async def test_sqlite_selection_needs_no_mongo_environment(self):
        paths = StoragePaths(Path(self.temporary.name) / 'native')
        client, database = open_storage(paths, {'ULTRA_STUDIO_STORAGE': 'sqlite'})
        try:
            self.assertIs(client, database)
            self.assertEqual(await database.command('ping'), {'ok': 1})
        finally:
            client.close()
        with self.assertRaises(ValueError):
            open_storage(paths, {'ULTRA_STUDIO_STORAGE': 'typo'})
        with self.assertRaises(ValueError):
            open_storage(paths, {'ULTRA_STUDIO_STORAGE': 'sqlite', 'ULTRA_STUDIO_SQLITE_PATH': 'relative.sqlite3'})
        # Lazy import means SQLite mode does not require Motor at all. Check Mongo
        # selection with a stand-in module, without contacting a MongoDB service.
        factory = unittest.mock.Mock(return_value={'studio': 'mongo-db'})
        with patch.dict('sys.modules', {'motor': SimpleNamespace(), 'motor.motor_asyncio': SimpleNamespace(AsyncIOMotorClient=factory)}):
            _, database = open_storage(paths, {'MONGO_URL': 'mongodb://local', 'DB_NAME': 'studio', 'ULTRA_STUDIO_DESKTOP': '1'})
        self.assertEqual(database, 'mongo-db')
        factory.assert_called_once_with('mongodb://local')


class SQLiteHTTPTests(unittest.TestCase):
    def test_full_app_lifespan_and_http_routes_survive_new_process(self):
        # Import the real app in child processes so its global database and queue
        # worker are exercised without contaminating other unit test modules.
        with tempfile.TemporaryDirectory() as directory:
            env = {**os.environ, 'ULTRA_STUDIO_STORAGE': 'sqlite', 'ULTRA_STUDIO_DATA_DIR': directory}
            env.pop('MONGO_URL', None)
            env.pop('DB_NAME', None)
            env.pop('ULTRA_STUDIO_SQLITE_PATH', None)
            script = """
from fastapi.testclient import TestClient
import server
with TestClient(server.app) as api:
    health = api.get('/api/health')
    assert health.status_code == 200 and health.json()['storage'] == 'sqlite'
    saved = api.get('/api/characters').json()
    if not saved:
        created = api.post('/api/characters', json={'name': 'Desktop HTTP', 'tags': ['desktop']})
        assert created.status_code == 200
        cid = created.json()['id']
        updated = api.patch('/api/characters/' + cid, json={'favorite': True})
        assert updated.status_code == 200 and updated.json()['favorite']
        response = api.put('/api/settings', json={'builder_prompt_format': 'compact'})
        assert response.status_code == 200
    else:
        assert len(saved) == 1 and saved[0]['favorite']
        assert api.get('/api/settings').json()['builder_prompt_format'] == 'compact'
    assert api.get('/api/characters/tags').json() == [{'tag': 'desktop', 'count': 1}]
    assert api.get('/api/renders').json() == []
"""
            for _ in range(2):
                result = subprocess.run([sys.executable, '-c', script], cwd=Path(__file__).parents[1],
                                        env=env, capture_output=True, text=True, timeout=30)
                self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == '__main__':
    unittest.main()
