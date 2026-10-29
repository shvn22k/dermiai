"""Every YAML in ml/llm/configs must validate. This keeps broken experiment configs out of main."""

from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from dermiai_llm.config import CONFIG_KINDS, TrainConfig, load_config
from dermiai_llm.tracking import make_run_name

LLM_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = LLM_ROOT.parents[1]
CONFIGS = sorted(p for p in (LLM_ROOT / "configs").rglob("*.yaml") if "rubrics" not in p.parts)


@pytest.mark.parametrize("path", CONFIGS, ids=lambda p: p.relative_to(LLM_ROOT).as_posix())
def test_config_validates(path: Path) -> None:
    kind = yaml.safe_load(path.read_text(encoding="utf-8")).get("kind")
    assert kind in CONFIG_KINDS, f"{path}: unknown or missing `kind: {kind}`"
    cfg = load_config(path, CONFIG_KINDS[kind])
    for rubric in getattr(getattr(cfg, "judge", None), "rubric_paths", []):
        assert (REPO_ROOT / rubric).is_file(), f"missing rubric {rubric}"


def test_dpo_block_required_only_for_dpo_stage() -> None:
    raw = yaml.safe_load((LLM_ROOT / "configs/train/sft-baseline.yaml").read_text(encoding="utf-8"))
    with pytest.raises(ValidationError):
        TrainConfig.model_validate({**raw, "stage": "dpo"})


def test_unknown_keys_are_rejected() -> None:
    raw = yaml.safe_load((LLM_ROOT / "configs/train/sft-baseline.yaml").read_text(encoding="utf-8"))
    with pytest.raises(ValidationError):
        TrainConfig.model_validate({**raw, "learning_rate": 1e-3})


def test_run_name_convention() -> None:
    name = make_run_name("llm", "sft", "persona-v2", sha="a1b2c3d")
    area, step, *_, date, sha = name.split("-")
    assert (area, step, sha) == ("llm", "sft", "a1b2c3d")
    assert len(date) == 8 and date.isdigit()
