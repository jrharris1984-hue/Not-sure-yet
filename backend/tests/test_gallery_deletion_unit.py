import ast
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from typing import List, Dict, Any
from urllib.parse import parse_qs, urlparse
from unittest.mock import AsyncMock, Mock

class HTTPException(Exception):
    def __init__(self, status_code, detail):
        self.status_code = status_code
        self.detail = detail

def load(root, renders, shared=None):
    tree = ast.parse((Path(__file__).resolve().parents[1] / 'server.py').read_text())
    nodes = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in {'_gallery_output_urls', '_comfy_output_paths', '_delete_gallery_records'}]
    collection = SimpleNamespace(find=Mock(return_value=SimpleNamespace(to_list=AsyncMock(return_value=renders))),
        find_one=AsyncMock(return_value=shared), delete_many=AsyncMock(return_value=SimpleNamespace(deleted_count=len(renders))))
    namespace = {'List': List, 'Dict': Dict, 'Any': Any, 'Path': Path, 'COMFYUI_OUTPUT_DIR': root,
        'HTTPException': HTTPException, 'parse_qs': parse_qs, 'urlparse': urlparse, 'db': SimpleNamespace(renders=collection)}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), 'server.py', 'exec'), namespace)
    return namespace['_delete_gallery_records'], collection

class GalleryDeletionTests(unittest.IsolatedAsyncioTestCase):
    async def test_legacy_false_still_deletes_original_and_enhanced_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); (root/'original.png').write_bytes(b'image'); (root/'enhanced.png').write_bytes(b'image')
            render = {'id': 'a', 'output_files': ['/view?filename=original.png&type=output'], 'output_variants': {'enhanced': ['/view?filename=enhanced.png&type=output']}}
            delete, db = load(root, [render]); result = await delete(['a'], False)
            self.assertEqual(result['files_deleted'], 2); self.assertEqual(list(root.iterdir()), [])
            db.delete_many.assert_awaited_once()

    async def test_inaccessible_file_keeps_gallery_record(self):
        with tempfile.TemporaryDirectory() as temp:
            delete, db = load(Path(temp), [{'id': 'a', 'output_files': ['/view?filename=missing.png']}])
            with self.assertRaises(HTTPException) as error: await delete(['a'])
            self.assertEqual(error.exception.status_code, 409); db.delete_many.assert_not_awaited()

    async def test_shared_file_keeps_file_and_records(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); file = root/'shared.png'; file.write_bytes(b'image')
            delete, db = load(root, [{'id': 'a', 'output_files': ['/view?filename=shared.png']}], shared={'id': 'b'})
            with self.assertRaises(HTTPException): await delete(['a'])
            self.assertTrue(file.exists()); db.delete_many.assert_not_awaited()

    async def test_path_escape_is_rejected_before_records_or_files_are_deleted(self):
        with tempfile.TemporaryDirectory() as temp:
            delete, db = load(Path(temp), [{'id': 'a', 'output_files': ['/view?filename=outside.png&subfolder=../']}])
            with self.assertRaises(HTTPException) as error: await delete(['a'])
            self.assertEqual(error.exception.status_code, 400); db.delete_many.assert_not_awaited()
