import copy
from datetime import datetime, timezone
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
import io

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bson import Binary, Decimal128, ObjectId, json_util
from desktop_data import inspect_snapshot, main, write_snapshot
from storage_paths import resolve_storage_paths


class StoragePathTests(unittest.TestCase):
    def test_docker_defaults_keep_the_existing_render_volume(self):
        with tempfile.TemporaryDirectory() as root:
            paths = resolve_storage_paths(root, environ={})
            self.assertEqual(paths.renders_dir, Path(root) / 'renders')

    def test_windows_desktop_data_is_outside_installation_and_survives_reinitialization(self):
        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            env = {'ULTRA_STUDIO_DESKTOP': '1', 'LOCALAPPDATA': str(root / 'user data')}
            paths = resolve_storage_paths(root / 'Program Files', environ=env, platform='win32')
            self.assertEqual(paths.data_dir, root / 'user data' / 'UltraStudio')
            paths.create_directories()
            image = paths.renders_dir / 'saved.png'
            image.write_bytes(b'existing image')
            resolve_storage_paths(root / 'new version', environ=env, platform='win32').create_directories()
            self.assertEqual(image.read_bytes(), b'existing image')
            self.assertTrue(paths.backups_dir.is_dir())
            self.assertTrue(paths.services_dir.is_dir())

    def test_explicit_data_folder_and_missing_windows_environment(self):
        with tempfile.TemporaryDirectory() as root:
            paths = resolve_storage_paths('/resources', environ={'ULTRA_STUDIO_DATA_DIR': root})
            self.assertEqual(paths.data_dir, Path(root))
            paths = resolve_storage_paths('/resources', environ={'ULTRA_STUDIO_DESKTOP': '1'}, platform='win32', home=root)
            self.assertEqual(paths.data_dir, Path(root) / 'AppData' / 'Local' / 'UltraStudio')
        with self.assertRaises(ValueError):
            resolve_storage_paths('/resources', environ={'ULTRA_STUDIO_DATA_DIR': 'relative'})


class DesktopSnapshotTests(unittest.TestCase):
    def source(self):
        return {
            'characters': [{'_id': ObjectId(), 'id': 'character-a', 'name': 'Zoë', 'dna': {'pose': {'action': 'standing quarter turn'}}, 'created_at': datetime(2026, 10, 9, tzinfo=timezone.utc)}],
            'settings': [{'_id': 'settings', 'custom_photoshoot_presets': [{'key': 'custom_portrait', 'sequence': [{'title': 'Hero', 'expression': 'playful', 'camera_match': 'foot level'}]}], 'prompt_catalog': {'sections': [{'key': 'custom_poses', 'options': ['my own pose']}]}}],
            'renders': [{'_id': ObjectId(), 'id': 'render-a', 'output_files': ['http://localhost:8188/view?filename=existing.png'], 'extra': {'binary': Binary(b'\x00\x01'), 'number': Decimal128('1.234')}}],
            'render_queue': [{'_id': 'job-a', 'id': 'job-a', 'status': 'running', 'render_id': 'render-a'}],
            'future_collection': [],
        }

    def test_all_collections_fields_and_bson_types_roundtrip_without_mutating_source(self):
        source = self.source(); original = copy.deepcopy(source)
        with tempfile.TemporaryDirectory() as root:
            destination = Path(root) / 'migration.sqlite3'
            result = write_snapshot(source.items(), destination, 'ultra_studio')
            self.assertEqual(result['documents'], 4)
            self.assertEqual(inspect_snapshot(destination)['collections'], {name: len(items) for name, items in source.items()})
            with sqlite3.connect(destination) as connection:
                for name, documents in source.items():
                    restored = [json_util.loads(payload) for payload, in connection.execute('SELECT document_json FROM documents WHERE collection_name = ?', (name,))]
                    self.assertEqual(json_util.dumps(restored, json_options=json_util.CANONICAL_JSON_OPTIONS), json_util.dumps(documents, json_options=json_util.CANONICAL_JSON_OPTIONS))
            self.assertEqual(source, original)

    def test_existing_files_are_never_overwritten(self):
        with tempfile.TemporaryDirectory() as root:
            destination = Path(root) / 'keep.sqlite3'; destination.write_bytes(b'keep this')
            with self.assertRaises(FileExistsError):
                write_snapshot(self.source().items(), destination)
            self.assertEqual(destination.read_bytes(), b'keep this')

    def test_cli_inspection_reports_counts_without_exposing_saved_secrets(self):
        with tempfile.TemporaryDirectory() as root:
            destination = Path(root) / 'private.sqlite3'
            write_snapshot([('ai_secrets', [{'_id': 'key', 'api_key': 'private-example-secret'}])], destination)
            before = destination.read_bytes()
            output = io.StringIO()
            with redirect_stdout(output):
                self.assertEqual(main(['inspect', str(destination)]), 0)
            self.assertIn('ai_secrets', output.getvalue())
            self.assertNotIn('private-example-secret', output.getvalue())
            self.assertEqual(destination.read_bytes(), before)

    def test_interrupted_reads_and_duplicate_ids_leave_no_partial_snapshot(self):
        def interrupted():
            yield {'_id': 'first'}
            raise RuntimeError('source interrupted')
        for documents, error in [(interrupted(), RuntimeError), ([{'_id': 'same'}, {'_id': 'same'}], sqlite3.IntegrityError), ([{'id': 'missing_mongo_id'}], ValueError)]:
            with tempfile.TemporaryDirectory() as root:
                destination = Path(root) / 'snapshot.sqlite3'
                with self.assertRaises(error):
                    write_snapshot([('characters', documents)], destination)
                self.assertFalse(destination.exists())
                self.assertEqual(list(Path(root).iterdir()), [])

    def test_inspection_detects_changed_counts_and_unsupported_versions(self):
        for patch in [('collection_counts', '{}'), ('schema_version', '999')]:
            with tempfile.TemporaryDirectory() as root:
                destination = Path(root) / 'snapshot.sqlite3'; write_snapshot(self.source().items(), destination)
                with sqlite3.connect(destination) as connection:
                    connection.execute('UPDATE metadata SET value = ? WHERE key = ?', (patch[1], patch[0]))
                with self.assertRaises(ValueError):
                    inspect_snapshot(destination)


if __name__ == '__main__':
    unittest.main()
