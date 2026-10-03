import sys
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch
import httpx
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import media_library as media

class MediaConnectionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncTearDown(self):
        media.configure_media_library_url(None)

    async def test_saved_address_is_used_for_json_and_images(self):
        media.configure_media_library_url(AsyncMock(return_value='http://media-server:8010/'))
        response = httpx.Response(200, json={'total': 1}, request=httpx.Request('GET', 'http://media-server:8010/media'))
        with patch.object(media.httpx, 'AsyncClient') as factory:
            client = factory.return_value.__aenter__.return_value
            client.get = AsyncMock(return_value=response)
            await media._json_get('/media', {'limit': 10})
            client.get.assert_awaited_with('http://media-server:8010/media', params={'limit':10})
            await media._binary_get('/media/1/thumbnail')
            client.get.assert_awaited_with('http://media-server:8010/media/1/thumbnail')

    async def test_healthy_api_payload_is_normalized(self):
        with patch.object(media, '_json_get', AsyncMock(return_value={'status': 'ok'})):
            health = await media.media_library_health()
        self.assertTrue(health['online'])
        self.assertEqual(health['status'], 'ok')
        self.assertIn('url', health)

    async def test_offline_error_identifies_target(self):
        media.configure_media_library_url(AsyncMock(return_value='http://192.168.0.16:8010'))
        with patch.object(media.httpx, 'AsyncClient') as factory:
            factory.return_value.__aenter__.return_value.get = AsyncMock(side_effect=httpx.ConnectError('All connection attempts failed'))
            health = await media.media_library_health()
        self.assertFalse(health['online'])
        self.assertIn('192.168.0.16:8010', health['error'])
