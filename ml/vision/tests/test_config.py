from pathlib import Path

import pytest
import yaml

from dermiai_schemas import CNNOutput
from dermiai_vision.config import CONFIG_KINDS, load_config

CONFIGS = sorted((Path(__file__).resolve().parents[1] / "configs").glob("*.yaml"))


@pytest.mark.parametrize("path", CONFIGS, ids=lambda p: p.name)
def test_config_validates(path: Path) -> None:
    kind = yaml.safe_load(path.read_text(encoding="utf-8")).get("kind")
    assert kind in CONFIG_KINDS, f"{path}: unknown or missing `kind: {kind}`"
    load_config(path, CONFIG_KINDS[kind])


def test_shared_contract_is_importable() -> None:
    assert "top_k" in CNNOutput.model_fields
