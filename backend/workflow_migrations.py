"""Narrow, idempotent migrations for known legacy workflow graphs."""
import json
from typing import Any, Dict, Optional


DIRTY_MOSS_V2_NAME = "MOSS Image · Dirty-Moss V2 · Photographic Realism"
DIRTY_MOSS_V2_CHECKPOINT = "Dirty-MossV2.safetensors"


def migrate_legacy_dirty_moss_sampling_graph(workflow: Dict[str, Any]) -> Optional[str]:
    """Add the creator-recommended shift-5 sampler wrapper to the exact legacy graph.

    Only upgrades a saved Dirty-Moss V2 profile with the expected checkpoint and a
    direct UNETLoader-to-KSampler model link. The rest of the user's graph is kept.
    Returns migrated JSON, or None if the graph is custom, malformed, or current.
    """
    if not isinstance(workflow, dict) or workflow.get("name") != DIRTY_MOSS_V2_NAME:
        return None
    try:
        graph = json.loads(workflow.get("json_str") or "")
    except (TypeError, json.JSONDecodeError):
        return None
    if not isinstance(graph, dict):
        return None

    loaders = [
        str(node_id)
        for node_id, node in graph.items()
        if isinstance(node, dict)
        and node.get("class_type") == "UNETLoader"
        and node.get("inputs", {}).get("unet_name") == DIRTY_MOSS_V2_CHECKPOINT
    ]
    if len(loaders) != 1:
        return None
    loader_id = loaders[0]

    samplers = []
    for node_id, node in graph.items():
        if not isinstance(node, dict) or node.get("class_type") != "KSampler":
            continue
        model_link = node.get("inputs", {}).get("model")
        if isinstance(model_link, list) and len(model_link) == 2 and str(model_link[0]) == loader_id and model_link[1] == 0:
            samplers.append((str(node_id), node))
    if len(samplers) != 1:
        return None

    # Do not rewrite a graph where the base loader also feeds another consumer.
    loader_consumers = []
    for consumer_id, consumer in graph.items():
        if not isinstance(consumer, dict):
            continue
        for input_name, value in (consumer.get("inputs") or {}).items():
            if isinstance(value, list) and len(value) == 2 and str(value[0]) == loader_id:
                loader_consumers.append((str(consumer_id), input_name))
    sampler_id, sampler = samplers[0]
    if loader_consumers != [(sampler_id, "model")]:
        return None

    numeric_ids = [int(node_id) for node_id in graph if str(node_id).isdigit()]
    shift_node_id = str(max(numeric_ids, default=0) + 1)
    graph[shift_node_id] = {
        "inputs": {"shift": 5, "model": [loader_id, 0]},
        "class_type": "ModelSamplingSD3",
        "_meta": {"title": "Dirty-Moss V2 · creator shift 5"},
    }
    sampler["inputs"]["model"] = [shift_node_id, 0]
    return json.dumps(graph, ensure_ascii=False, indent=2)
