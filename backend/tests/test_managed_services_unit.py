"""Managed setup recovery and ownership tests, without GPU or large downloads."""
import hashlib
import io
import json
from pathlib import Path
import socket
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parents[2] / 'desktop'))
sys.path.insert(0, str(Path(__file__).parents[1]))
import services
import starter_pack
from storage_paths import StoragePaths


class Response(io.BytesIO):
    def __init__(self, data, status=200, headers=None):
        super().__init__(data)
        self.status, self.headers = status, headers or {}


class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'file.bin'
        self.data = b'verified download'
        self.spec = {'size': len(self.data), 'sha256': hashlib.sha256(self.data).hexdigest(), 'url': 'https://example.com/file'}
        self.cancel = threading.Event()

    def tearDown(self):
        self.temp.cleanup()

    def download(self):
        return services.download(self.spec, self.path, lambda text: None, self.cancel)

    def test_verified_download_and_existing_reuse(self):
        with patch.object(services, 'urlopen', return_value=Response(self.data)) as request:
            self.download()
            self.download()
        self.assertEqual(request.call_count, 1)
        self.assertEqual(self.path.read_bytes(), self.data)
        self.assertFalse(self.path.with_suffix('.bin.part').exists())

    def test_range_resume_validates_offset(self):
        partial = self.path.with_suffix('.bin.part')
        partial.write_bytes(self.data[:5])
        with patch.object(services, 'urlopen', return_value=Response(self.data[5:], 206, {'Content-Range': f'bytes 5-{len(self.data)-1}/{len(self.data)}'})) as request:
            self.download()
        self.assertEqual(request.call_args.args[0].get_header('Range'), 'bytes=5-')
        self.assertEqual(self.path.read_bytes(), self.data)

    def test_ignored_range_restarts_instead_of_appending(self):
        self.path.with_suffix('.bin.part').write_bytes(self.data[:5])
        with patch.object(services, 'urlopen', return_value=Response(self.data)):
            self.download()
        self.assertEqual(self.path.read_bytes(), self.data)

    def test_bad_range_preserves_partial(self):
        partial = self.path.with_suffix('.bin.part')
        partial.write_bytes(self.data[:5])
        with patch.object(services, 'urlopen', return_value=Response(self.data[5:], 206, {'Content-Range': 'bytes 0-16/17'})):
            with self.assertRaisesRegex(RuntimeError, 'resume range'):
                self.download()
        self.assertEqual(partial.read_bytes(), self.data[:5])

    def test_corruption_never_publishes_and_can_retry(self):
        with patch.object(services, 'urlopen', return_value=Response(b'x' * len(self.data))):
            with self.assertRaisesRegex(RuntimeError, 'checksum'):
                self.download()
        self.assertFalse(self.path.exists())
        self.assertFalse(self.path.with_suffix('.bin.part').exists())
        with patch.object(services, 'urlopen', return_value=Response(self.data)):
            self.download()

    def test_incomplete_download_retains_partial_for_retry(self):
        with patch.object(services, 'urlopen', return_value=Response(self.data[:5])):
            with self.assertRaisesRegex(RuntimeError, 'interrupted'):
                self.download()
        self.assertEqual(self.path.with_suffix('.bin.part').read_bytes(), self.data[:5])
        self.assertFalse(self.path.exists())

    def test_cancel_and_existing_modified_file_preserved(self):
        self.cancel.set()
        with self.assertRaises(services.Cancelled):
            self.download()
        self.cancel.clear()
        self.path.write_bytes(b'user file')
        with self.assertRaisesRegex(RuntimeError, 'will not overwrite'):
            self.download()
        self.assertEqual(self.path.read_bytes(), b'user file')


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.paths = StoragePaths(Path(self.temp.name))
        self.paths.create_directories()
        self.root = self.paths.services_dir / 'comfyui-v0.39.0'

    def tearDown(self):
        self.temp.cleanup()

    def test_windows_and_unix_archive_traversal(self):
        for name in ('../bad', '/absolute', 'C:\\bad', 'C:bad', '..\\bad', '//server/share', 'safe/file:stream'):
            with self.subTest(name=name), self.assertRaises(RuntimeError):
                services.validate_member(name)
        services.validate_member('ComfyUI_windows_portable/python_embeded/python.exe')

    def test_unknown_config_rejected_and_atomic_save(self):
        self.assertIsNone(services.load_config(self.paths))
        services.save_config(self.paths, {'version': 1, 'mode': 'existing'})
        self.assertEqual(services.load_config(self.paths)['mode'], 'existing')
        self.assertFalse((self.paths.data_dir / 'desktop-services.tmp').exists())
        services.save_config(self.paths, {'version': 9, 'mode': 'managed'})
        with self.assertRaises(RuntimeError):
            services.load_config(self.paths)

    def test_unmarked_directory_is_not_overwritten(self):
        self.root.mkdir()
        (self.root / 'user.txt').write_text('keep')
        with self.assertRaisesRegex(RuntimeError, 'incomplete service'):
            services.install_comfy(self.paths, lambda text: None, threading.Event())
        self.assertEqual((self.root / 'user.txt').read_text(), 'keep')

    def test_archive_symlinks_are_rejected_before_extraction(self):
        package = MagicMock()
        package.files = [type('Member', (), {'filename': 'ComfyUI/link', 'is_symlink': True})()]
        with patch.object(services, 'download', return_value=self.paths.data_dir / 'archive.7z'), patch('py7zr.SevenZipFile') as archive, patch.object(services.shutil, 'disk_usage', return_value=type('Disk', (), {'free': 100 * 1024**3})()):
            archive.return_value.__enter__.return_value = package
            with self.assertRaisesRegex(RuntimeError, 'symbolic link'):
                services.install_comfy(self.paths, lambda text: None, threading.Event(), model=False)
        package.extractall.assert_not_called()
        self.assertFalse(self.root.exists())
        self.assertFalse((self.paths.services_dir / 'comfyui-extracting').exists())

    def test_port_conflict_never_attaches_or_kills_an_external_service(self):
        self.root.mkdir()
        (self.root / '.ultra-studio-managed.json').write_text('{}')
        with socket.socket() as external:
            external.bind(('127.0.0.1', 0))
            port = external.getsockname()[1]
            service = services.ComfyService(self.paths)
            with patch.object(services, 'PORT', port), patch.object(services, 'nvidia_gpus', return_value=[{'id': 'GPU-test'}]), patch.object(services.subprocess, 'Popen') as process:
                with self.assertRaisesRegex(RuntimeError, 'already in use'):
                    service.start('GPU-test', lambda text: None, threading.Event())
                service.stop()
                process.assert_not_called()

    def test_launch_error_closes_log(self):
        self.root.mkdir()
        (self.root / '.ultra-studio-managed.json').write_text('{}')
        service = services.ComfyService(self.paths)
        with patch.object(services, 'nvidia_gpus', return_value=[{'id': 'GPU-test'}]), patch.object(services, 'PORT', 0), patch.object(services.subprocess, 'Popen', side_effect=OSError('missing executable')):
            with self.assertRaises(OSError):
                service.start('GPU-test', lambda text: None, threading.Event())
        self.assertIsNone(service.log)

    def test_owned_process_only_is_stopped_and_waited(self):
        service = services.ComfyService(self.paths)
        process = MagicMock()
        process.poll.return_value = None
        service.process = process
        service.stop()
        process.terminate.assert_called_once()
        process.wait.assert_called_once_with(timeout=15)
        self.assertIsNone(service.process)

    def test_extracts_real_archive_and_reuses_without_second_download(self):
        import py7zr
        source = self.paths.data_dir / 'source'
        (source / 'python_embeded').mkdir(parents=True)
        (source / 'ComfyUI').mkdir()
        (source / 'python_embeded' / 'python.exe').write_bytes(b'placeholder')
        (source / 'ComfyUI' / 'main.py').write_text('# test')
        archive = self.paths.data_dir / 'tiny.7z'
        with py7zr.SevenZipFile(archive, 'w') as package:
            package.writeall(source, 'ComfyUI_windows_portable')
        with patch.object(services, 'download', return_value=archive) as download, patch.object(services.shutil, 'disk_usage', return_value=type('Disk', (), {'free': 100 * 1024**3})()):
            result = services.install_comfy(self.paths, lambda text: None, threading.Event(), model=False)
            self.assertEqual(result, self.root)
            services.install_comfy(self.paths, lambda text: None, threading.Event(), model=False)
            download.assert_called_once()
        self.assertTrue((self.root / 'ComfyUI' / 'main.py').is_file())
        self.assertFalse((self.paths.services_dir / 'comfyui-extracting').exists())


class StarterTests(unittest.TestCase):
    def test_existing_services_leave_settings_untouched(self):
        with patch.object(starter_pack, 'request_json') as request:
            starter_pack.connect_studio('http://local', {'mode': 'existing'})
            request.assert_not_called()

    def test_existing_starter_preserves_custom_workflow_and_default(self):
        with patch.object(starter_pack, 'request_json', side_effect=[{}, {'workflows': [{'id': 'custom', 'name': starter_pack.NAME}]}]) as request:
            starter_pack.connect_studio('http://local', {'mode': 'managed', 'starter': True})
        self.assertEqual(request.call_count, 2)
        self.assertEqual(request.call_args_list[0].args[1], {'comfyui_url': services.URL})

    def test_new_starter_is_added_and_selected_once(self):
        with patch.object(starter_pack, 'request_json', side_effect=[{}, {'workflows': []}, {'id': 'starter'}, {}]) as request:
            starter_pack.connect_studio('http://local', {'mode': 'managed', 'starter': True})
        self.assertEqual(request.call_args_list[2].args[2], 'POST')
        self.assertEqual(request.call_args_list[3].args[1], {'default_workflow_id': 'starter'})

    def info(self):
        info = {node['class_type']: {} for node in starter_pack.WORKFLOW.values()}
        info['CheckpointLoaderSimple'] = {'input': {'required': {'ckpt_name': [['sd_xl_base_1.0.safetensors']]}}}
        return info

    def test_gpu_render_requires_output_image(self):
        outputs = {'test': {'outputs': {'7': {'images': [{'filename': 'test.png'}]}}}}
        with patch.object(starter_pack, 'request_json', side_effect=[self.info(), {'prompt_id': 'test'}, outputs]) as request:
            starter_pack.test_render(lambda text: None, threading.Event())
        workflow = request.call_args_list[1].args[1]['prompt']
        self.assertEqual(workflow['4']['inputs']['width'], 512)
        self.assertEqual(starter_pack.WORKFLOW['4']['inputs']['width'], 1024)

    def test_render_error_is_not_reported_as_success(self):
        with patch.object(starter_pack, 'request_json', side_effect=[self.info(), {'prompt_id': 'test'}, {'test': {'status': {'status_str': 'error'}}}]):
            with self.assertRaisesRegex(RuntimeError, 'render failed'):
                starter_pack.test_render(lambda text: None, threading.Event())


if __name__ == '__main__':
    unittest.main()
