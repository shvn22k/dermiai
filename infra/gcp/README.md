# GCP deployment (placeholders)

GCP hosts **only the ML endpoints** and ML data/artifacts. The web app and its API routes run on Vercel,
and users, cases and images live in Supabase (see [ADR 0003](../../docs/decisions/0003-nextjs-supabase-vercel.md)).

| Component | Target | Config |
|---|---|---|
| Vision endpoint (CNN, SSE) | Cloud Run, CPU | `cloudrun/vision-serve.service.yaml`, `infra/docker/vision-serve.Dockerfile` |
| LLM endpoint (Dermi, SSE) | Cloud Run + NVIDIA L4 GPU | `cloudrun/llm-serve-gpu.service.yaml`, `infra/docker/llm-serve.Dockerfile` |
| Training data + DVC remote | GCS `gs://dermiai-data` | `.dvc/config` |
| Model artifacts | GCS `gs://dermiai-artifacts` and/or W&B Artifacts | |
| Images | Artifact Registry `REGION-docker.pkg.dev/PROJECT/dermiai` | |
| Secrets | Secret Manager, mounted as env vars on Cloud Run | |

Both endpoints accept a JSON request and stream `text/event-stream` responses (contracts in `packages/schemas`).
Cloud Run supports streaming responses natively. Vertex AI endpoints are an option for the vision model
(see `vertex/README.md`), but their streaming is less direct, so Cloud Run is the default for both.

## Who may call the endpoints

Only the Vercel API routes. Two modes, selected by `MODEL_AUTH_MODE` on Vercel:

| Mode | How | When |
|---|---|---|
| `bearer` (start here) | Cloud Run `--allow-unauthenticated`. Each endpoint checks `Authorization: Bearer $MODEL_ENDPOINT_TOKEN` (from Secret Manager). | MVP / demo |
| `gcp-oidc` (target) | Cloud Run IAM-only (`roles/run.invoker`). Vercel's OIDC token is exchanged through Workload Identity Federation for a Google ID token. No static secret. | Before real users |

## One-time setup (when the project exists)

```bash
gcloud config set project $GCP_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com storage.googleapis.com
gcloud storage buckets create gs://dermiai-data gs://dermiai-artifacts --location=$GCP_REGION --uniform-bucket-level-access
gcloud artifacts repositories create dermiai --repository-format=docker --location=$GCP_REGION
openssl rand -hex 32 | gcloud secrets create MODEL_ENDPOINT_TOKEN --data-file=-
```

Use one service account per endpoint, with read-only access to `gs://dermiai-artifacts` and none to the training data.
CI deploys should use Workload Identity Federation, not JSON keys. Move all of this into `infra/terraform/` once it's stable.

## Deploy (manual, for now)

```bash
TAG=$(git rev-parse --short HEAD)
docker build -f infra/docker/vision-serve.Dockerfile -t $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/dermiai/vision-serve:$TAG .
docker push $GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/dermiai/vision-serve:$TAG
gcloud run services replace infra/gcp/cloudrun/vision-serve.service.yaml --region $GCP_REGION
# then set VISION_ENDPOINT_URL in Vercel to the service URL
```
