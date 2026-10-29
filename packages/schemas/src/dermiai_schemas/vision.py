"""CNN classifier contract (web -> vision endpoint -> web; CNNOutput is also passed on to the LLM)."""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import AnyHttpUrl, Field, RootModel, field_validator

from dermiai_schemas.common import Contract, StreamError, StreamStatus


class ImageQuality(StrEnum):
    # PLACEHOLDER: final categories to be agreed with the vision owner.
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"  # e.g. blurry, low light, too far; prediction may be unreliable
    UNUSABLE = "unusable"  # web app should ask the user to retake the photo


class ConditionPrediction(Contract):
    condition: str = Field(min_length=1, description="Condition label from the model's label set")
    confidence: float = Field(ge=0.0, le=1.0, description="Calibrated probability in [0, 1]")


class CNNOutput(Contract):
    top_k: list[ConditionPrediction] = Field(
        min_length=1, description="Predictions sorted by confidence, highest first"
    )
    image_quality: ImageQuality
    model_version: str = Field(
        min_length=1, description="e.g. 'vision-effnetb0-v3' or a W&B artifact ref"
    )

    @field_validator("top_k")
    @classmethod
    def _sorted_descending(cls, v: list[ConditionPrediction]) -> list[ConditionPrediction]:
        confidences = [p.confidence for p in v]
        if confidences != sorted(confidences, reverse=True):
            raise ValueError("top_k must be sorted by confidence, highest first")
        return v


class VisionRequest(Contract):
    image_url: AnyHttpUrl = Field(
        description="Short-lived Supabase Storage signed URL. The endpoint downloads the image itself."
    )
    request_id: str | None = Field(default=None, description="For log correlation")


class VisionResult(Contract):
    type: Literal["result"]
    output: CNNOutput


class VisionStreamEvent(
    RootModel[Annotated[StreamStatus | VisionResult | StreamError, Field(discriminator="type")]]
):
    """One SSE event from the vision endpoint: zero or more `status`, then `result` or `error`."""
