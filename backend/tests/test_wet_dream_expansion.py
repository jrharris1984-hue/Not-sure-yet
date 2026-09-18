"""Wet Dream Expansion regression: kink_presets CRUD + raunch persistence on characters."""
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


# ---------------- Character.raunch persistence ----------------
def test_create_character_persists_raunch_true(session):
    body = {"name": "TEST_RaunchChar", "raunch": True, "tags": ["TEST_"]}
    r = session.post(f"{API}/characters", json=body)
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["raunch"] is True
    cid = c["id"]

    # GET to verify persisted
    g = session.get(f"{API}/characters/{cid}")
    assert g.status_code == 200
    assert g.json()["raunch"] is True

    # PATCH raunch=false
    p = session.patch(f"{API}/characters/{cid}", json={"raunch": False})
    assert p.status_code == 200
    assert p.json()["raunch"] is False

    # Confirm persisted
    g2 = session.get(f"{API}/characters/{cid}")
    assert g2.json()["raunch"] is False

    # cleanup
    session.delete(f"{API}/characters/{cid}")


def test_create_character_default_raunch_false(session):
    r = session.post(f"{API}/characters", json={"name": "TEST_RaunchDefault", "tags": ["TEST_"]})
    assert r.status_code == 200
    c = r.json()
    assert c.get("raunch") is False
    session.delete(f"{API}/characters/{c['id']}")


# ---------------- Kink Presets CRUD ----------------
def test_kink_preset_list_empty_ok(session):
    r = session.get(f"{API}/kink_presets")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_kink_preset_create_get_delete(session):
    body = {
        "name": "TEST_KinkPreset_Alpha",
        "tags": ["TEST_", "custom"],
        "dna": {"kink": {"restraint": ["rope shibari"], "gag": ["ball gag"]},
                "scenario": {"kink_level": 80, "explicit_level": 70}},
    }
    r = session.post(f"{API}/kink_presets", json=body)
    assert r.status_code == 200, r.text
    kp = r.json()
    assert kp["name"] == body["name"]
    assert kp["tags"] == body["tags"]
    assert kp["dna"]["scenario"]["kink_level"] == 80
    assert "id" in kp and "_id" not in kp
    pid = kp["id"]

    # list should include it
    lr = session.get(f"{API}/kink_presets")
    assert lr.status_code == 200
    all_ids = [p["id"] for p in lr.json()]
    assert pid in all_ids

    # delete
    d = session.delete(f"{API}/kink_presets/{pid}")
    assert d.status_code == 200
    assert d.json().get("ok") is True

    # confirm gone
    lr2 = session.get(f"{API}/kink_presets")
    assert pid not in [p["id"] for p in lr2.json()]


def test_kink_preset_create_requires_name_and_dna(session):
    r = session.post(f"{API}/kink_presets", json={"tags": []})
    assert r.status_code in (400, 422)


# ---------------- New DNA sections persist through save/load ----------------
def test_new_dna_sections_persist(session):
    """Feet / Kink / Watersports arrays + fluids sub-block + dual dials must round-trip."""
    dna = {
        "identity": {"gender": "female", "age": 28},
        "intimate": {
            "pussy": "wet",
            "cum_state": ["cum on face", "cum on tits"],
            "saliva": ["drool from chin"],
            "squirt": "gushing squirt",
        },
        "feet": {
            "sole_presentation": "sole showcase",
            "toes": ["toe curl", "toe spread"],
            "foot_state": ["oiled", "sweaty"],
            "foot_act": ["foot worship", "sole licking"],
        },
        "kink": {
            "restraint": ["rope shibari", "wrists overhead"],
            "gag": ["ball gag"],
            "humiliation": ["ahegao expression", "mind-break"],
            "power_dynamic": "master and slave",
        },
        "watersports": {
            "source": "partner",
            "direction": ["on face", "in mouth"],
            "wetness": ["soaked panties"],
        },
        "scenario": {
            "explicit_level": 85,
            "kink_level": 70,
            "acts": ["fisting", "prolapse", "tentacle"],
        },
    }
    body = {"name": "TEST_WetDreamChar", "dna": dna, "raunch": True, "tags": ["TEST_"]}
    r = session.post(f"{API}/characters", json=body)
    assert r.status_code == 200, r.text
    cid = r.json()["id"]

    # GET and verify each nested array persisted
    g = session.get(f"{API}/characters/{cid}").json()
    d = g["dna"]
    assert d["feet"]["toes"] == ["toe curl", "toe spread"]
    assert d["feet"]["foot_act"] == ["foot worship", "sole licking"]
    assert d["kink"]["restraint"] == ["rope shibari", "wrists overhead"]
    assert d["kink"]["humiliation"] == ["ahegao expression", "mind-break"]
    assert d["watersports"]["direction"] == ["on face", "in mouth"]
    assert d["scenario"]["explicit_level"] == 85
    assert d["scenario"]["kink_level"] == 70
    assert d["scenario"]["acts"] == ["fisting", "prolapse", "tentacle"]
    assert d["intimate"]["cum_state"] == ["cum on face", "cum on tits"]
    assert g["raunch"] is True

    session.delete(f"{API}/characters/{cid}")
