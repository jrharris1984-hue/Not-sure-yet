"""Observational framing suggestions. No model training or automatic defaults."""
import hashlib
import json
import math
import re
from collections import defaultdict
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from generation_settings import normalize_generation_settings


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def workflow_revision(workflow):
    return digest({'workflow_id': workflow.id, 'graph': json.loads(workflow.json_str), 'style': workflow.prompt_style,
                   'positive': workflow.positive_node_id, 'negative': workflow.negative_node_id})


class LearningContext(BaseModel):
    model_config = ConfigDict(extra='forbid')
    workflow_id: str = Field(max_length=200)
    generation: dict[str, Any] = Field(default_factory=dict)
    selected_loras: list[dict[str, Any]] = Field(default_factory=list, max_length=2)
    lora_overrides: dict[str, Any] = Field(default_factory=dict)
    framing: list[str] = Field(default_factory=list, max_length=16)
    aspect_ratio: str = Field(default='', max_length=32000)
    subject_count: int = Field(default=1, ge=1, le=16)


class LearningDecision(BaseModel):
    model_config = ConfigDict(extra='forbid')
    context: LearningContext
    action: Literal['applied', 'dismissed', 'active']


def profile(context, style):
    generation = normalize_generation_settings({key: context.generation.get(key)
        for key in ('steps', 'cfg', 'sampler_name', 'scheduler')}, style)
    loras = [{'name': item.get('name', ''), 'strength': item.get('strength', 0.8),
              'triggers': item.get('triggers', [])} for item in context.selected_loras if item.get('name')]
    return digest({'sampling': generation, 'loras': loras, 'overrides': context.lora_overrides,
                   'framing': context.framing, 'people': context.subject_count, 'aspect_ratio':context.aspect_ratio})


def capture_learning_context(workflow_template, graph, body):
    plan = body.scene_review
    if not workflow_template or workflow_template.kind != 'image' or not plan or not plan.framing:
        return None
    context = LearningContext(workflow_id=workflow_template.id,
        generation=body.model_dump(), selected_loras=body.selected_loras or ([{
            'name': body.selected_lora_name, 'strength': body.selected_lora_strength,
            'triggers': body.selected_lora_triggers}] if body.selected_lora_name else []),
        lora_overrides=body.lora_overrides, framing=plan.framing, subject_count=plan.subject_count, aspect_ratio=plan.aspect_ratio)
    # Keep every actual graph input except variable prompt, seed, output name
    # and canvas dimensions. Different loaders/adapters/conditioning stay apart.
    ignored = {'text', 'seed', 'noise_seed', 'width', 'height', 'batch_size', 'filename_prefix'}
    normalized = {key: {**node, 'inputs': {field: value for field, value in node.get('inputs', {}).items()
                                        if field not in ignored}}
                  for key, node in graph.items() if isinstance(node, dict)}
    models = sorted({str(value) for node in graph.values() if isinstance(node, dict)
                     for field, value in node.get('inputs', {}).items()
                     if field in {'ckpt_name', 'unet_name', 'clip_name', 'clip_name1', 'clip_name2', 'vae_name', 'lora_name'}
                     and isinstance(value, str)})
    return {'version': 1, 'workflow_revision': workflow_revision(workflow_template),
            'profile': profile(context, workflow_template.prompt_style),
            'graph_signature': digest(normalized), 'models': models}


def framing_recommendations(records, revision, selected_profile, aspect_ratio=''):
    ratio = None
    if aspect_ratio:
        if len(aspect_ratio) > 40 or not re.fullmatch(r'\d+(?:\.\d+)?:\d+(?:\.\d+)?', aspect_ratio):
            return {'reviewed_examples':0, 'recommendations':[]}
        horizontal, vertical = map(float, aspect_ratio.split(':'))
        if horizontal <= 0 or vertical <= 0 or not math.isfinite(horizontal / vertical):
            return {'reviewed_examples':0, 'recommendations':[]}
        ratio = horizontal / vertical
    unique = {}
    for record in records:
        learned = record.get('learning_context') or {}
        rating = (record.get('scene_feedback') or {}).get('ratings', {}).get('framing')
        if (record.get('status') != 'done' or record.get('hidden_from_gallery')
            or not record.get('output_files') or learned.get('version') != 1
            or learned.get('workflow_revision') != revision or learned.get('profile') != selected_profile
            or not learned.get('graph_signature') or rating not in {'matched', 'missed'}):
            continue
        settings = record.get('generation_settings') or {}
        width, height = settings.get('width'), settings.get('height')
        seed = record.get('seed_used')
        if (type(width) is not int or type(height) is not int or type(seed) is not int
            or not 256 <= width <= 2048 or not 256 <= height <= 2048 or width % 8 or height % 8):
            continue
        if ratio is not None and abs(width / height / ratio - 1) > .005:
            continue
        # Recreating a cached graph is not an additional successful experiment.
        identity = digest([learned['graph_signature'], record.get('prompt_positive'), record.get('prompt_negative'), seed, width, height])
        previous = unique.get(identity)
        if not previous or str(record['scene_feedback'].get('updated_at', '')) > str(previous['scene_feedback'].get('updated_at', '')):
            unique[identity] = record
    groups = defaultdict(list)
    for record in unique.values():
        settings = record['generation_settings']
        groups[(record['learning_context']['graph_signature'], settings['width'], settings['height'])].append(record)
    recommendations = []
    for (signature, width, height), examples in groups.items():
        matched = sum(item['scene_feedback']['ratings']['framing'] == 'matched' for item in examples)
        # Require successes across multiple prompts, not just one lucky batch.
        prompts = {item.get('prompt_positive') for item in examples if item['scene_feedback']['ratings']['framing'] == 'matched'}
        if matched < 3 or matched / len(examples) < .75 or len(prompts) < 2:
            continue
        recommendation_id = digest([revision, selected_profile, signature, width, height, 'framing-v1'])
        recommendations.append({'id': recommendation_id, 'kind': 'framing', 'settings': {'width': width, 'height': height},
            'matched': matched, 'reviewed': len(examples), 'distinct_prompts': len(prompts),
            'models': examples[0]['learning_context'].get('models', []),
            'evidence': [{'id': item['id'], 'rating': item['scene_feedback']['ratings']['framing']}
                         for item in sorted(examples, key=lambda item: str(item['scene_feedback'].get('updated_at', '')), reverse=True)[:6]]})
    recommendations.sort(key=lambda item: (-item['matched'] / item['reviewed'], -item['reviewed'], item['id']))
    return {'reviewed_examples': len(unique), 'recommendations': recommendations}
