# DermiAI task runner.  Install: `uv tool install rust-just`   List recipes: `just`
# Works on Windows (PowerShell), macOS and Linux. Keep each recipe line a single
# command (no `&&`) so it runs in both sh and Windows PowerShell 5.1.

set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]
set dotenv-load := true

llm := "uv run --package dermiai-llm"
vision := "uv run --package dermiai-vision"
web := "npm run --workspace @dermiai/web"

# List all recipes
default:
    @just --list --unsorted

# ------------------------------------------------------------------ setup

# Full dev setup: every Python area, the npm workspace, git hooks
setup:
    uv sync --all-packages
    npm install
    pre-commit install

# Vision-only env (no LLM/web deps). Pass extras, e.g. `just setup-vision --extra train`
setup-vision *ARGS:
    uv sync --package dermiai-vision {{ ARGS }}

# LLM-only env. Pass extras, e.g. `just setup-llm --extra data --extra train`
setup-llm *ARGS:
    uv sync --package dermiai-llm {{ ARGS }}

# Web-only: npm workspace (apps/web + @dermiai/schemas), no Python needed
setup-web:
    npm install

# ------------------------------------------------------------------ quality

# All hooks on all files (ruff, mypy, hygiene, secrets, data guardrails)
lint:
    pre-commit run --all-files

# Auto-format + autofix Python
fmt:
    uv run ruff format .
    uv run ruff check --fix .

# Strict type-check of all package sources (after `just setup`)
typecheck:
    uv run mypy packages/schemas/src ml/vision/src ml/llm/src
    {{ web }} typecheck

# All Python tests (after `just setup`)
test:
    uv run pytest

test-schemas:
    uv run --package dermiai-schemas pytest packages/schemas/tests

test-vision:
    {{ vision }} pytest ml/vision/tests

test-llm:
    {{ llm }} pytest ml/llm/tests

# ------------------------------------------------------------------ contracts

# Regenerate the contract artifacts: Pydantic -> JSON Schema -> TypeScript (commit the result)
schemas:
    uv run --package dermiai-schemas python -m dermiai_schemas.export packages/schemas/jsonschema
    npm run --workspace @dermiai/schemas gen

# ------------------------------------------------------------------ data (DVC)

data-pull:
    dvc pull

data-push:
    dvc push

# ------------------------------------------------------------------ LLM pipeline

# Extract text from raw sources (book PDF, film script) into data/interim
llm-extract CONFIG="ml/llm/configs/data/extract.yaml" *ARGS:
    {{ llm }} python ml/llm/scripts/extract.py --config {{ CONFIG }} {{ ARGS }}

# Clean, chunk and build per-stage datasets into data/processed
llm-build-dataset CONFIG="ml/llm/configs/data/build_dataset.yaml" *ARGS:
    {{ llm }} python ml/llm/scripts/build_dataset.py --config {{ CONFIG }} {{ ARGS }}

# Persona style extraction + synthetic dialogue generation
llm-persona CONFIG="ml/llm/configs/persona/generate.yaml" *ARGS:
    {{ llm }} python ml/llm/scripts/persona.py --config {{ CONFIG }} {{ ARGS }}

# Train one stage, e.g. `just llm-train sft ml/llm/configs/train/sft-baseline.yaml` (STAGE: cpt|sft|dpo)
llm-train STAGE CONFIG *ARGS:
    {{ llm }} python ml/llm/scripts/train.py --stage {{ STAGE }} --config {{ CONFIG }} {{ ARGS }}

# Run the eval harness
llm-eval CONFIG="ml/llm/configs/eval/baseline.yaml" *ARGS:
    {{ llm }} python ml/llm/scripts/evaluate.py --config {{ CONFIG }} {{ ARGS }}

# Local inference server (placeholder)
llm-serve CONFIG="ml/llm/configs/serve.yaml" *ARGS:
    {{ llm }} python ml/llm/scripts/serve.py --config {{ CONFIG }} {{ ARGS }}

# ------------------------------------------------------------------ vision

# Train the CNN classifier
vision-train CONFIG="ml/vision/configs/baseline.yaml" *ARGS:
    {{ vision }} python ml/vision/scripts/train.py --config {{ CONFIG }} {{ ARGS }}

# Evaluate the CNN classifier
vision-eval CONFIG="ml/vision/configs/baseline.yaml" *ARGS:
    {{ vision }} python ml/vision/scripts/evaluate.py --config {{ CONFIG }} {{ ARGS }}

# Local inference endpoint (placeholder)
vision-serve CONFIG="ml/vision/configs/serve.yaml" *ARGS:
    {{ vision }} python ml/vision/scripts/serve.py --config {{ CONFIG }} {{ ARGS }}

# ------------------------------------------------------------------ web (Next.js + Supabase)

# Next.js dev server on :3000
web-dev:
    {{ web }} dev

web-lint:
    {{ web }} lint

web-build:
    {{ web }} build

# Local Supabase stack (Postgres, Auth, Storage). Needs Docker
db-start:
    {{ web }} db:start

db-stop:
    {{ web }} db:stop

# Re-apply migrations to the local DB, then regenerate DB types
db-reset:
    {{ web }} db:reset
    {{ web }} db:types

# ------------------------------------------------------------------ docker

docker-build-vision-serve:
    docker build -f infra/docker/vision-serve.Dockerfile -t dermiai-vision-serve:local .

docker-build-llm-serve:
    docker build -f infra/docker/llm-serve.Dockerfile -t dermiai-llm-serve:local .
