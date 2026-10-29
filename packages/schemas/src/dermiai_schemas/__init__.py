"""Shared data contracts between DermiAI components.

Every payload crossing a service boundary (web <-> vision endpoint, web <-> LLM endpoint)
is defined here once, as a Pydantic model. It is exported to JSON Schema and from there
generated as TypeScript (`@dermiai/schemas`) for the web app.
Changing a contract is a breaking change: bump SCHEMA_VERSION and update consumers.
"""

from dermiai_schemas.common import SCHEMA_VERSION, StreamError, StreamStatus
from dermiai_schemas.llm import (
    ChatMessage,
    ChatRole,
    DermiRequest,
    DermiResponse,
    DermiStreamEvent,
    StreamDone,
    TokenDelta,
)
from dermiai_schemas.vision import (
    CNNOutput,
    ConditionPrediction,
    ImageQuality,
    VisionRequest,
    VisionResult,
    VisionStreamEvent,
)

__all__ = [
    "SCHEMA_VERSION",
    "CNNOutput",
    "ChatMessage",
    "ChatRole",
    "ConditionPrediction",
    "DermiRequest",
    "DermiResponse",
    "DermiStreamEvent",
    "ImageQuality",
    "StreamDone",
    "StreamError",
    "StreamStatus",
    "TokenDelta",
    "VisionRequest",
    "VisionResult",
    "VisionStreamEvent",
]
