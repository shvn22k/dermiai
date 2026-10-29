# 0002. Weights & Biases for experiment tracking

- **Status:** proposed
- **Date:** 2026-10-29
- **Deciders:** @shvn22k, @palakbansal05

## Context

We need to track configs, metrics and artifacts for CNN training and for a three-stage LLM pipeline, share
results across the team, and point the final report at specific runs.

## Decision

Use **W&B** (hosted, free academic/team tier). Run naming is described in `docs/experiment-tracking.md`.
All tracking calls go through the config's `tracking:` block, so switching backends later only touches the entrypoints.

## Alternatives considered

| | Weights & Biases | MLflow (self-hosted on GCP) | Vertex AI Experiments |
|---|---|---|---|
| Setup | API key, done | Tracking server on Cloud Run + Cloud SQL + GCS artifact store | Built into GCP |
| Cost | Free academic tier | GCP resources (small but non-zero, always-on DB) | GCP usage |
| LLM tooling | Native HF Trainer/TRL `report_to="wandb"`, Tables for comparing generations, sweeps | HF integration fine, weaker UI for text samples | Basic |
| Artifacts / lineage | Artifacts with lineage graph | Model registry (strong) | Vertex Model Registry |
| Data residency | SaaS: data leaves our GCP project | Fully under our control | Our GCP project |
| Lock-in | Proprietary | Open source | GCP |

## Consequences

- No infrastructure to run. Teammates can see each other's runs immediately.
- Only metrics, configs and generated *samples* go to W&B. Raw copyrighted source text and user data must
  never be logged (e.g. as Table rows). Eval samples should use synthetic or public prompts.
- If the university or data owners require data residency, switch to MLflow on Cloud Run and supersede this ADR.
