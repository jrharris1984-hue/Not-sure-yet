"""Regression + Photo Shoot API tests for Ultra Studio DNA Builder."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://character-forge-484.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def workflow_id(session):
    # Trigger seed
    r = session.get(f"{API}/settings")
    assert r.status_code == 200
    wfs = r.json().get("workflows", [])
    if not wfs:
        session.post(f"{API}/workflows/seed")
        wfs = session.get(f"{API}/workflows").json()
    assert wfs, "no workflows available"
    return wfs[0]["id"]


@pytest.fixture(scope="module")
def character(session):
    body = {
        "name": "TEST_ShootChar",
        "dna": {"identity": {"gender": "female", "age": 28},
                "pose": {"action": "standing"},
                "wardrobe": {"outfit_preset": "black dress"},
                "scene": {"environment": "studio"}},
        "prompt_positive": "portrait of a woman",
        "prompt_negative": "blurry",
        "tags": ["TEST_"],
    }
    r = session.post(f"{API}/characters", json=body)
    assert r.status_code == 200
    c = r.json()
    yield c
    # cleanup
    session.delete(f"{API}/characters/{c['id']}")


# ---------------- Health / regression ----------------
def test_health(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_settings_and_workflows(session, workflow_id):
    r = session.get(f"{API}/workflows")
    assert r.status_code == 200
    wfs = r.json()
    assert any(w["id"] == workflow_id for w in wfs)


def test_character_crud(session):
    # create
    r = session.post(f"{API}/characters", json={"name": "TEST_CrudChar", "tags": ["TEST_"]})
    assert r.status_code == 200
    cid = r.json()["id"]
    # get
    r = session.get(f"{API}/characters/{cid}")
    assert r.status_code == 200
    assert r.json()["name"] == "TEST_CrudChar"
    # patch
    r = session.patch(f"{API}/characters/{cid}", json={"favorite": True})
    assert r.status_code == 200 and r.json()["favorite"] is True
    # search
    r = session.get(f"{API}/characters", params={"q": "TEST_CrudChar"})
    assert any(c["id"] == cid for c in r.json())
    # favorite filter
    r = session.get(f"{API}/characters", params={"favorite": "true"})
    assert any(c["id"] == cid for c in r.json())
    # duplicate
    r = session.post(f"{API}/characters/{cid}/duplicate")
    assert r.status_code == 200
    dup_id = r.json()["id"]
    assert dup_id != cid
    # delete both
    for x in (cid, dup_id):
        assert session.delete(f"{API}/characters/{x}").status_code == 200
    assert session.get(f"{API}/characters/{cid}").status_code == 404


# ---------------- Renders dispatch (seed patching + offline) ----------------
def test_dispatch_offline_with_seed(session, character, workflow_id):
    body = {
        "character_id": character["id"],
        "dna": character["dna"],
        "prompt_positive": character["prompt_positive"],
        "prompt_negative": character["prompt_negative"],
        "workflow_id": workflow_id,
        "seed": 12345,
    }
    r = session.post(f"{API}/renders/dispatch", json=body)
    assert r.status_code == 200, r.text
    doc = r.json()
    # ComfyUI offline expected
    assert doc["status"] in ("offline", "failed"), doc
    assert doc.get("seed_used") == 12345
    assert "_id" not in doc


# ---------------- Photo Shoot ----------------
def test_shoot_create_validation(session, character, workflow_id):
    # count out of range
    r = session.post(f"{API}/shoots", json={"character_id": character["id"], "count": 0, "frames": []})
    assert r.status_code == 400
    r = session.post(f"{API}/shoots", json={"character_id": character["id"], "count": 41, "frames": []})
    assert r.status_code == 400
    # frames length mismatch
    r = session.post(f"{API}/shoots", json={"character_id": character["id"], "count": 4, "frames": [{"pose_action": "x"}]})
    assert r.status_code == 400
    # unknown character
    r = session.post(f"{API}/shoots", json={"character_id": "nope", "count": 4,
                                             "frames": [{"pose_action": "a"}]*4})
    assert r.status_code == 404


def test_shoot_full_flow(session, character, workflow_id):
    frames = [{"pose_action": f"pose{i}", "outfit_overrides": {"outfit_preset": "red dress"}} for i in range(4)]
    body = {
        "name": "TEST_Shoot",
        "character_id": character["id"],
        "workflow_id": workflow_id,
        "count": 4,
        "frames": frames,
        "seed_mode": "character_pose",
        "base_seed": 999,
        "lock_scenario": True,
        "pose_mode": "manual",
    }
    r = session.post(f"{API}/shoots", json=body)
    assert r.status_code == 200, r.text
    shoot = r.json()
    sid = shoot["id"]
    assert shoot["count"] == 4
    assert len(shoot["frames"]) == 4
    assert shoot["frames"][0]["seed"] == 999
    assert shoot["frames"][1]["seed"] == 1000  # base+offset

    # List filter by character
    r = session.get(f"{API}/shoots", params={"character_id": character["id"]})
    assert r.status_code == 200
    assert any(s["id"] == sid for s in r.json())

    # Poll until done or timeout
    deadline = time.time() + 40
    final = None
    while time.time() < deadline:
        r = session.get(f"{API}/shoots/{sid}")
        assert r.status_code == 200
        d = r.json()
        if d["status"] in ("done", "failed") and d["progress"] >= 1.0:
            final = d
            break
        time.sleep(2)
    assert final, "shoot did not complete in time"
    # ComfyUI offline => expected 'failed' overall (any_failed) with all frames 'offline'
    assert final["progress"] == 1.0
    assert len(final.get("renders", [])) == 4
    statuses = [f["status"] for f in final["frames"]]
    assert all(s in ("offline", "failed", "done") for s in statuses), statuses
    # At least one should be offline given ComfyUI is unreachable
    assert any(s == "offline" for s in statuses), statuses

    # Retry a frame
    r = session.post(f"{API}/shoots/{sid}/retry/0", json={"seed": 42})
    assert r.status_code == 200
    time.sleep(3)
    r = session.get(f"{API}/shoots/{sid}")
    assert r.json()["frames"][0]["seed"] == 42

    # Retry invalid index
    r = session.post(f"{API}/shoots/{sid}/retry/999", json={})
    assert r.status_code == 400

    # Delete
    r = session.delete(f"{API}/shoots/{sid}")
    assert r.status_code == 200
    assert session.get(f"{API}/shoots/{sid}").status_code == 404
