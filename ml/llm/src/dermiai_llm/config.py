"""Typed schemas for every LLM pipeline config (ml/llm/configs/**/*.yaml).

Each YAML file declares a `kind`; `load_config` validates it against the matching model,
so typos and missing fields fail before a GPU is ever allocated.
Relative paths are resolved from the repo root (run all commands from there).
"""

from pathlib import Path
from typing import Annotated, Literal, TypeVar

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator

Stage = Literal["cpt", "sft", "dpo"]
ExperimentName = Annotated[str, Field(pattern=r"^[a-z0-9][a-z0-9-]*$", max_length=48)]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class TrackingConfig(_Strict):
    backend: Literal["wandb", "none"] = "wandb"
    project: str = "dermiai-llm"
    entity: str | None = None  # falls back to WANDB_ENTITY
    group: str | None = None  # e.g. "sft-sweep-lr"
    tags: list[str] = Field(default_factory=list)


class ExperimentMeta(_Strict):
    name: ExperimentName
    description: str = ""
    seed: int = 42


# ----------------------------------------------------------------- data


class SourceDoc(_Strict):
    id: str
    path: str  # local path under data/raw/ or gs:// URI; the file itself is never in git
    kind: Literal["pdf", "script", "text"]


class ExtractConfig(_Strict):
    kind: Literal["extract"]
    experiment: ExperimentMeta
    sources: list[SourceDoc] = Field(min_length=1)
    output_dir: str


class BuildDatasetConfig(_Strict):
    kind: Literal["build_dataset"]
    experiment: ExperimentMeta
    input_dir: str
    output_dir: str
    chunk_tokens: int = Field(gt=0)
    chunk_overlap: int = Field(ge=0)
    eval_fraction: float = Field(ge=0.0, lt=1.0)


# ----------------------------------------------------------------- persona


class GeneratorConfig(_Strict):
    model: str
    temperature: float = Field(ge=0.0, le=2.0)
    num_dialogues: int = Field(gt=0)


class PersonaConfig(_Strict):
    kind: Literal["persona"]
    experiment: ExperimentMeta
    source_path: str
    character: str
    style_profile_path: str
    output_path: str
    generator: GeneratorConfig
    tracking: TrackingConfig = TrackingConfig()


# ----------------------------------------------------------------- train


class ModelConfig(_Strict):
    base_model: str  # HF hub id or path
    revision: str = "main"  # pin a commit hash for reproducibility
    dtype: Literal["bfloat16", "float16", "float32"] = "bfloat16"
    max_seq_len: int = Field(gt=0)
    load_in_4bit: bool = False
    init_adapter: str | None = None  # previous stage output (path or W&B artifact ref)


class LoRAConfig(_Strict):
    r: int = Field(gt=0)
    alpha: int = Field(gt=0)
    dropout: float = Field(ge=0.0, lt=1.0)
    target_modules: list[str] = Field(min_length=1)


class TrainDataConfig(_Strict):
    train_path: str
    eval_path: str | None = None


class OptimConfig(_Strict):
    learning_rate: float = Field(gt=0)
    num_epochs: float = Field(gt=0)
    per_device_batch_size: int = Field(gt=0)
    gradient_accumulation_steps: int = Field(gt=0)
    warmup_ratio: float = Field(ge=0.0, lt=1.0)
    lr_scheduler: str = "cosine"
    weight_decay: float = Field(ge=0.0)


class DPOParams(_Strict):
    beta: float = Field(gt=0)
    loss_type: str = "sigmoid"


class TrainConfig(_Strict):
    kind: Literal["train"]
    stage: Stage
    experiment: ExperimentMeta
    model: ModelConfig
    lora: LoRAConfig
    data: TrainDataConfig
    optim: OptimConfig
    dpo: DPOParams | None = None
    output_dir: str
    tracking: TrackingConfig = TrackingConfig()

    @model_validator(mode="after")
    def _dpo_params_match_stage(self) -> "TrainConfig":
        if (self.stage == "dpo") != (self.dpo is not None):
            raise ValueError("`dpo:` block is required for stage=dpo and only allowed there")
        return self


# ----------------------------------------------------------------- eval / serve


class JudgeConfig(_Strict):
    model: str
    rubric_paths: list[str] = Field(min_length=1)


class EvalConfig(_Strict):
    kind: Literal["eval"]
    experiment: ExperimentMeta
    model_path: str
    eval_sets: list[str] = Field(min_length=1)
    judge: JudgeConfig
    tracking: TrackingConfig = TrackingConfig()


class ServeConfig(_Strict):
    kind: Literal["serve"]
    model_path: str
    host: str = "0.0.0.0"  # noqa: S104 - container binding
    port: int = 8082
    max_new_tokens: int = Field(default=512, gt=0)


CONFIG_KINDS: dict[str, type[_Strict]] = {
    "extract": ExtractConfig,
    "build_dataset": BuildDatasetConfig,
    "persona": PersonaConfig,
    "train": TrainConfig,
    "eval": EvalConfig,
    "serve": ServeConfig,
}


C = TypeVar("C", bound=BaseModel)


def load_config(path: str | Path, expected: type[C]) -> C:
    raw = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"{path}: config must be a YAML mapping")
    return expected.model_validate(raw)
