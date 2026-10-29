# 0001. Single monorepo with uv and npm workspaces

- **Status:** accepted (revised 2026-10-29, see "Revision history")
- **Date:** 2026-10-29
- **Deciders:** @shvn22k

## Context

DermiAI has three parts built by different people: a CNN classifier, a fine-tuned LLM, and a web app.
They share data contracts (CNN output → web → LLM). Each person needs to work independently, without installing
the others' toolchains or heavy dependencies, while contract changes stay visible to everyone.

## Decision

- One git repository with areas `apps/`, `ml/`, `packages/`, `infra/` and `docs/`.
- **Python** (`ml/vision`, `ml/llm`, `packages/schemas`) is **one uv workspace** (one `uv.lock`), with separate
  `pyproject.toml` files. `uv sync --package <name>` installs only that member. Heavy ML deps sit behind extras (`--extra train`).
- **TypeScript** (`apps/web`, the generated `packages/schemas/ts`) is **one npm workspace** (root `package.json`).
  The web owner never needs Python, and the ML owners never need Node, except to regenerate contracts.
- `packages/schemas` is the only shared code. It is a dual package: Pydantic source of truth → JSON Schema →
  generated TypeScript (`@dermiai/schemas`). Areas never import each other's internals.
- CI runs per area with path filters. Changes to `packages/schemas` trigger the vision, LLM and web CI, plus a
  contract-sync check that fails if the generated files are stale.
- CODEOWNERS assigns each area to its owner. Contract changes and the web↔model proxy routes need cross-area review.

## Alternatives considered

- **Polyrepo (one repo per component):** strong isolation, but every contract change needs coordinated releases and
  a published schemas package. This is too much overhead for a team of three on a fixed deadline.
- **Independent uv projects (a lockfile each):** areas can never conflict on versions, but three lockfiles drift and the schemas
  must be path-dependencies everywhere. We can switch to this if vision and LLM ever need incompatible `torch` pins.
- **TypeScript as the source of truth for contracts (zod → JSON Schema → Pydantic):** this would favour the web side,
  but both runtime validators of model I/O are Python. Generating Pydantic is also less mature than generating TS.
- **Turborepo / Nx / Pants / Bazel:** good caching, but the learning curve is too steep for this team size. npm workspaces + uv + just cover it.

## Consequences

- One Python lockfile means one resolution: vision and LLM must agree on shared versions.
- The Python workspace has a single `.venv`. `uv sync --package X` replaces it with X's environment, while `uv run --package X`
  adds missing packages without removing others. Full-stack developers use `just setup`.
- Generated contract files (`jsonschema/`, `ts/`) are committed. That makes them reviewable in PRs, lets Vercel build without
  Python, and lets CI enforce they're in sync.
- Path-filtered workflows don't run on unrelated PRs, so only `ci-repo` should be a *required* status check.

## Revision history

- **2026-10-29 (rev 2):** removed `services/api` (FastAPI). The web app's API routes are now the backend
  ([ADR 0003](0003-nextjs-supabase-vercel.md)). This added the npm workspace and generated TypeScript contracts.
  `Case` left `packages/schemas` because it's now owned by the Supabase schema (generated DB types).
