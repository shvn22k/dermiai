"""Export all contracts as ONE JSON Schema bundle with shared $defs.

A single bundle (rather than one file per contract) means each type is generated
exactly once in TypeScript (`packages/schemas/ts/index.ts`, see scripts/gen-ts.mjs).

Usage: python -m dermiai_schemas.export packages/schemas/jsonschema
"""

import json
import sys
from pathlib import Path

from pydantic import BaseModel, ConfigDict

from dermiai_schemas import (
    SCHEMA_VERSION,
    CNNOutput,
    DermiRequest,
    DermiResponse,
    DermiStreamEvent,
    VisionRequest,
    VisionStreamEvent,
)

BUNDLE_FILE = "dermiai.schema.json"


class DermiAIContracts(BaseModel):
    """Index of every contract. Only used to produce the bundle; never sent over the wire."""

    model_config = ConfigDict(title="DermiAIContracts")

    vision_request: VisionRequest
    vision_stream_event: VisionStreamEvent
    cnn_output: CNNOutput
    dermi_request: DermiRequest
    dermi_response: DermiResponse
    dermi_stream_event: DermiStreamEvent


def render() -> str:
    schema = DermiAIContracts.model_json_schema()
    schema["$comment"] = f"GENERATED from packages/schemas (SCHEMA_VERSION {SCHEMA_VERSION})"
    return json.dumps(schema, indent=2, sort_keys=True) + "\n"


def export(out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / BUNDLE_FILE
    path.write_text(render(), encoding="utf-8", newline="\n")
    return path


def main() -> None:
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("jsonschema")
    print(f"wrote {export(out_dir)}")


if __name__ == "__main__":
    main()
