"""Tests for the new `thumbnail` aggregation field on GET /api/characters (iteration 4 design pass)."""
import os
import uuid
from datetime import datetime, timezone

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def three_characters(session):
    """Create 3 chars: (a) no renders, (b) render w/o output_files, (c) render w/ output_files."""
    ids = []
    for name in ("TEST_ThumbA_NoRender", "TEST_ThumbB_NoOutput", "TEST_ThumbC_WithOutput"):
        r = session.post(f"{API}/characters", json={"name": name, "tags": ["TEST_"]})
        assert r.status_code == 200
        ids.append(r.json()["id"])
    yield ids
    for cid in ids:
        session.delete(f"{API}/characters/{cid}")


@pytest.mark.asyncio
async def test_thumbnail_aggregation(three_characters, session):
    a_id, b_id, c_id = three_characters
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    inserted_render_ids = []
    try:
        now = datetime.now(timezone.utc).isoformat()
        # Char B: render with empty output_files
        rb_id = str(uuid.uuid4())
        await db.renders.insert_one({
            "id": rb_id, "character_id": b_id, "status": "done",
            "output_files": [], "created_at": now,
        })
        inserted_render_ids.append(rb_id)
        # Char C: two renders, latest with output_files URL
        older = "2024-01-01T00:00:00+00:00"
        rc_old = str(uuid.uuid4())
        rc_new = str(uuid.uuid4())
        await db.renders.insert_one({
            "id": rc_old, "character_id": c_id, "status": "done",
            "output_files": ["https://example.com/OLD.png"], "created_at": older,
        })
        await db.renders.insert_one({
            "id": rc_new, "character_id": c_id, "status": "done",
            "output_files": ["https://example.com/NEW.png", "https://example.com/second.png"],
            "created_at": now,
        })
        inserted_render_ids += [rc_old, rc_new]

        # Now fetch /api/characters and validate
        r = session.get(f"{API}/characters", params={"q": "TEST_Thumb"})
        assert r.status_code == 200
        chars = {c["id"]: c for c in r.json()}
        assert a_id in chars and b_id in chars and c_id in chars

        # (a) no renders -> thumbnail should exist and be None
        assert "thumbnail" in chars[a_id], "thumbnail key missing on char with no renders"
        assert chars[a_id]["thumbnail"] is None

        # (b) render but no output_files -> thumbnail should be None
        assert chars[b_id]["thumbnail"] is None

        # (c) latest render -> thumbnail is the NEW URL, not the OLD one
        assert chars[c_id]["thumbnail"] == "https://example.com/NEW.png"
    finally:
        for rid in inserted_render_ids:
            await db.renders.delete_one({"id": rid})
        client.close()


def test_characters_list_shape_no_extra_fields(session, three_characters):
    """Ensure existing keys still exist alongside thumbnail (no regression on shape)."""
    r = session.get(f"{API}/characters", params={"q": "TEST_Thumb"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 3
    sample = data[0]
    for k in ("id", "name", "dna", "tags", "favorite", "prompt_positive", "prompt_negative"):
        assert k in sample, f"missing expected key {k}"
    assert "_id" not in sample
