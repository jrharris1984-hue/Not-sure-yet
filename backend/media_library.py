"""Proxy routes for the separate AI Media Library server."""
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, Response

router = APIRouter(prefix="/api/media-library", tags=["media-library"])
_url_provider = None
MEDIA_LIBRARY_URL = os.environ.get("MEDIA_LIBRARY_URL", "http://192.168.0.16:8010").rstrip("/")


def configure_media_library_url(provider):
    global _url_provider
    _url_provider = provider


async def media_library_url():
    if _url_provider:
        return (await _url_provider()).rstrip("/")
    return os.environ.get("MEDIA_LIBRARY_URL", MEDIA_LIBRARY_URL).rstrip("/")


def unavailable(url, exc):
    return HTTPException(status_code=503, detail=f"Cannot connect to Media Library at {url}. Check that its API is running and reachable on port 8010. {exc}")


async def _json_get(path: str, params: Optional[dict] = None):
    url = await media_library_url()
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0)) as client:
            response = await client.get(f"{url}{path}", params=params)
    except Exception as exc:
        raise unavailable(url, exc) from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text[:500])
    try:
        return response.json()
    except ValueError as exc:
        raise HTTPException(502, f"Media Library at {url} returned an invalid API response.") from exc


@router.get("/health")
async def media_library_health():
    url = await media_library_url()
    try:
        payload = await _json_get("/health")
        return {**(payload if isinstance(payload, dict) else {}), "online": True, "url": url}
    except HTTPException as exc:
        return {"online": False, "url": url, "error": exc.detail}


@router.get("/stats")
async def media_library_stats():
    return await _json_get("/stats")


@router.get("/media")
async def media_library_list(
    q: str = "",
    media_type: str = Query("image", pattern="^(all|image|video)$"),
    status: str = Query("all", pattern="^(all|pending|analyzing|complete|error|not_required)$"),
    analyzed_only: bool = False,
    hide_sidecars: bool = True,
    folder_path: str = "",
    limit: int = Query(60, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await _json_get("/media", {
        "q": q, "media_type": media_type, "status": status,
        "analyzed_only": str(analyzed_only).lower(),
        "hide_sidecars": str(hide_sidecars).lower(),
        "folder_path": folder_path,
        "limit": limit, "offset": offset,
    })


@router.get("/folders")
async def media_library_folders(
    path: str = "",
    media_type: str = Query("all", pattern="^(all|image|video)$"),
    status: str = Query("all", pattern="^(all|pending|analyzing|complete|error|not_required)$"),
    analyzed_only: bool = False,
    hide_sidecars: bool = True,
):
    return await _json_get("/folders", {
        "path": path,
        "media_type": media_type,
        "status": status,
        "analyzed_only": str(analyzed_only).lower(),
        "hide_sidecars": str(hide_sidecars).lower(),
    })


@router.get("/media/{media_id}")
async def media_library_item(media_id: int):
    return await _json_get(f"/media/{media_id}")


async def _binary_get(path: str):
    url = await media_library_url()
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.get(f"{url}{path}")
    except Exception as exc:
        raise unavailable(url, exc) from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text[:500])
    return Response(
        content=response.content,
        media_type=response.headers.get("content-type", "application/octet-stream"),
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.get("/media/{media_id}/thumbnail")
async def media_library_thumbnail(media_id: int):
    return await _binary_get(f"/media/{media_id}/thumbnail")


@router.get("/media/{media_id}/original")
async def media_library_original(media_id: int):
    return await _binary_get(f"/media/{media_id}/original")
