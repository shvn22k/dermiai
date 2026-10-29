"""LLM ("Dermi") contract between the web app's API routes and the LLM endpoint.

PLACEHOLDER: fields are a starting point to be refined by the LLM and web owners.
"""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import Field, RootModel

from dermiai_schemas.common import Contract, StreamError, StreamStatus
from dermiai_schemas.vision import CNNOutput


class ChatRole(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(Contract):
    role: ChatRole
    content: str


class DermiRequest(Contract):
    messages: list[ChatMessage] = Field(min_length=1)
    cnn_result: CNNOutput | None = Field(
        default=None, description="Latest classifier output for this case, if an image was provided"
    )
    case_id: str | None = Field(default=None, description="For log correlation only")


class DermiResponse(Contract):
    message: ChatMessage
    model_version: str
    escalate_to_clinician: bool = Field(
        default=False, description="True when the model/guardrails recommend seeing a professional"
    )
    safety_flags: list[str] = Field(default_factory=list)


class TokenDelta(Contract):
    type: Literal["delta"]
    content: str


class StreamDone(Contract):
    """Final event: the complete message plus metadata. The web app persists this."""

    type: Literal["done"]
    response: DermiResponse


class DermiStreamEvent(
    RootModel[
        Annotated[StreamStatus | TokenDelta | StreamDone | StreamError, Field(discriminator="type")]
    ]
):
    """One SSE event from the LLM endpoint: `status`*, `delta`*, then `done` or `error`."""
