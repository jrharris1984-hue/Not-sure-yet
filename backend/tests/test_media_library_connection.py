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
        media.configure_media_overlays(None)

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

    async def test_overlays_are_applied_to_list_and_wrapped_detail_responses(self):
        overlay = AsyncMock(return_value=[{'id': 1, 'person_count': 1}])
        media.configure_media_overlays(overlay)
        with patch.object(media, '_json_get', AsyncMock(return_value={'items': [{'id': 1}]})):
            result = await media.media_library_list()
            self.assertEqual(result['items'][0]['person_count'], 1)
        with patch.object(media, '_json_get', AsyncMock(return_value={'item': {'id': 1}})):
            result = await media.media_library_item(1)
            self.assertEqual(result['item']['person_count'], 1)
