"""Ultra Studio Character DNA Builder — FastAPI backend."""
from fastapi import FastAPI, APIRouter, HTTPException, Body
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict

import httpx

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
    dna: Dict[str, Any] = Field(default_factory=dict)
    locks: Dict[str, bool] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    favorite: bool = False
    prompt_positive: str = ""
    prompt_negative: str = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class CharacterUpsert(BaseModel):
    name: Optional[str] = None
    dna: Optional[Dict[str, Any]] = None
    locks: Optional[Dict[str, bool]] = None
    tags: Optional[List[str]] = None
    favorite: Optional[bool] = None
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
    error: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "singleton"
    comfyui_url: str = "http://localhost:8188"
    openrouter_api_key: str = ""
    openrouter_model: str = "cognitivecomputations/dolphin-mixtral-8x7b"
    image_workflow_json: str = ""
    video_workflow_json: str = ""
    positive_prompt_node_id: str = "6"
    negative_prompt_node_id: str = "7"
    updated_at: str = Field(default_factory=now_iso)


# ============================================================
# Helpers
# ============================================================
async def get_settings() -> Settings:
    doc = await db.settings.find_one({"id": "singleton"}, {"_id": 0})
    if not doc:
        s = Settings()
        await db.settings.insert_one(s.model_dump())
        return s
    return Settings(**doc)


async def openrouter_chat(system: str, user: str, response_format_json: bool = False) -> str:
    s = await get_settings()
    if not s.openrouter_api_key:
        raise HTTPException(status_code=400, detail="OpenRouter API key not set in Settings")
    payload = {
        "model": s.openrouter_model,
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
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {s.openrouter_api_key}",
                "HTTP-Referer": "https://ultra-studio.local",
                "X-Title": "Ultra Studio DNA Builder",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"OpenRouter error: {r.status_code} {r.text[:400]}")
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
               "positive_prompt_node_id", "negative_prompt_node_id"}
    for k, v in body.items():
        if k in allowed:
            current[k] = v
    current["updated_at"] = now_iso()
    await db.settings.update_one({"id": "singleton"}, {"$set": current}, upsert=True)
    return Settings(**current)


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


# ============================================================
# Characters
# ============================================================
@api.get("/characters")
async def list_characters(q: Optional[str] = None, tag: Optional[str] = None,
                          favorite: Optional[bool] = None, limit: int = 200):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
            {"prompt_positive": {"$regex": q, "$options": "i"}},
        ]
    if tag:
        query["tags"] = tag
    if favorite is not None:
        query["favorite"] = favorite
    docs = await db.characters.find(query, {"_id": 0}).sort("updated_at", -1).to_list(limit)
    return docs


@api.post("/characters", response_model=Character)
async def create_character(body: CharacterUpsert):
    c = Character(
        name=body.name or "Untitled",
        dna=body.dna or {},
        locks=body.locks or {},
        tags=body.tags or [],
        favorite=body.favorite or False,
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
    workflow_type: str = "image"


@api.post("/renders/dispatch")
async def dispatch_render(body: DispatchBody):
    s = await get_settings()
    r = Render(
        character_id=body.character_id,
        dna_snapshot=body.dna,
        prompt_positive=body.prompt_positive,
        prompt_negative=body.prompt_negative,
        workflow_type=body.workflow_type,
    )
    template_str = s.image_workflow_json if body.workflow_type == "image" else s.video_workflow_json
    if not template_str.strip():
        r.status = "failed"
        r.error = f"No {body.workflow_type} workflow template set in Settings."
        await db.renders.insert_one(r.model_dump())
        raise HTTPException(400, r.error)

    try:
        workflow = json.loads(template_str)
    except Exception as e:
        r.status = "failed"
        r.error = f"Workflow template is not valid JSON: {e}"
        await db.renders.insert_one(r.model_dump())
        raise HTTPException(400, r.error)

    # Map prompts into template
    pos_id, neg_id = s.positive_prompt_node_id, s.negative_prompt_node_id
    mapped = {"positive": False, "negative": False}
    if pos_id in workflow and "inputs" in workflow[pos_id] and "text" in workflow[pos_id]["inputs"]:
        workflow[pos_id]["inputs"]["text"] = body.prompt_positive
        mapped["positive"] = True
    if neg_id in workflow and "inputs" in workflow[neg_id] and "text" in workflow[neg_id]["inputs"]:
        workflow[neg_id]["inputs"]["text"] = body.prompt_negative
        mapped["negative"] = True

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
    await db.renders.insert_one(doc)
    doc.pop("_id", None)
    return doc


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
                files: List[str] = []
                for node in outputs.values():
                    for imgs in node.get("images", []) or []:
                        files.append(f"{s.comfyui_url.rstrip('/')}/view?filename={imgs.get('filename')}&subfolder={imgs.get('subfolder','')}&type={imgs.get('type','output')}")
                    for vids in node.get("videos", []) or []:
                        files.append(f"{s.comfyui_url.rstrip('/')}/view?filename={vids.get('filename')}&subfolder={vids.get('subfolder','')}&type={vids.get('type','output')}")
                update = {"status": "done" if files else doc.get("status", "running"),
                          "output_files": files,
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
