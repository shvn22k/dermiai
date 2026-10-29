from typing import Literal

from pydantic import BaseModel, ConfigDict

# Bump on any breaking change to a contract in this package.
SCHEMA_VERSION = "0.2.0"


class Contract(BaseModel):
    """Base for all cross-service contracts: strict, immutable, no unknown fields."""

    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)


# Model endpoints stream Server-Sent Events: one `data: <json>` line per event.
# `type` is required (no default) so the generated TypeScript union stays discriminated.


class StreamStatus(Contract):
    """Progress for the UI, e.g. 'loading model' during a GPU cold start."""

    type: Literal["status"]
    message: str


class StreamError(Contract):
    """Terminal error event. The stream closes after it."""

    type: Literal["error"]
    code: str
    message: str
