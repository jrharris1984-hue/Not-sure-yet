"""Tests for multi-subject character persistence and Venice.AI freeform integration."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----- Multi-subject persistence -----
def test_create_character_with_subjects_and_get(session):
    subjects = [
        {
            "id": "subj-a",
            "label": "A",
            "dna": {"identity": {"name": "Ava", "age": 28, "ethnicity": "east asian"}},
            "field_locks": {"identity.age": True},
        },
        {
            "id": "subj-b",
            "label": "B",
            "dna": {"identity": {"name": "Bella", "age": 42, "ethnicity": "east asian"}},
            "field_locks": {},
        },
    ]
    body = {
        "name": "TEST_MultiSubject",
        "dna": subjects[0]["dna"],
        "subjects": subjects,
        "active_subject_id": "subj-a",
        "tags": ["TEST_"],
    }
    r = session.post(f"{API}/characters", json=body)
    assert r.status_code == 200, r.text
    c = r.json()
    cid = c["id"]
    assert "_id" not in c
    assert len(c["subjects"]) == 2
    assert c["subjects"][0]["dna"]["identity"]["name"] == "Ava"
    assert c["subjects"][1]["dna"]["identity"]["name"] == "Bella"
    assert c["active_subject_id"] == "subj-a"

    # GET
    r = session.get(f"{API}/characters/{cid}")
    assert r.status_code == 200
    got = r.json()
    assert len(got["subjects"]) == 2
    assert got["subjects"][1]["dna"]["identity"]["age"] == 42
    assert got["active_subject_id"] == "subj-a"

    # PATCH: update subjects
    updated_subjects = [
        {**subjects[0], "dna": {"identity": {"name": "Ava", "age": 29, "ethnicity": "east asian"}}},
        {**subjects[1], "dna": {"identity": {"name": "Bella", "age": 41, "ethnicity": "east asian"}}},
    ]
    r = session.patch(f"{API}/characters/{cid}", json={"subjects": updated_subjects, "active_subject_id": "subj-b"})
    assert r.status_code == 200, r.text
    patched = r.json()
    assert patched["subjects"][0]["dna"]["identity"]["age"] == 29
    assert patched["subjects"][1]["dna"]["identity"]["age"] == 41
    assert patched["active_subject_id"] == "subj-b"

    # GET again to verify persistence
    r = session.get(f"{API}/characters/{cid}")
    persisted = r.json()
    assert persisted["subjects"][0]["dna"]["identity"]["age"] == 29
    assert persisted["subjects"][1]["dna"]["identity"]["age"] == 41
    assert persisted["active_subject_id"] == "subj-b"

    # cleanup
    session.delete(f"{API}/characters/{cid}")


def test_backward_compat_dna_only(session):
    body = {"name": "TEST_SoloBC", "dna": {"identity": {"name": "Solo", "age": 25}}, "tags": ["TEST_"]}
    r = session.post(f"{API}/characters", json=body)
    assert r.status_code == 200, r.text
    c = r.json()
    cid = c["id"]
    assert c["dna"]["identity"]["name"] == "Solo"
    assert c["subjects"] == []  # backward compat: not provided => empty
    r = session.get(f"{API}/characters/{cid}")
    assert r.status_code == 200
    assert r.json()["dna"]["identity"]["age"] == 25
    session.delete(f"{API}/characters/{cid}")


# ----- Venice.AI freeform -----
def test_venice_freeform_wired(session):
    """Venice key is capped => expect HTTP 502 with 'Venice error: 402' OR successful 200.
    Either outcome proves integration is wired to Venice.AI (not OpenRouter)."""
    r = session.post(f"{API}/ai/freeform", json={"text": "a shy librarian, 27, curly red hair, freckles"}, timeout=120)
    assert r.status_code in (200, 502), f"unexpected status {r.status_code}: {r.text[:400]}"
    if r.status_code == 502:
        try:
            detail = r.json().get("detail", "")
        except Exception:
            detail = r.text
        assert "Venice" in detail, f"Expected Venice error, got: {detail}"
    else:
        data = r.json()
        assert "dna" in data, f"Expected dna in response: {str(data)[:300]}"
        # 402 spend-limit case is acceptable per review request
        # (accept any 4xx from Venice as proof of correct wiring)
