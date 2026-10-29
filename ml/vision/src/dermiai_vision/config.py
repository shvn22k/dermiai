"""Typed schema for vision configs (ml/vision/configs/*.yaml). PLACEHOLDER fields: owner to refine."""

from pathlib import Path
from typing import Literal, TypeVar

import yaml
from pydantic import BaseModel, ConfigDict, Field


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class ExperimentMeta(_Strict):
    name: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$", max_length=48)
    description: str = ""
    seed: int = 42


class DataConfig(_Strict):
    dataset_dir: str
    image_size: int = Field(gt=0)
    num_classes: int = Field(gt=1)


class ModelConfig(_Strict):
    backbone: str  # timm model name
    pretrained: bool = True


class OptimConfig(_Strict):
    learning_rate: float = Field(gt=0)
    batch_size: int = Field(gt=0)
    num_epochs: int = Field(gt=0)


class TrackingConfig(_Strict):
    backend: Literal["wandb", "none"] = "wandb"
    project: str = "dermiai-vision"
    tags: list[str] = Field(default_factory=list)


class VisionTrainConfig(_Strict):
    kind: Literal["vision_train"]
    experiment: ExperimentMeta
    data: DataConfig
    model: ModelConfig
    optim: OptimConfig
    top_k: int = Field(default=3, gt=0)
    output_dir: str
    tracking: TrackingConfig = TrackingConfig()


class VisionServeConfig(_Strict):
    kind: Literal["vision_serve"]
    model_path: str  # local path or gs:// URI, downloaded at startup
    host: str = "0.0.0.0"  # noqa: S104 - container binding
    port: int = 8081
    max_image_bytes: int = Field(default=10 * 1024 * 1024, gt=0)


C = TypeVar("C", bound=BaseModel)

CONFIG_KINDS: dict[str, type[BaseModel]] = {
    "vision_train": VisionTrainConfig,
    "vision_serve": VisionServeConfig,
}


def load_config(path: str | Path, expected: type[C]) -> C:
    raw = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    return expected.model_validate(raw)
