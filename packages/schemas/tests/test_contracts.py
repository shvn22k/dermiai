from pathlib import Path

import pytest
from pydantic import ValidationError

from dermiai_schemas import CNNOutput, DermiStreamEvent, StreamDone, TokenDelta, VisionStreamEvent
from dermiai_schemas.export import BUNDLE_FILE, render

JSONSCHEMA_DIR = Path(__file__).resolve().parents[1] / "jsonschema"

VALID_CNN = {
    "top_k": [
        {"condition": "eczema", "confidence": 0.71},
        {"condition": "psoriasis", "confidence": 0.18},
    ],
    "image_quality": "good",
    "model_version": "vision-placeholder-v0",
}


def test_cnn_output_accepts_valid_payload() -> None:
    out = CNNOutput.model_validate(VALID_CNN)
    assert out.top_k[0].condition == "eczema"


@pytest.mark.parametrize(
    "patch",
    [
        {"top_k": []},
        {"top_k": [{"condition": "a", "confidence": 0.1}, {"condition": "b", "confidence": 0.9}]},
        {"top_k": [{"condition": "a", "confidence": 1.5}]},
        {"image_quality": "excellent"},
        {"unexpected_field": 1},
    ],
)
def test_cnn_output_rejects_invalid_payload(patch: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        CNNOutput.model_validate({**VALID_CNN, **patch})


def test_stream_events_are_discriminated_by_type() -> None:
    delta = DermiStreamEvent.model_validate_json('{"type": "delta", "content": "Hi"}').root
    assert isinstance(delta, TokenDelta)
    done = DermiStreamEvent.model_validate(
        {
            "type": "done",
            "response": {"message": {"role": "assistant", "content": "Hi"}, "model_version": "v0"},
        }
    ).root
    assert isinstance(done, StreamDone)
    with pytest.raises(ValidationError):
        VisionStreamEvent.model_validate({"type": "delta", "content": "wrong endpoint"})


def test_committed_json_schema_is_up_to_date() -> None:
    committed = (JSONSCHEMA_DIR / BUNDLE_FILE).read_text(encoding="utf-8")
    assert committed == render(), "Run `just schemas` and commit the result"
