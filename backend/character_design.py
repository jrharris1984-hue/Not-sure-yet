"""Clothed character studies compiled from structured design references."""
import json
import os
from pathlib import Path
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

WORKFLOW_ID = "clothed-character-design"
WORKFLOW_NAME = "Clothed character design · SDXL"

SHAPE_REFERENCES = {
    "small round": "compact rounded lower-body silhouette",
    "naturally round": "naturally rounded lower-body silhouette",
    "naturally full": "full natural lower-body silhouette",
    "genetically large": "broad natural lower-body silhouette",
    "athletic lifted": "high-set athletic lower-body contour",
    "athletic round": "rounded athletic lower-body contour",
    "bubble butt": "compact spherical lower-body contour",
    "soft pear-shaped": "pear-shaped silhouette with lower outer fullness",
    "dramatic pear": "pronounced pear-shaped silhouette with wide lower outer contours",
    "apple bottom": "low-set rounded lower-body contour",
    "heart-shaped": "inverted-heart silhouette tapering toward the lower curve",
    "subtle BBL": "subtle sculpted rounded lower-body contour",
    "moderate BBL": "moderately sculpted rounded lower-body contour",
    "BBL-style fuller glutes": "full sculpted rounded lower-body contour",
    "extreme BBL": "strongly sculpted rounded lower-body contour",
    "hyper BBL": "strongly rounded lower-body contour",
    "high round projection": "high-set rounded profile",
    "pronounced upper shelf": "stepped upper contour above a rounded lower profile",
    "dramatic side projection": "wide lateral lower-body contours",
    "deep rear projection": "deep rear profile with narrow lateral contours",
    "fantasy oversized glutes": "very full rounded lower-body silhouette",
    "extreme round projection": "strong spherical lower-body silhouette",
    "hyper-fantasy glutes": "very broad full lower-body silhouette",
    "smooth toned": "smooth athletic lower-body contour",
    "soft natural": "soft natural lower-body contour",
    "cellulite heavy": "soft lower-body contour with natural weight",
    "stretch-marked": "full natural lower-body contour",
    "big and round natural": "large naturally rounded lower-body contour",
    "big and round BBL": "large sculpted rounded lower-body contour",
    "cellulite BBL": "rounded sculpted contour with natural weight",
    "extreme pear BBL": "strong pear-shaped silhouette with rounded upper contours",
}
FABRIC_REFERENCES = {
    "smooth": "smooth matte fabric finish",
    "soft": "soft fabric with gentle folds",
    "firm": "structured fabric with crisp seams",
    "jiggly": "soft flexible fabric with relaxed folds",
    "cellulite light": "subtle woven fabric grain",
    "cellulite heavy": "pronounced woven fabric grain",
    "stretch marks": "subtle decorative stripes on opaque fabric",
}


class CharacterDesignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    character_id: Optional[str] = Field(default=None, max_length=128)
    size: int = Field(default=0, ge=0, le=300)
    shape: str = ""
    texture: str = ""
    age: int = Field(default=30, ge=18, le=80)
    gender: Literal["woman", "man", "person"] = "person"
    seed: Optional[int] = Field(default=None, ge=0, le=2**32 - 1)

    @field_validator("shape")
    @classmethod
    def valid_shape(cls, value):
        if value and value not in SHAPE_REFERENCES:
            raise ValueError("Choose a listed shape reference")
        return value

    @field_validator("texture")
    @classmethod
    def valid_texture(cls, value):
        if value and value not in FABRIC_REFERENCES:
            raise ValueError("Choose a listed texture reference")
        return value


def design_prompts(request: CharacterDesignRequest):
    clauses = [
        "Photorealistic full-length non-explicit character photography, exactly one adult person",
        f"{request.age}-year-old adult {request.gender}",
        "completely clothed in an opaque long-sleeved crew-neck sweatshirt, full-length opaque denim jeans, and closed-toe shoes",
        "all torso and lower-body skin covered, clothing follows the character silhouette",
        "standing upright in a neutral three-quarter rear view, head turned slightly toward the camera, arms relaxed at the sides",
        "entire head and both shoes visible, plain gray studio background, even soft studio lighting, realistic anatomy and weight, natural fabric seams and folds",
    ]
    if request.size:
        sizes = ["compact", "moderate", "full", "large", "very large", "very full and broad"]
        index = min(len(sizes) - 1, (request.size - 1) // 50)
        clauses.append(f"{sizes[index]} lower-body volume visible through the opaque garment silhouette")
    if request.shape:
        clauses.append(SHAPE_REFERENCES[request.shape])
    if request.texture:
        clauses.append(FABRIC_REFERENCES[request.texture])
    return {
        "positive": ". ".join(clauses) + ".",
        "negative": "nudity, exposed torso, exposed buttocks, underwear, lingerie, transparent clothing, erotic pose, sexual activity, multiple people, cropped head, cropped feet, distorted anatomy",
    }


def design_workflow(seed_dir: Path):
    # Load a plain bundled graph, independent of custom templates and selected LoRAs.
    graph = json.loads((seed_dir / "sdxl.json").read_text())
    graph["1"]["inputs"]["ckpt_name"] = os.environ.get("CHARACTER_DESIGN_CHECKPOINT") or graph["1"]["inputs"]["ckpt_name"]
    graph["7"]["inputs"]["filename_prefix"] = "UltraStudio_ClothedCharacterDesign"
    return graph
