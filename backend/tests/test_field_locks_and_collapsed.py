"""Tests for field_locks + collapsed persistence on Character model."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://character-forge-484.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def test_create_character_with_field_locks_and_collapsed_persists(session):
    body = {
        "name": "TEST_FL_Char",
        "tags": ["TEST_"],
        "field_locks": {"identity": {"age": True, "gender": False}},
        "collapsed": {"physique": True, "_glance": True},
    }
    r = session.post(f"{API}/characters", json=body)
    assert r.status_code == 200, r.text
    doc = r.json()
    cid = doc["id"]
    try:
        assert doc.get("field_locks") == {"identity": {"age": True, "gender": False}}
        assert doc.get("collapsed") == {"physique": True, "_glance": True}
        # GET
        r = session.get(f"{API}/characters/{cid}")
        assert r.status_code == 200
        d = r.json()
        assert d["field_locks"] == {"identity": {"age": True, "gender": False}}
        assert d["collapsed"] == {"physique": True, "_glance": True}
        # PATCH update
        patch = {"field_locks": {"identity": {"age": False}, "physique": {"height": True}},
                 "collapsed": {"physique": False, "identity": True}}
        r = session.patch(f"{API}/characters/{cid}", json=patch)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["field_locks"] == patch["field_locks"]
        assert d["collapsed"] == patch["collapsed"]
        # Re-GET
        r = session.get(f"{API}/characters/{cid}")
        d = r.json()
        assert d["field_locks"] == patch["field_locks"]
        assert d["collapsed"] == patch["collapsed"]
    finally:
        session.delete(f"{API}/characters/{cid}")


def test_create_character_without_locks_defaults_empty(session):
    r = session.post(f"{API}/characters", json={"name": "TEST_FL_Default", "tags": ["TEST_"]})
    assert r.status_code == 200
    d = r.json()
    cid = d["id"]
    try:
        assert d.get("field_locks") == {}
        assert d.get("collapsed") == {}
    finally:
        session.delete(f"{API}/characters/{cid}")
