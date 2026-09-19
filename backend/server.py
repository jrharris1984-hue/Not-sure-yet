"""Ultra Studio Character DNA Builder — FastAPI backend."""
from fastapi import FastAPI, APIRouter, HTTPException, Body, BackgroundTasks, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import re
import random
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode
from pydantic import BaseModel, Field, ConfigDict

import httpx
import websockets as ws_client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

RENDERS_DIR = ROOT_DIR / "renders"
RENDERS_DIR.mkdir(parents=True, exist_ok=True)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Ultra Studio DNA Builder")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("studio")


# ============================================================
# Models
# ============================================================
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


class Character(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str = "Untitled"
    dna: Dict[str, Any] = Field(default_factory=dict)  # Subject A dna (backward-compat mirror of subjects[0].dna)
    locks: Dict[str, bool] = Field(default_factory=dict)
    field_locks: Dict[str, Dict[str, bool]] = Field(default_factory=dict)  # {section: {field: bool}} — Subject A only
    # Multi-subject store: each subject has its own DNA + field_locks. subjects[0] mirrors `dna` above.
    subjects: List[Dict[str, Any]] = Field(default_factory=list)
    active_subject_id: str = ""
    collapsed: Dict[str, bool] = Field(default_factory=dict)  # UI state: which panes are folded
    tags: List[str] = Field(default_factory=list)
    favorite: bool = False
    raunch: bool = False  # graphic-vernacular prompt mode
    prompt_positive: str = ""
    prompt_negative: str = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class CharacterUpsert(BaseModel):
    name: Optional[str] = None
    dna: Optional[Dict[str, Any]] = None
    locks: Optional[Dict[str, bool]] = None
    field_locks: Optional[Dict[str, Dict[str, bool]]] = None
    subjects: Optional[List[Dict[str, Any]]] = None
    active_subject_id: Optional[str] = None
    collapsed: Optional[Dict[str, bool]] = None
    tags: Optional[List[str]] = None
    favorite: Optional[bool] = None
    raunch: Optional[bool] = None
    prompt_positive: Optional[str] = None
    prompt_negative: Optional[str] = None


class Render(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    character_id: Optional[str] = None
    dna_snapshot: Dict[str, Any] = Field(default_factory=dict)
    prompt_positive: str = ""
    prompt_negative: str = ""
    workflow_type: str = "image"  # image | video
    status: str = "queued"  # queued | running | done | failed | offline
    progress: float = 0.0
    comfy_prompt_id: Optional[str] = None
    output_files: List[str] = Field(default_factory=list)
    output_variants: Dict[str, List[str]] = Field(default_factory=dict)
    error: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class WorkflowTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str = "Untitled workflow"
    kind: str = "image"  # image | video | edit | face | pony
    prompt_style: str = "venice"  # venice | pony
    json_str: str = ""
    positive_node_id: str = ""
    negative_node_id: str = ""
    notes: str = ""


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "singleton"
    comfyui_url: str = "http://localhost:8188"
    openrouter_api_key: str = ""
    openrouter_model: str = "cognitivecomputations/dolphin-mixtral-8x7b"
    workflows: List[WorkflowTemplate] = Field(default_factory=list)
    default_workflow_id: str = ""
    # deprecated legacy fields (kept for older docs)
    image_workflow_json: str = ""
    video_workflow_json: str = ""
    positive_prompt_node_id: str = "6"
    negative_prompt_node_id: str = "7"
    updated_at: str = Field(default_factory=now_iso)


# ============================================================
# Helpers
# ============================================================
SEED_DIR = ROOT_DIR / "seed_workflows"


def _detect_prompt_nodes(wf: Dict[str, Any]) -> Dict[str, str]:
    """Best-effort: find positive/negative text-encode nodes.
    Preference: 1) node title/meta explicitly says 'positive'/'negative';
    2) fallback to keyword heuristic on text."""
    candidates: List[tuple] = []  # (node_id, title, text)
    for nid, node in wf.items():
        if not isinstance(node, dict):
            continue
        ct = str(node.get("class_type", ""))
        if "TextEncode" in ct or "CLIPText" in ct:
            title = str(node.get("_meta", {}).get("title", "")).lower()
            inputs = node.get("inputs", {})
            txt = str(inputs.get("text", inputs.get("prompt", "")))
            candidates.append((nid, title, txt))

    pos, neg = "", ""

    # Prefer the actual sampler wiring. This is required for Qwen Image Edit,
    # whose two encoder nodes both have empty prompts and generic titles.
    for node in wf.values():
        if not isinstance(node, dict):
            continue
        inputs = node.get("inputs", {})
        positive_ref = inputs.get("positive")
        negative_ref = inputs.get("negative")
        if isinstance(positive_ref, list) and positive_ref:
            candidate = str(positive_ref[0])
            if any(nid == candidate for nid, _title, _txt in candidates):
                pos = candidate
        if isinstance(negative_ref, list) and negative_ref:
            candidate = str(negative_ref[0])
            if any(nid == candidate for nid, _title, _txt in candidates):
                neg = candidate
        if pos and neg:
            break

    # Pass 1: exact match by title
    for nid, title, _txt in candidates:
        if not pos and ("positive" in title or "megative" not in title and " pos" in title):
            if "positive" in title:
                pos = nid
        if not neg and ("negative" in title or "megative" in title):  # 'megative' typo in your face wf
            neg = nid
    # Pass 2: keyword heuristic (only if still missing)
    neg_keywords = ("low quality", "worst quality", "watermark", "deformed", "disfigured",
                    "extra fingers", "cartoon, anime", "cgi, render", "bad anatomy")
    if not pos or not neg:
        for nid, _title, txt in candidates:
            lower = txt.lower()
            if not neg and any(k in lower for k in neg_keywords) and nid != pos:
                neg = nid
            elif not pos and nid != neg:
                pos = nid
    # Fallback: first is pos, second is neg
    if not pos and candidates:
        pos = candidates[0][0]
    if not neg and len(candidates) > 1:
        neg = next((c[0] for c in candidates if c[0] != pos), "")
    return {"positive_node_id": pos, "negative_node_id": neg}


SEED_WORKFLOWS = [
    {"file": "chroma.json", "name": "Chroma1-HD · Golden T2I", "kind": "image", "prompt_style": "venice"},
    {"file": "zimage.json", "name": "Z-image Turbo · NSFW", "kind": "image", "prompt_style": "venice"},
    {"file": "qwen.json", "name": "Qwen Image Edit 2511", "kind": "edit", "prompt_style": "venice"},
    {"file": "wan.json", "name": "WAN 2.2 5B · Image → Video", "kind": "video", "prompt_style": "venice"},
    {"file": "face.json", "name": "Face-Preserved · IPAdapter FaceID", "kind": "face", "prompt_style": "venice"},
    {"file": "pony.json", "name": "Pony V6 XL · 5 LoRAs", "kind": "pony", "prompt_style": "pony"},
]


def _detect_loras(wf: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Find LoRA nodes and return their metadata for slider UI."""
    out = []
    for nid, node in wf.items():
        if not isinstance(node, dict):
            continue
        ct = str(node.get("class_type", ""))
        if "Lora" in ct or "LoRA" in ct:
            inputs = node.get("inputs", {})
            name = inputs.get("lora_name", "")
            # derive a short label from filename
            label = os.path.basename(str(name).replace("\\", "/")).replace(".safetensors", "").replace("_", " ").replace("-", " ")
            out.append({
                "node_id": nid,
                "lora_name": name,
                "label": label,
                "strength_model": float(inputs.get("strength_model", 1.0) or 0),
                "strength_clip": float(inputs.get("strength_clip", 1.0) or 0),
            })
    return out


def _load_seed_workflows() -> List[WorkflowTemplate]:
    out: List[WorkflowTemplate] = []
    for spec in SEED_WORKFLOWS:
        p = SEED_DIR / spec["file"]
        if not p.exists():
            continue
        try:
            raw = p.read_text()
            wf = json.loads(raw)
            nodes = _detect_prompt_nodes(wf)
            out.append(WorkflowTemplate(
                name=spec["name"],
                kind=spec["kind"],
                prompt_style=spec.get("prompt_style", "venice"),
                json_str=raw,
                positive_node_id=nodes["positive_node_id"],
                negative_node_id=nodes["negative_node_id"],
            ))
        except Exception as e:
            logger.warning(f"seed workflow {spec['file']} failed: {e}")
    return out


async def get_settings() -> Settings:
    doc = await db.settings.find_one({"id": "singleton"}, {"_id": 0})
    if not doc:
        s = Settings(workflows=_load_seed_workflows())
        if s.workflows:
            s.default_workflow_id = s.workflows[0].id
        await db.settings.insert_one(s.model_dump())
        return s
    return Settings(**doc)


async def openrouter_chat(system: str, user: str, response_format_json: bool = False) -> str:
    """Chat completion via Venice.AI (uncensored NSFW-permissive LLM).
    Falls back to Settings.openrouter_api_key if a legacy key is stored there and no
    VENICE_API_KEY is present, but by default reads from env."""
    venice_key = os.environ.get("VENICE_API_KEY", "").strip()
    venice_model = os.environ.get("VENICE_MODEL", "venice-uncensored").strip() or "venice-uncensored"
    s = await get_settings()
    # Prefer env-configured Venice key. If missing, allow the legacy Settings.openrouter_api_key
    # (users who stored a Venice key there still get served).
    api_key = venice_key or s.openrouter_api_key
    if not api_key:
        raise HTTPException(status_code=400, detail="Venice API key not configured. Set VENICE_API_KEY in backend/.env.")
    payload = {
        "model": venice_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.9,
    }
    if response_format_json:
        payload["response_format"] = {"type": "json_object"}
    async with httpx.AsyncClient(timeout=90.0) as hc:
        r = await hc.post(
            "https://api.venice.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Venice error: {r.status_code} {r.text[:400]}")
        data = r.json()
    return data["choices"][0]["message"]["content"]


def extract_json(text: str) -> Dict[str, Any]:
    text = text.strip()
    # strip fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            return json.loads(m.group(0))
        raise HTTPException(status_code=502, detail=f"LLM returned non-JSON: {text[:200]}")


# ============================================================
# Health
# ============================================================
@api.get("/")
async def root():
    return {"ok": True, "service": "ultra-studio-dna"}


@api.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"ok": True, "mongo": True}
    except Exception as e:
        return JSONResponse(status_code=503, content={"ok": False, "mongo": False, "error": str(e)})


# ============================================================
# Settings
# ============================================================
@api.get("/settings", response_model=Settings)
async def read_settings():
    return await get_settings()


@api.put("/settings", response_model=Settings)
async def update_settings(body: Dict[str, Any] = Body(...)):
    current = (await get_settings()).model_dump()
    allowed = {"comfyui_url", "openrouter_api_key", "openrouter_model",
               "image_workflow_json", "video_workflow_json",
               "positive_prompt_node_id", "negative_prompt_node_id",
               "default_workflow_id"}
    for k, v in body.items():
        if k in allowed:
            current[k] = v
    current["updated_at"] = now_iso()
    await db.settings.update_one({"id": "singleton"}, {"$set": current}, upsert=True)
    return Settings(**current)


# ============================================================
# Workflow library
# ============================================================
class WorkflowUpsert(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    kind: Optional[str] = None
    json_str: Optional[str] = None
    positive_node_id: Optional[str] = None
    negative_node_id: Optional[str] = None
    notes: Optional[str] = None
    auto_detect: bool = False


@api.get("/workflows")
async def list_workflows():
    s = await get_settings()
    return [w.model_dump() for w in s.workflows]


@api.post("/workflows")
async def upsert_workflow(body: WorkflowUpsert):
    s = await get_settings()
    workflows = list(s.workflows)
    payload = body.model_dump(exclude_none=True)
    payload.pop("auto_detect", None)
    if body.auto_detect and body.json_str:
        try:
            wf = json.loads(body.json_str)
            payload.update(_detect_prompt_nodes(wf))
        except Exception:
            pass
    existing = next((w for w in workflows if w.id == body.id), None) if body.id else None
    if existing:
        for k, v in payload.items():
            setattr(existing, k, v)
        result = existing
    else:
        result = WorkflowTemplate(**payload)
        workflows.append(result)
    doc = {"workflows": [w.model_dump() for w in workflows], "updated_at": now_iso()}
    if not s.default_workflow_id and workflows:
        doc["default_workflow_id"] = workflows[0].id
    await db.settings.update_one({"id": "singleton"}, {"$set": doc}, upsert=True)
    return result.model_dump()


@api.delete("/workflows/{wid}")
async def delete_workflow(wid: str):
    s = await get_settings()
    workflows = [w for w in s.workflows if w.id != wid]
    doc = {"workflows": [w.model_dump() for w in workflows], "updated_at": now_iso()}
    if s.default_workflow_id == wid:
        doc["default_workflow_id"] = workflows[0].id if workflows else ""
    await db.settings.update_one({"id": "singleton"}, {"$set": doc}, upsert=True)
    return {"ok": True}


@api.get("/workflows/{wid}/loras")
async def workflow_loras(wid: str):
    s = await get_settings()
    wf_t = next((w for w in s.workflows if w.id == wid), None)
    if not wf_t or not wf_t.json_str.strip():
        return {"loras": []}
    try:
        wf = json.loads(wf_t.json_str)
    except Exception:
        return {"loras": []}
    return {"loras": _detect_loras(wf)}


@api.post("/workflows/reorder")
async def reorder_workflows(body: Dict[str, List[str]] = Body(...)):
    """Reorder workflows. Body: {\"order\": [wid1, wid2, ...]}."""
    s = await get_settings()
    order = body.get("order") or []
    by_id = {w.id: w for w in s.workflows}
    reordered = [by_id[wid] for wid in order if wid in by_id]
    # Preserve any workflows not mentioned in the reorder list (append at end)
    seen = set(order)
    for w in s.workflows:
        if w.id not in seen:
            reordered.append(w)
    await db.settings.update_one(
        {"id": "singleton"},
        {"$set": {"workflows": [w.model_dump() for w in reordered], "updated_at": now_iso()}},
        upsert=True,
    )
    return {"order": [w.id for w in reordered]}


@api.post("/workflows/seed")
async def seed_workflows():
    """Add missing bundled workflows and refresh existing bundled copies by name.

    Existing workflow IDs and the user's default selection are preserved, so app
    upgrades can ship corrected workflow JSON without creating duplicates.
    """
    s = await get_settings()
    bundled = _load_seed_workflows()
    bundled_by_name = {w.name: w for w in bundled}
    workflows = []
    updated = 0
    for existing in s.workflows:
        replacement = bundled_by_name.pop(existing.name, None)
        if replacement:
            replacement.id = existing.id
            replacement.notes = existing.notes
            workflows.append(replacement)
            updated += 1
        else:
            workflows.append(existing)
    new = list(bundled_by_name.values())
    workflows.extend(new)
    doc = {"workflows": [w.model_dump() for w in workflows], "updated_at": now_iso()}
    if not s.default_workflow_id and workflows:
        doc["default_workflow_id"] = workflows[0].id
    await db.settings.update_one({"id": "singleton"}, {"$set": doc}, upsert=True)
    return {"added": len(new), "updated": updated, "total": len(workflows)}


# ============================================================
# ComfyUI proxy
# ============================================================
@api.get("/comfyui/health")
async def comfyui_health():
    s = await get_settings()
    try:
        async with httpx.AsyncClient(timeout=4.0) as hc:
            r = await hc.get(f"{s.comfyui_url.rstrip('/')}/system_stats")
        return {"online": r.status_code == 200, "url": s.comfyui_url, "status": r.status_code}
    except Exception as e:
        return {"online": False, "url": s.comfyui_url, "error": str(e)}


@api.get("/comfyui/object_info")
async def comfyui_object_info():
    s = await get_settings()
    try:
        async with httpx.AsyncClient(timeout=8.0) as hc:
            r = await hc.get(f"{s.comfyui_url.rstrip('/')}/object_info")
            r.raise_for_status()
            return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ComfyUI unreachable: {e}")


def _comfy_ws_url(http_url: str, client_id: str) -> str:
    base = http_url.rstrip("/")
    if base.startswith("https://"):
        base = "wss://" + base[len("https://"):]
    elif base.startswith("http://"):
        base = "ws://" + base[len("http://"):]
    return f"{base}/ws?clientId={client_id}"


@api.websocket("/ws/comfyui")
async def comfyui_ws_proxy(websocket: WebSocket, client_id: str):
    """Proxy the browser <-> ComfyUI /ws socket. Relays text JSON events (status,
    progress, executing, executed) and binary preview frames. Closes gracefully if
    ComfyUI is unreachable."""
    await websocket.accept()
    s = await get_settings()
    target = _comfy_ws_url(s.comfyui_url, client_id)
    upstream = None
    try:
        try:
            upstream = await asyncio.wait_for(
                ws_client.connect(target, max_size=32 * 1024 * 1024, open_timeout=4),
                timeout=5.0,
            )
        except Exception as e:
            await websocket.send_json({"type": "proxy_error", "data": {"message": f"ComfyUI ws unreachable: {e}"}})
            await websocket.close(code=1011)
            return

        await websocket.send_json({"type": "proxy_ready", "data": {"client_id": client_id}})

        async def pipe_upstream_to_browser():
            try:
                async for msg in upstream:
                    if isinstance(msg, (bytes, bytearray)):
                        await websocket.send_bytes(bytes(msg))
                    else:
                        await websocket.send_text(msg)
            except Exception:
                pass

        async def pipe_browser_to_upstream():
            try:
                while True:
                    data = await websocket.receive()
                    if data.get("type") == "websocket.disconnect":
                        break
                    if "text" in data and data["text"] is not None:
                        await upstream.send(data["text"])
                    elif "bytes" in data and data["bytes"] is not None:
                        await upstream.send(data["bytes"])
            except WebSocketDisconnect:
                pass
            except Exception:
                pass

        done, pending = await asyncio.wait(
            {asyncio.create_task(pipe_upstream_to_browser()),
             asyncio.create_task(pipe_browser_to_upstream())},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for t in pending:
            t.cancel()
    finally:
        if upstream is not None:
            try:
                await upstream.close()
            except Exception:
                pass
        try:
            await websocket.close()
        except Exception:
            pass


# ============================================================
# Characters
# ============================================================
@api.get("/characters")
async def list_characters(q: Optional[str] = None,
                          tag: Optional[List[str]] = Query(default=None),
                          favorite: Optional[bool] = None, limit: int = 200):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
            {"prompt_positive": {"$regex": q, "$options": "i"}},
        ]
    if tag:
        # AND semantics — must have all selected tags
        query["tags"] = {"$all": tag}
    if favorite is not None:
        query["favorite"] = favorite
    docs = await db.characters.find(query, {"_id": 0}).sort("updated_at", -1).to_list(limit)
    # Attach latest render thumbnail per character (single Mongo aggregation)
    ids = [d["id"] for d in docs]
    if ids:
        pipeline = [
            {"$match": {"character_id": {"$in": ids}, "output_files": {"$exists": True, "$ne": []}}},
            {"$sort": {"created_at": -1}},
            {"$group": {"_id": "$character_id", "output_files": {"$first": "$output_files"}, "created_at": {"$first": "$created_at"}}},
        ]
        thumbs = {r["_id"]: r["output_files"][0] for r in await db.renders.aggregate(pipeline).to_list(len(ids)) if r.get("output_files")}
        for d in docs:
            d["thumbnail"] = thumbs.get(d["id"])
    return docs


@api.get("/characters/tags")
async def list_character_tags():
    """Return unique tags across the library with their counts, sorted desc."""
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1, "_id": 1}},
        {"$project": {"_id": 0, "tag": "$_id", "count": 1}},
    ]
    docs = await db.characters.aggregate(pipeline).to_list(500)
    return docs


@api.post("/characters", response_model=Character)
async def create_character(body: CharacterUpsert):
    c = Character(
        name=body.name or "Untitled",
        dna=body.dna or {},
        locks=body.locks or {},
        field_locks=body.field_locks or {},
        subjects=body.subjects or [],
        active_subject_id=body.active_subject_id or "",
        collapsed=body.collapsed or {},
        tags=body.tags or [],
        favorite=body.favorite or False,
        raunch=body.raunch or False,
        prompt_positive=body.prompt_positive or "",
        prompt_negative=body.prompt_negative or "",
    )
    await db.characters.insert_one(c.model_dump())
    return c


@api.get("/characters/{cid}", response_model=Character)
async def get_character(cid: str):
    doc = await db.characters.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Character not found")
    return Character(**doc)


@api.patch("/characters/{cid}", response_model=Character)
async def update_character(cid: str, body: CharacterUpsert):
    doc = await db.characters.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Character not found")
    patch = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    patch["updated_at"] = now_iso()
    await db.characters.update_one({"id": cid}, {"$set": patch})
    doc.update(patch)
    return Character(**doc)


@api.delete("/characters/{cid}")
async def delete_character(cid: str):
    await db.characters.delete_one({"id": cid})
    await db.renders.delete_many({"character_id": cid})
    return {"ok": True}


@api.post("/characters/{cid}/duplicate", response_model=Character)
async def duplicate_character(cid: str):
    doc = await db.characters.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Character not found")
    doc["id"] = new_id()
    doc["name"] = f"{doc.get('name', 'Untitled')} copy"
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.characters.insert_one(doc)
    return Character(**doc)


# ============================================================
# Kink Presets — user-saved fetish DNA stacks
# ============================================================
class KinkPreset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str = "Untitled preset"
    tags: List[str] = Field(default_factory=list)
    dna: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=now_iso)


class KinkPresetBody(BaseModel):
    name: str
    tags: Optional[List[str]] = None
    dna: Dict[str, Any]


@api.get("/kink_presets")
async def list_kink_presets():
    docs = await db.kink_presets.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/kink_presets", response_model=KinkPreset)
async def create_kink_preset(body: KinkPresetBody):
    kp = KinkPreset(name=body.name, tags=body.tags or [], dna=body.dna)
    await db.kink_presets.insert_one(kp.model_dump())
    return kp


@api.delete("/kink_presets/{pid}")
async def delete_kink_preset(pid: str):
    await db.kink_presets.delete_one({"id": pid})
    return {"ok": True}


@api.get("/characters/{cid}/renders")
async def character_renders(cid: str):
    docs = await db.renders.find({"character_id": cid}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# ============================================================
# Renders
# ============================================================
@api.get("/renders")
async def list_renders(limit: int = 200):
    return await db.renders.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)


@api.get("/renders/{rid}")
async def get_render(rid: str):
    doc = await db.renders.find_one({"id": rid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Render not found")
    return doc


class DispatchBody(BaseModel):
    character_id: Optional[str] = None
    dna: Dict[str, Any] = Field(default_factory=dict)
    prompt_positive: str = ""
    prompt_negative: str = ""
    workflow_id: Optional[str] = None
    workflow_type: str = "image"  # legacy fallback
    lora_overrides: Dict[str, Dict[str, float]] = Field(default_factory=dict)  # node_id -> {strength_model, strength_clip}
    seed: Optional[int] = None  # if provided, override any seed/noise_seed in workflow
    shoot_id: Optional[str] = None
    shoot_frame_index: Optional[int] = None
    reference_image: Optional[str] = None  # ComfyUI input filename returned by /reference-images/upload
    face_strength: float = 1.1
    faceid_v2_strength: float = 1.4
    edit_instruction: str = ""
    preserve_unmentioned: bool = True


def _patch_seed(workflow: Dict[str, Any], seed: int) -> int:
    """Overwrite `seed` and `noise_seed` on all sampler/noise nodes. Returns count patched."""
    count = 0
    for _nid, node in workflow.items():
        if not isinstance(node, dict):
            continue
        inp = node.get("inputs")
        if not isinstance(inp, dict):
            continue
        if "seed" in inp and isinstance(inp["seed"], (int, float)):
            inp["seed"] = int(seed)
            count += 1
        if "noise_seed" in inp and isinstance(inp["noise_seed"], (int, float)):
            inp["noise_seed"] = int(seed)
            count += 1
    return count


async def _perform_dispatch(body: "DispatchBody") -> Dict[str, Any]:
    """Shared dispatch pipeline. Builds a Render, patches the workflow, calls ComfyUI,
    persists the render, and returns the doc (without _id)."""
    s = await get_settings()
    wf_template: Optional[WorkflowTemplate] = None
    if body.workflow_id:
        wf_template = next((w for w in s.workflows if w.id == body.workflow_id), None)
    if not wf_template and s.default_workflow_id:
        wf_template = next((w for w in s.workflows if w.id == s.default_workflow_id), None)
    if not wf_template and s.workflows:
        wf_template = s.workflows[0]

    r = Render(
        character_id=body.character_id,
        dna_snapshot=body.dna,
        prompt_positive=body.prompt_positive,
        prompt_negative=body.prompt_negative,
        workflow_type=wf_template.kind if wf_template else body.workflow_type,
    )

    if wf_template:
        template_str = wf_template.json_str
        pos_id = wf_template.positive_node_id
        neg_id = wf_template.negative_node_id
    else:
        template_str = s.image_workflow_json if body.workflow_type == "image" else s.video_workflow_json
        pos_id = s.positive_prompt_node_id
        neg_id = s.negative_prompt_node_id

    if not template_str.strip():
        r.status = "failed"
        r.error = "No workflow template set. Add one in Settings."
        doc = r.model_dump()
        doc["shoot_id"] = body.shoot_id
        doc["shoot_frame_index"] = body.shoot_frame_index
        await db.renders.insert_one(doc)
        doc.pop("_id", None)
        return doc

    try:
        workflow = json.loads(template_str)
    except Exception as e:
        r.status = "failed"
        r.error = f"Workflow template is not valid JSON: {e}"
        doc = r.model_dump()
        doc["shoot_id"] = body.shoot_id
        doc["shoot_frame_index"] = body.shoot_frame_index
        await db.renders.insert_one(doc)
        doc.pop("_id", None)
        return doc

    # Face-preserve workflows require an uploaded reference image. Patch the
    # LoadImage and IPAdapter FaceID nodes dynamically so bundled workflows never
    # reuse the example filename that was present when the workflow was exported.
    if wf_template and wf_template.kind == "face":
        if not body.reference_image:
            r.status = "failed"
            r.error = "Select and upload a reference photograph before using the Face-Preserved workflow."
            doc = r.model_dump()
            doc["workflow_id"] = wf_template.id
            doc["workflow_name"] = wf_template.name
            await db.renders.insert_one(doc)
            doc.pop("_id", None)
            return doc
        image_patched = False
        for node in workflow.values():
            if not isinstance(node, dict):
                continue
            inputs = node.get("inputs", {})
            if node.get("class_type") == "LoadImage" and "image" in inputs:
                inputs["image"] = body.reference_image
                image_patched = True
            if node.get("class_type") == "IPAdapterFaceID":
                inputs["weight"] = max(0.0, min(2.0, float(body.face_strength)))
                if "weight_faceidv2" in inputs:
                    inputs["weight_faceidv2"] = max(0.0, min(2.0, float(body.faceid_v2_strength)))
        if not image_patched:
            r.status = "failed"
            r.error = "The selected Face-Preserved workflow has no LoadImage node."
            doc = r.model_dump()
            await db.renders.insert_one(doc)
            doc.pop("_id", None)
            return doc

    positive_text = body.prompt_positive
    negative_text = body.prompt_negative

    # Qwen Image Edit also consumes an uploaded source image, but its positive
    # prompt is a direct edit instruction rather than the character DNA prompt.
    if wf_template and wf_template.kind == "edit":
        # Re-detect from the live workflow every time. Older databases may have
        # stored the two Qwen prompt node IDs in reverse before sampler-aware
        # detection was added.
        detected_nodes = _detect_prompt_nodes(workflow)
        pos_id = detected_nodes.get("positive_node_id") or pos_id
        neg_id = detected_nodes.get("negative_node_id") or neg_id
        if not body.reference_image:
            r.status = "failed"
            r.error = "Select and upload a source image before using Qwen Image Edit."
            doc = r.model_dump()
            await db.renders.insert_one(doc)
            doc.pop("_id", None)
            return doc
        instruction = body.edit_instruction.strip()
        if not instruction:
            r.status = "failed"
            r.error = "Describe the change you want Qwen Image Edit to make."
            doc = r.model_dump()
            await db.renders.insert_one(doc)
            doc.pop("_id", None)
            return doc
        image_patched = False
        for node in workflow.values():
            if not isinstance(node, dict):
                continue
            inputs = node.get("inputs", {})
            if node.get("class_type") == "LoadImage" and "image" in inputs:
                inputs["image"] = body.reference_image
                image_patched = True
        if not image_patched:
            r.status = "failed"
            r.error = "The selected Qwen Image Edit workflow has no LoadImage node."
            doc = r.model_dump()
            await db.renders.insert_one(doc)
            doc.pop("_id", None)
            return doc
        positive_text = instruction
        if body.preserve_unmentioned:
            positive_text += (
                "\nPreserve the original subject identity, face, age, body proportions, "
                "composition, camera perspective, lighting, background, and all details "
                "not explicitly requested to change."
            )

    # Map prompts into either standard CLIP 'text' fields or Qwen 'prompt' fields.
    mapped = {"positive": False, "negative": False}
    if pos_id and pos_id in workflow and "inputs" in workflow[pos_id]:
        inputs = workflow[pos_id]["inputs"]
        key = "text" if "text" in inputs else "prompt" if "prompt" in inputs else None
        if key:
            inputs[key] = positive_text
            mapped["positive"] = True
    if neg_id and neg_id in workflow and "inputs" in workflow[neg_id]:
        inputs = workflow[neg_id]["inputs"]
        key = "text" if "text" in inputs else "prompt" if "prompt" in inputs else None
        if key:
            inputs[key] = negative_text
            mapped["negative"] = True

    # Apply LoRA weight overrides
    for node_id, weights in (body.lora_overrides or {}).items():
        if node_id in workflow and "inputs" in workflow[node_id]:
            inp = workflow[node_id]["inputs"]
            if "strength_model" in inp and "strength_model" in weights:
                inp["strength_model"] = float(weights["strength_model"])
            if "strength_clip" in inp and "strength_clip" in weights:
                inp["strength_clip"] = float(weights["strength_clip"])

    # Apply seed override
    seed_used = None
    if body.seed is not None:
        _patch_seed(workflow, int(body.seed))
        seed_used = int(body.seed)

    # Try to dispatch to ComfyUI
    try:
        async with httpx.AsyncClient(timeout=8.0) as hc:
            resp = await hc.post(
                f"{s.comfyui_url.rstrip('/')}/prompt",
                json={"prompt": workflow, "client_id": r.id},
            )
        if resp.status_code >= 400:
            r.status = "failed"
            r.error = f"ComfyUI /prompt error: {resp.status_code} {resp.text[:200]}"
        else:
            data = resp.json()
            r.comfy_prompt_id = data.get("prompt_id")
            r.status = "running"
    except Exception as e:
        r.status = "offline"
        r.error = f"ComfyUI unreachable: {e}"

    doc = r.model_dump()
    doc["mapping"] = mapped
    doc["workflow_id"] = wf_template.id if wf_template else None
    doc["workflow_name"] = wf_template.name if wf_template else None
    doc["seed_used"] = seed_used
    doc["shoot_id"] = body.shoot_id
    doc["shoot_frame_index"] = body.shoot_frame_index
    await db.renders.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/reference-images/upload")
async def upload_reference_image(image: UploadFile = File(...)):
    """Validate and forward a reference photograph to ComfyUI's input storage."""
    allowed = {"image/jpeg", "image/png", "image/webp"}
    content_type = (image.content_type or "").lower()
    if content_type not in allowed:
        raise HTTPException(400, "Reference image must be a JPG, PNG, or WEBP file.")
    data = await image.read()
    if not data:
        raise HTTPException(400, "The selected reference image is empty.")
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(413, "Reference image must be 20 MB or smaller.")

    suffix = Path(image.filename or "reference.jpg").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        suffix = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[content_type]
    comfy_name = f"ultra-studio-reference-{uuid.uuid4().hex}{suffix}"
    settings = await get_settings()
    try:
        async with httpx.AsyncClient(timeout=30.0) as hc:
            response = await hc.post(
                f"{settings.comfyui_url.rstrip('/')}/upload/image",
                files={"image": (comfy_name, data, content_type)},
                data={"type": "input", "overwrite": "true"},
            )
        if response.status_code >= 400:
            raise HTTPException(502, f"ComfyUI image upload failed: {response.status_code} {response.text[:200]}")
        payload = response.json()
        return {
            "name": payload.get("name", comfy_name),
            "subfolder": payload.get("subfolder", ""),
            "type": payload.get("type", "input"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(502, f"Could not upload the reference image to ComfyUI: {exc}")


@api.post("/renders/dispatch")
async def dispatch_render(body: DispatchBody):
    doc = await _perform_dispatch(body)
    if doc.get("status") == "failed" and doc.get("error", "").startswith(("No workflow template", "Workflow template is not valid")):
        raise HTTPException(400, doc["error"])
    return doc


def _collect_comfy_outputs(base_url: str, outputs: Dict[str, Any]) -> tuple[List[str], Dict[str, List[str]]]:
    """Build stable view URLs, preferring final enhanced images over originals."""
    collected: List[tuple[int, str, str]] = []
    variants: Dict[str, List[str]] = {"enhanced": [], "original": [], "other": []}
    for node in outputs.values():
        for media_key in ("images", "videos"):
            for item in node.get(media_key, []) or []:
                filename = str(item.get("filename", ""))
                subfolder = str(item.get("subfolder", ""))
                marker = f"{subfolder}/{filename}".lower()
                if "enhanced-2048" in marker or "enhanced" in marker:
                    label, priority = "enhanced", 0
                elif "original" in marker:
                    label, priority = "original", 2
                else:
                    label, priority = "other", 1
                query = urlencode({
                    "filename": filename,
                    "subfolder": subfolder,
                    "type": item.get("type", "output"),
                })
                url = f"{base_url.rstrip('/')}/view?{query}"
                variants[label].append(url)
                collected.append((priority, marker, url))
    collected.sort(key=lambda entry: (entry[0], entry[1]))
    return [entry[2] for entry in collected], {k: v for k, v in variants.items() if v}


@api.post("/renders/{rid}/poll")
async def poll_render(rid: str):
    doc = await db.renders.find_one({"id": rid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Render not found")
    if not doc.get("comfy_prompt_id"):
        return doc
    s = await get_settings()
    try:
        async with httpx.AsyncClient(timeout=6.0) as hc:
            resp = await hc.get(f"{s.comfyui_url.rstrip('/')}/history/{doc['comfy_prompt_id']}")
        if resp.status_code == 200:
            hist = resp.json()
            entry = hist.get(doc["comfy_prompt_id"])
            if entry:
                outputs = entry.get("outputs", {})
                files, variants = _collect_comfy_outputs(s.comfyui_url, outputs)
                update = {"status": "done" if files else doc.get("status", "running"),
                          "output_files": files,
                          "output_variants": variants,
                          "progress": 1.0 if files else doc.get("progress", 0.0),
                          "updated_at": now_iso()}
                await db.renders.update_one({"id": rid}, {"$set": update})
                doc.update(update)
    except Exception as e:
        logger.warning(f"poll_render failed: {e}")
    return doc


@api.delete("/renders/{rid}")
async def delete_render(rid: str):
    await db.renders.delete_one({"id": rid})
    return {"ok": True}


@api.post("/renders/{rid}/cancel")
async def cancel_render(rid: str):
    """Interrupt an in-flight ComfyUI render and drop it from the queue."""
    doc = await db.renders.find_one({"id": rid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Render not found")
    s = await get_settings()
    base = s.comfyui_url.rstrip("/")
    interrupted = False
    dropped = False
    try:
        async with httpx.AsyncClient(timeout=4.0) as hc:
            r1 = await hc.post(f"{base}/interrupt")
            interrupted = r1.status_code < 400
            prompt_id = doc.get("comfy_prompt_id")
            if prompt_id:
                r2 = await hc.post(f"{base}/queue", json={"delete": [prompt_id]})
                dropped = r2.status_code < 400
    except Exception as e:
        # Even if ComfyUI is unreachable, we still mark the render cancelled locally
        logger.warning(f"cancel_render: ComfyUI unreachable: {e}")
    patch = {"status": "cancelled", "error": None, "updated_at": now_iso()}
    await db.renders.update_one({"id": rid}, {"$set": patch})
    doc.update(patch)
    doc["interrupted"] = interrupted
    doc["dropped_from_queue"] = dropped
    return doc


# ============================================================
# Photo Shoot — batch renders of one character with varied poses/outfits
# ============================================================
class ShootFrame(BaseModel):
    model_config = ConfigDict(extra="ignore")
    index: int
    pose_action: str = ""
    outfit_overrides: Dict[str, Any] = Field(default_factory=dict)  # partial wardrobe overrides
    seed: Optional[int] = None
    render_id: Optional[str] = None
    status: str = "pending"  # pending | running | done | failed | offline | queued


class Shoot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str = "Photo Shoot"
    character_id: str
    workflow_id: Optional[str] = None
    count: int = 4
    frames: List[ShootFrame] = Field(default_factory=list)
    lora_overrides: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    pose_mode: str = "random"  # random | pack | manual
    pose_pack: str = ""
    seed_mode: str = "fresh"  # same | character_pose | fresh
    base_seed: Optional[int] = None
    lock_scenario: bool = True
    status: str = "queued"  # queued | running | done | failed
    progress: float = 0.0
    error: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class ShootCreateBody(BaseModel):
    name: Optional[str] = None
    character_id: str
    workflow_id: Optional[str] = None
    count: int = 4
    frames: List[Dict[str, Any]] = Field(default_factory=list)  # per-frame: pose_action, outfit_overrides, seed
    lora_overrides: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    pose_mode: str = "random"
    pose_pack: str = ""
    seed_mode: str = "fresh"
    base_seed: Optional[int] = None
    lock_scenario: bool = True


def _apply_frame_to_dna(dna: Dict[str, Any], frame: Dict[str, Any], lock_scenario: bool) -> Dict[str, Any]:
    """Build a per-frame DNA snapshot with pose + outfit overrides applied."""
    out = json.loads(json.dumps(dna or {}))  # deep copy
    pose_action = frame.get("pose_action")
    if pose_action:
        out.setdefault("pose", {})
        out["pose"]["action"] = pose_action
    outfit = frame.get("outfit_overrides") or {}
    if outfit:
        out.setdefault("wardrobe", {})
        for k, v in outfit.items():
            out["wardrobe"][k] = v
    if not lock_scenario:
        # nothing to do — caller may pre-vary scenario in frames
        pass
    return out


async def _run_shoot_background(shoot_id: str):
    """Sequential dispatch of all frames for a shoot."""
    shoot_doc = await db.shoots.find_one({"id": shoot_id}, {"_id": 0})
    if not shoot_doc:
        return
    shoot = Shoot(**shoot_doc)
    char = await db.characters.find_one({"id": shoot.character_id}, {"_id": 0})
    if not char:
        await db.shoots.update_one({"id": shoot_id}, {"$set": {"status": "failed", "error": "Character not found", "updated_at": now_iso()}})
        return
    await db.shoots.update_one({"id": shoot_id}, {"$set": {"status": "running", "updated_at": now_iso()}})

    total = len(shoot.frames)
    any_failed = False
    for i, frame in enumerate(shoot.frames):
        frame_dict = frame.model_dump()
        per_dna = _apply_frame_to_dna(char.get("dna") or {}, frame_dict, shoot.lock_scenario)
        # Build prompts on server side? No — the client sent the base prompt in char.prompt_positive.
        # We rebuild by using char's stored prompt_positive as a fallback baseline, but we honor
        # any per-frame prompt overrides sent by the client through outfit changes only.
        # The client should send desired positive/negative in ShootCreateBody? Actually to keep
        # it simple, we use character's saved prompts and append a per-frame override string.
        pos = char.get("prompt_positive", "")
        neg = char.get("prompt_negative", "")
        # Simple augmentation: prepend pose_action + outfit overrides
        aug_parts = []
        if frame.pose_action:
            aug_parts.append(frame.pose_action)
        for _k, v in (frame.outfit_overrides or {}).items():
            if isinstance(v, list):
                aug_parts.extend([str(x) for x in v if x])
            elif v:
                aug_parts.append(str(v))
        if aug_parts:
            pos = ", ".join(aug_parts) + ", " + pos

        seed = frame.seed
        body = DispatchBody(
            character_id=shoot.character_id,
            dna=per_dna,
            prompt_positive=pos,
            prompt_negative=neg,
            workflow_id=shoot.workflow_id,
            lora_overrides=shoot.lora_overrides,
            seed=seed,
            shoot_id=shoot_id,
            shoot_frame_index=i,
        )
        try:
            r_doc = await _perform_dispatch(body)
            status = r_doc.get("status", "failed")
            frame.render_id = r_doc.get("id")
            frame.status = status
            if status in ("failed", "offline"):
                any_failed = True
        except Exception as e:
            frame.status = "failed"
            any_failed = True
            logger.warning(f"shoot frame {i} dispatch error: {e}")

        # Update the shoot with progress after each frame
        await db.shoots.update_one(
            {"id": shoot_id},
            {"$set": {
                "frames": [f.model_dump() for f in shoot.frames],
                "progress": (i + 1) / total if total else 1.0,
                "updated_at": now_iso(),
            }},
        )
        # Small pacing gap so ComfyUI can queue cleanly
        await asyncio.sleep(0.5)

    final_status = "done" if not any_failed else "failed"
    await db.shoots.update_one(
        {"id": shoot_id},
        {"$set": {"status": final_status, "progress": 1.0, "updated_at": now_iso()}},
    )


@api.post("/shoots")
async def create_shoot(body: ShootCreateBody, background_tasks: BackgroundTasks):
    if body.count < 1 or body.count > 40:
        raise HTTPException(400, "count must be between 1 and 40")
    if not body.frames or len(body.frames) != body.count:
        raise HTTPException(400, "frames list length must equal count")
    char = await db.characters.find_one({"id": body.character_id}, {"_id": 0})
    if not char:
        raise HTTPException(404, "Character not found")

    # Compute seeds according to seed_mode if not explicitly set
    base_seed = body.base_seed if body.base_seed is not None else random.randint(1, 2**31 - 1)
    frames: List[ShootFrame] = []
    for i, f in enumerate(body.frames):
        seed = f.get("seed")
        if seed is None:
            if body.seed_mode == "same":
                seed = base_seed
            elif body.seed_mode == "character_pose":
                seed = base_seed + i  # base drives character; small offset varies pose
            else:  # fresh
                seed = random.randint(1, 2**31 - 1)
        frames.append(ShootFrame(
            index=i,
            pose_action=str(f.get("pose_action") or ""),
            outfit_overrides=f.get("outfit_overrides") or {},
            seed=int(seed),
            status="pending",
        ))

    shoot = Shoot(
        name=body.name or f"Shoot · {char.get('name','Untitled')}",
        character_id=body.character_id,
        workflow_id=body.workflow_id,
        count=body.count,
        frames=frames,
        lora_overrides=body.lora_overrides,
        pose_mode=body.pose_mode,
        pose_pack=body.pose_pack,
        seed_mode=body.seed_mode,
        base_seed=base_seed,
        lock_scenario=body.lock_scenario,
        status="queued",
    )
    await db.shoots.insert_one(shoot.model_dump())
    background_tasks.add_task(_run_shoot_background, shoot.id)
    return shoot.model_dump()


@api.get("/shoots")
async def list_shoots(character_id: Optional[str] = None, limit: int = 100):
    query: Dict[str, Any] = {}
    if character_id:
        query["character_id"] = character_id
    docs = await db.shoots.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api.get("/shoots/{sid}")
async def get_shoot(sid: str):
    doc = await db.shoots.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Shoot not found")
    # Attach latest render docs (for output_files + status refresh)
    render_ids = [f.get("render_id") for f in doc.get("frames", []) if f.get("render_id")]
    renders = []
    if render_ids:
        renders = await db.renders.find({"id": {"$in": render_ids}}, {"_id": 0}).to_list(len(render_ids))
    by_id = {r["id"]: r for r in renders}
    doc["renders"] = [by_id.get(rid) for rid in render_ids]
    return doc


@api.delete("/shoots/{sid}")
async def delete_shoot(sid: str):
    doc = await db.shoots.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Shoot not found")
    render_ids = [f.get("render_id") for f in doc.get("frames", []) if f.get("render_id")]
    if render_ids:
        await db.renders.delete_many({"id": {"$in": render_ids}})
    await db.shoots.delete_one({"id": sid})
    return {"ok": True}


class ShootRetryBody(BaseModel):
    seed: Optional[int] = None


@api.post("/shoots/{sid}/retry/{frame_index}")
async def retry_shoot_frame(sid: str, frame_index: int, body: ShootRetryBody, background_tasks: BackgroundTasks):
    doc = await db.shoots.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Shoot not found")
    shoot = Shoot(**doc)
    if frame_index < 0 or frame_index >= len(shoot.frames):
        raise HTTPException(400, "Invalid frame index")
    frame = shoot.frames[frame_index]
    # Optionally reset seed
    if body.seed is not None:
        frame.seed = int(body.seed)

    async def _retry():
        char = await db.characters.find_one({"id": shoot.character_id}, {"_id": 0})
        if not char:
            return
        # Delete old render doc if any
        if frame.render_id:
            await db.renders.delete_one({"id": frame.render_id})
        per_dna = _apply_frame_to_dna(char.get("dna") or {}, frame.model_dump(), shoot.lock_scenario)
        pos = char.get("prompt_positive", "")
        neg = char.get("prompt_negative", "")
        aug_parts = []
        if frame.pose_action:
            aug_parts.append(frame.pose_action)
        for _k, v in (frame.outfit_overrides or {}).items():
            if isinstance(v, list):
                aug_parts.extend([str(x) for x in v if x])
            elif v:
                aug_parts.append(str(v))
        if aug_parts:
            pos = ", ".join(aug_parts) + ", " + pos
        body_disp = DispatchBody(
            character_id=shoot.character_id,
            dna=per_dna,
            prompt_positive=pos,
            prompt_negative=neg,
            workflow_id=shoot.workflow_id,
            lora_overrides=shoot.lora_overrides,
            seed=frame.seed,
            shoot_id=sid,
            shoot_frame_index=frame_index,
        )
        r_doc = await _perform_dispatch(body_disp)
        frame.render_id = r_doc.get("id")
        frame.status = r_doc.get("status", "failed")
        # persist back
        cur = await db.shoots.find_one({"id": sid}, {"_id": 0})
        if cur:
            frames = cur.get("frames", [])
            frames[frame_index] = frame.model_dump()
            await db.shoots.update_one(
                {"id": sid},
                {"$set": {"frames": frames, "updated_at": now_iso()}},
            )

    background_tasks.add_task(_retry)
    return {"ok": True, "frame_index": frame_index}


# ============================================================
# AI Assist (OpenRouter)
# ============================================================
class FreeformBody(BaseModel):
    text: str


class RefineBody(BaseModel):
    dna: Dict[str, Any]
    instruction: str


class SuggestBody(BaseModel):
    section: str
    dna: Dict[str, Any] = Field(default_factory=dict)


class EditPromptBody(BaseModel):
    instruction: str
    preserve_unmentioned: bool = True


DNA_SCHEMA_HINT = """The DNA object has these sections and example keys:
- identity: { gender, age, ethnicity, archetype, name }
- physique: { height, body_type, muscularity, curves, bust, proportions }
- face: { eye_shape, eye_color, jawline, nose, lips, expression, age_detail }
- hair: { style, length, color, texture, bangs, facial_hair }
- skin: { tone, texture, freckles, tattoos, tan_lines, glow, imperfections }
- wardrobe: { top, bottom, underwear, material, palette, fit }
- pose: { action, angle, distance, hands, body_language }
- scene: { environment, background, indoor_outdoor, era, props }
- lighting: { source, color_temp, direction, style, mood }
- camera: { lens, aperture, angle, aspect_ratio }
- style: { render, cinematic, film_grain, artistic_tone, extra }
Values are short strings. Sliders (muscularity, curves, age, glow) can be numbers 0-100."""


@api.post("/ai/freeform")
async def ai_freeform(body: FreeformBody):
    sys = (
        "You are a character-design assistant. Convert a short freeform description into a "
        "structured DNA JSON object for photo-realistic adult character generation. "
        "NSFW-permissive. " + DNA_SCHEMA_HINT + " Return ONLY a JSON object matching the sections above."
    )
    out = await openrouter_chat(sys, body.text, response_format_json=True)
    return {"dna": extract_json(out)}


@api.post("/ai/refine")
async def ai_refine(body: RefineBody):
    sys = (
        "You are a character-design assistant. You will receive an existing DNA JSON and a "
        "text instruction. Apply the instruction and return the FULL updated DNA JSON. "
        "Preserve keys not affected by the instruction. " + DNA_SCHEMA_HINT +
        " Return ONLY the JSON object."
    )
    user = f"Current DNA:\n{json.dumps(body.dna)}\n\nInstruction: {body.instruction}"
    out = await openrouter_chat(sys, user, response_format_json=True)
    return {"dna": extract_json(out)}


@api.post("/ai/edit-prompt")
async def ai_edit_prompt(body: EditPromptBody):
    """Use Venice to turn a rough request into a precise Qwen image-edit instruction."""
    system = (
        "You write concise, literal instructions for Qwen Image Edit. Expand the user's request "
        "into one clear image-edit prompt. State exactly what should change. Do not invent changes "
        "to identity, age, body, clothing, pose, camera, lighting, or background unless requested. "
        "Return only the finished instruction with no heading, quotation marks, or explanation."
    )
    if body.preserve_unmentioned:
        system += " Explicitly instruct the editor to preserve every unmentioned visual detail."
    prompt = await openrouter_chat(system, body.instruction, response_format_json=False)
    return {"prompt": prompt.strip()}


@api.post("/ai/suggest")
async def ai_suggest(body: SuggestBody):
    sys = (
        "You are a character-design assistant. Suggest 5 distinct creative options for the "
        f"section '{body.section}' of a character DNA. NSFW-permissive. "
        "Return ONLY a JSON object like: {\"options\": [ { ...section fields... }, ...5 items ] }."
    )
    user = f"Existing DNA context (for coherence): {json.dumps(body.dna)}\nSection to fill: {body.section}"
    out = await openrouter_chat(sys, user, response_format_json=True)
    return extract_json(out)


# ============================================================
# App wiring
# ============================================================
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
