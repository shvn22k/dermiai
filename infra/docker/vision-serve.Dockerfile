# syntax=docker/dockerfile:1
# DermiAI vision serving (CNN). PLACEHOLDER: the serve code isn't implemented yet.
# Build from the repo root:  docker build -f infra/docker/vision-serve.Dockerfile -t dermiai-vision-serve .
#
# CPU image for Cloud Run. A small CNN is usually fast enough on CPU. For GPU, switch the base
# to nvidia/cuda:*-runtime like llm-serve.Dockerfile, and point torch at a CUDA index in pyproject.
# Weights are NOT baked in: they're loaded from gs://dermiai-artifacts at startup.

ARG PYTHON_VERSION=3.11

FROM python:${PYTHON_VERSION}-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:0.6.14 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY packages/schemas/pyproject.toml packages/schemas/
COPY ml/vision/pyproject.toml ml/vision/
COPY ml/llm/pyproject.toml ml/llm/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --package dermiai-vision --extra serve --extra train --no-dev --no-install-workspace

COPY packages/schemas packages/schemas
COPY ml/vision/src ml/vision/src
COPY ml/vision/pyproject.toml ml/vision/README.md ml/vision/
COPY ml/vision/configs ml/vision/configs
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --package dermiai-vision --extra serve --extra train --no-dev --no-editable

FROM python:${PYTHON_VERSION}-slim AS runtime
RUN useradd --create-home --uid 10001 app
COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --from=builder --chown=app:app /app/ml/vision/configs /app/ml/vision/configs
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1 PORT=8080
USER app
WORKDIR /app
EXPOSE 8080
# PLACEHOLDER entrypoint: replace with the real SSE server once implemented.
CMD ["python", "-c", "from dermiai_vision import serve; print('vision-serve placeholder: not implemented')"]
