"""Controlled image-size comparisons; relative preference is not absolute success."""
from copy import deepcopy
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator
from learning_history import digest, framing_recommendations
from generation_settings import LATENT_TYPES


class ComparisonCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    request_id: UUID
    source_render_id: str = Field(min_length=1, max_length=200)
    width: int = Field(strict=True, ge=256, le=2048)
    height: int = Field(strict=True, ge=256, le=2048)

    @field_validator('width', 'height')
    @classmethod
    def aligned(cls, value):
        if value % 8:
            raise ValueError('Image dimensions must be multiples of eight')
        return value


class ComparisonPreference(BaseModel):
    model_config = ConfigDict(extra='forbid')
    preference: Literal['A', 'B', 'tie', 'neither']
    notes: str = Field(default='', max_length=2000)


def supported_canvas(graph, effective, size):
    return any(node.get('class_type') in LATENT_TYPES
               and all((effective.get(str(identifier)) or {}).get(key)==size[key] for key in ('width','height'))
               for identifier,node in graph.items() if isinstance(node,dict))


def comparison_output(record):
    """One logical image may have original and enhanced SaveImage outputs."""
    variants=record.get('output_variants') or {}
    for kind in ('original','other','enhanced'):
        files=variants.get(kind) or []
        if files:
            return kind, files if len(files)==1 else []
    files=record.get('output_files') or []
    return 'output', files if len(files)==1 else []


def comparison_recipe(source, width, height, comparison_id):
    learned=source.get('learning_context') or {}
    recipe=source.get('render_recipe')
    if (source.get('status') != 'done' or not source.get('output_files') or source.get('hidden_from_gallery')
        or source.get('workflow_type', 'image') != 'image' or learned.get('version') != 1
        or not learned.get('graph_signature') or not isinstance(recipe, dict)
        or recipe.get('reference_image') or recipe.get('reference_images') or recipe.get('pose_reference_image')):
        raise ValueError('Choose a completed image-creation render with a saved learning context and recipe.')
    settings=source.get('generation_settings') or {}
    if not all(type(settings.get(key)) is int for key in ('width','height')) or type(source.get('seed_used')) is not int:
        raise ValueError('The saved render needs explicit image dimensions and a known seed.')
    if recipe.get('batch_size',1) not in (None,1) or not comparison_output(source)[1]:
        raise ValueError('Choose a render containing exactly one image.')
    if (width,height)==(settings['width'],settings['height']):
        raise ValueError('Choose a different image size for B.')
    plan=recipe.get('scene_review') or {}
    aspect=plan.get('aspect_ratio','')
    if aspect:
        # Reuse the same aspect-ratio rule as framing recommendations.
        synthetic={**source,'generation_settings':{'width':width,'height':height},
                   'scene_feedback':{'ratings':{'framing':'matched'}}}
        if not framing_recommendations([synthetic],learned.get('workflow_revision'),learned.get('profile'),aspect)['reviewed_examples']:
            raise ValueError('B must preserve the explicitly selected camera aspect ratio.')
    candidate=deepcopy(recipe)
    candidate.update(width=width,height=height,seed=source['seed_used'],batch_size=1,
        shoot_id=None,shoot_frame_index=None,parent_render_id=source['id'],operation='framing_comparison',
        learning_comparison_id=comparison_id,hidden_from_gallery=False)
    return candidate


def pair_error(comparison, a, b):
    if not a or not b:
        return 'An image is unavailable or has not finished rendering.'
    for record, label in ((a,'A'),(b,'B')):
        if record.get('status') != 'done' or not record.get('output_files'):
            return f'Image {label} has not finished successfully.'
        kind,files=comparison_output(record)
        if not files or kind!=comparison.get('output_kind',kind):
            return 'A matching single-image output stage is unavailable.'
        learned=record.get('learning_context') or {}
        if any(learned.get(key)!=comparison['expected'].get(key) for key in ('workflow_revision','graph_signature','profile')):
            return 'The workflow or model setup changed; these images are not a controlled pair.'
        if (record.get('seed_used')!=comparison['seed'] or record.get('prompt_positive')!=comparison['prompt_positive']
            or record.get('prompt_negative','')!=comparison['prompt_negative']):
            return 'The prompt or seed changed; these images are not a controlled pair.'
    if a['id']!=comparison['source_render_id'] or b.get('parent_render_id')!=a['id'] or b.get('learning_comparison_id')!=comparison['id']:
        return 'The comparison image links do not match.'
    if any((record.get('generation_settings') or {}).get(key)!=size[key]
           for record,size in ((a,comparison['baseline']), (b,comparison['target'])) for key in ('width','height')):
        return 'The saved image dimensions do not match the comparison.'
    return None


def comparison_summary(comparisons, renders):
    """Count each prompt/seed/size pair once; keep relative votes separate."""
    unique={}
    for comparison in comparisons:
        assessment=comparison.get('assessment') or {}
        a=renders.get(comparison.get('source_render_id'));b=renders.get(comparison.get('result_render_id'))
        if assessment.get('preference') not in {'A','B','tie','neither'} or pair_error(comparison,a,b):
            continue
        identity=digest([comparison['expected'],comparison['prompt_positive'],comparison['prompt_negative'],comparison['seed'],comparison['baseline'],comparison['target']])
        if identity not in unique or assessment.get('updated_at','') > unique[identity]['assessment'].get('updated_at',''):
            unique[identity]=comparison
    counts={}
    for comparison in unique.values():
        key=comparison['recommendation_id']
        group=counts.setdefault(key,{'A':0,'B':0,'tie':0,'neither':0,'total':0})
        group[comparison['assessment']['preference']]+=1;group['total']+=1
    return counts
