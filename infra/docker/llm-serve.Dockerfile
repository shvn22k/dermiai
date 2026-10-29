# syntax=docker/dockerfile:1
# DermiAI LLM serving. PLACEHOLDER: the serve code isn't implemented yet.
# Build from the repo root:  docker build -f infra/docker/llm-serve.Dockerfile -t dermiai-llm-serve .
#
# GPU-ready base image: CUDA runtime matching the torch wheels in uv.lock.
# Alternatives once the serving stack is chosen:
#   - vllm/vllm-openai:<pinned>   (OpenAI-compatible server, best throughput, supports LoRA adapters)
#   - us-docker.pkg.dev/deeplearning-platform-release/gcr.io/pytorch-cu124.2-4.py311  (Vertex AI DLC)
# Target: Cloud Run with an NVIDIA L4 GPU (needs CUDA >= 12.2 drivers). The endpoint streams
# Server-Sent Events (DermiStreamEvent), which Cloud Run supports natively. See ADR 0003.
#
# Model weights are NOT baked into the image: download them from GCS / the W&B artifact at startup,
# or mount a GCS bucket (Cloud Run volume mounts).

FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

COPY --from=ghcr.io/astral-sh/uv:0.6.14 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_INSTALL_DIR=/opt/python \
    PYTHONUNBUFFERED=1 PORT=8080
RUN uv python install 3.11
WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY packages/schemas/pyproject.toml packages/schemas/
COPY ml/vision/pyproject.toml ml/vision/
COPY ml/llm/pyproject.toml ml/llm/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --package dermiai-llm --extra serve --extra train --no-dev --no-install-workspace

COPY packages/schemas packages/schemas
COPY ml/llm/src ml/llm/src
COPY ml/llm/pyproject.toml ml/llm/README.md ml/llm/
COPY ml/llm/configs ml/llm/configs
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --package dermiai-llm --extra serve --extra train --no-dev --no-editable

RUN useradd --create-home --uid 10001 app
USER app
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8080
# PLACEHOLDER entrypoint: replace with the real server (or `vllm serve ...`) once implemented.
CMD ["python", "-c", "from dermiai_llm.serve import server; print('llm-serve placeholder: not implemented')"]
