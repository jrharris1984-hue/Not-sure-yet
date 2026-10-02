"""Proxy routes for the separate AI Media Library server."""
import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, Response

router = APIRouter(prefix="/api/media-library", tags=["media-library"])
MEDIA_LIBRARY_URL = os.environ.get("MEDIA_LIBRARY_URL", "http://192.168.0.16:8010").rstrip("/")


async def _json_get(path: str, params: Optional[dict] = None):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{MEDIA_LIBRARY_URL}{path}", params=params)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Media Library unavailable: {exc}")
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text[:500])
    return response.json()


@router.get("/health")
async def media_library_health():
    return await _json_get("/health")


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
    limit: int = Query(60, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return await _json_get("/media", {
        "q": q, "media_type": media_type, "status": status,
        "analyzed_only": str(analyzed_only).lower(),
        "hide_sidecars": str(hide_sidecars).lower(),
        "limit": limit, "offset": offset,
    })


@router.get("/media/{media_id}")
async def media_library_item(media_id: int):
    return await _json_get(f"/media/{media_id}")


async def _binary_get(path: str):
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.get(f"{MEDIA_LIBRARY_URL}{path}")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Media Library unavailable: {exc}")
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
