"""Bounded render intentions and user feedback, independent of generation state."""
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field

ReviewText = Annotated[str, Field(max_length=32000)]

class SceneSection(BaseModel):
    model_config = ConfigDict(extra='forbid')
    label: str = Field(max_length=200)
    details: list[ReviewText] = Field(max_length=100)

class SceneReview(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: Literal[1] = 1
    task: Literal['text-to-image', 'text-to-video']
    subject_count: int = Field(ge=1, le=16)
    sections: list[SceneSection] = Field(max_length=20)
    missing: list[Literal['scene', 'lighting', 'camera']] = Field(default_factory=list, max_length=3)
    adjustments: list[ReviewText] = Field(default_factory=list, max_length=200)

class SceneRatings(BaseModel):
    model_config = ConfigDict(extra='forbid')
    likeness: Literal['', 'matched', 'missed', 'not_applicable'] = ''
    pose: Literal['', 'matched', 'missed', 'not_applicable'] = ''
    outfit: Literal['', 'matched', 'missed', 'not_applicable'] = ''
    framing: Literal['', 'matched', 'missed', 'not_applicable'] = ''
    scene: Literal['', 'matched', 'missed', 'not_applicable'] = ''

class SceneFeedback(BaseModel):
    model_config = ConfigDict(extra='forbid')
    ratings: SceneRatings = Field(default_factory=SceneRatings)
    notes: str = Field(default='', max_length=2000)
