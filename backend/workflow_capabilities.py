"""Conservative capability summaries for saved ComfyUI API graphs.

These describe editable graph inputs. They do not guarantee that a model loads or
that a render will look correct.
"""
import json
from typing import Any, Dict, List


def analyze_workflow_capabilities(workflow: Dict[str, Any]) -> Dict[str, Any]:
    graph: Dict[str, Any] = {}
    if isinstance(workflow, dict):
        graph = workflow
    elif isinstance(workflow, str):
        try:
            parsed = json.loads(workflow)
            graph = parsed if isinstance(parsed, dict) else {}
        except (TypeError, json.JSONDecodeError):
            graph = {}

    image_nodes: List[str] = []
    prompt_nodes: List[str] = []
    video_nodes: List[str] = []
    lora_nodes: List[str] = []
    for node_id, node in graph.items():
        if not isinstance(node, dict):
            continue
        class_type = str(node.get("class_type") or "")
        lowered = class_type.casefold()
        inputs = node.get("inputs") if isinstance(node.get("inputs"), dict) else {}
        if lowered == "loadimage" and "image" in inputs:
            image_nodes.append(str(node_id))
        if any(token in lowered for token in ("textencode", "cliptext", "prompt")) and any(
            key in inputs for key in ("text", "prompt")
        ):
            prompt_nodes.append(str(node_id))
        if any(token in lowered for token in ("video", "wan", "ltx", "minimax")):
            video_nodes.append(str(node_id))
        if "loraloader" in lowered or "lora" in lowered:
            lora_nodes.append(str(node_id))

    return {
        "graph_parseable": bool(graph),
        "supports_reference_image": bool(image_nodes),
        "supports_reference_shoot": bool(image_nodes and prompt_nodes),
        "supports_text_to_image": bool(prompt_nodes),
        "supports_video": bool(video_nodes),
        "supports_loras": bool(lora_nodes),
        "reference_image_nodes": image_nodes[:12],
        "prompt_nodes": prompt_nodes[:20],
        "video_nodes": video_nodes[:20],
        "lora_nodes": lora_nodes[:20],
        "validation_scope": "saved graph structure only; no runtime or image-quality guarantee",
    }


def rated_recipe_examples(renders: List[Dict[str, Any]], limit: int = 3) -> Dict[str, List[Dict[str, Any]]]:
    """Return bounded, explicitly rated examples for advisory prompt planning."""
    safe: List[Dict[str, Any]] = []
    for render in renders:
        if not isinstance(render, dict) or render.get("user_quality_rating") not in (1, 2, 3, 4, 5):
            continue
        safe.append({
            "rating": render["user_quality_rating"],
            "workflow": str(render.get("workflow_name") or "")[:120],
            "prompt_excerpt": str(render.get("prompt_positive") or "")[:320],
            "note": str(render.get("user_quality_note") or "")[:240],
        })
    safe.sort(key=lambda item: item["rating"], reverse=True)
    return {"preferred_examples": [item for item in safe if item["rating"] >= 4][:limit],
            "avoid_examples": [item for item in reversed(safe) if item["rating"] <= 2][:limit]}
