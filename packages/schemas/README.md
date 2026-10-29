# packages/schemas

The single contract between the web app and the model endpoints. One source, three artifacts:

```
src/dermiai_schemas/*.py  ──export.py──▶  jsonschema/dermiai.schema.json  ──scripts/gen-ts.mjs──▶  ts/index.ts
   (Pydantic, source of truth)              (bundle, shared $defs)                    (@dermiai/schemas, generated)
```

| Contract | Direction |
|---|---|
| `VisionRequest` → SSE `VisionStreamEvent` (`status` / `result{CNNOutput}` / `error`) | web → vision endpoint |
| `DermiRequest` → SSE `DermiStreamEvent` (`status` / `delta` / `done{DermiResponse}` / `error`) | web → LLM endpoint |
| `CNNOutput` (`top_k`, `image_quality`, `model_version`) | vision → web → LLM |

## Use it

```python
from dermiai_schemas import CNNOutput, DermiStreamEvent  # ml/vision, ml/llm (uv workspace)

event = DermiStreamEvent.model_validate_json(line).root
```

```ts
import type { CNNOutput, DermiStreamEvent } from "@dermiai/schemas"; // apps/web (npm workspace)
```

## Change a contract

1. Edit the Pydantic model. Bump `SCHEMA_VERSION` in `common.py` if it's a breaking change.
2. Run `just schemas`. It regenerates `jsonschema/` and `ts/`. Commit both, and **never edit them by hand**.
3. Update both sides (model endpoint + web route) in the same PR. CODEOWNERS requests all owners.

CI fails if the generated files don't match the Python source. Stream event `type` fields have no default on purpose,
so the generated TypeScript unions stay discriminated.

Database row types (cases, messages, reminders) are not here. They come from the Supabase migrations (`npm run db:types`).
