# Vertex AI serving (placeholder)

**Not the default.** Both endpoints run on Cloud Run because they stream SSE to the Vercel API routes.
Vertex AI only supports streaming through `streamRawPredict`, behind Google auth. Consider it for the CNN if you want its model registry
and traffic splitting, and put a thin adapter in front of it.

| | Vertex AI endpoint | Cloud Run + GPU |
|---|---|---|
| Scale to zero | No: you pay while the endpoint is deployed | Yes (cold start of several minutes) |
| Ops | Model registry, versioning, traffic split built in | Same as the rest of the stack |
| Cost for a student project | Higher idle cost | Lower if demos are occasional |

Sketch:

```bash
gcloud ai models upload --region=$GCP_REGION --display-name=dermi-llm \
  --container-image-uri=$GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/dermiai/llm-serve:TAG \
  --container-health-route=/healthz --container-predict-route=/predict --container-ports=8080 \
  --artifact-uri=gs://dermiai-artifacts/llm/MODEL_VERSION
gcloud ai endpoints create --region=$GCP_REGION --display-name=dermi-llm
gcloud ai endpoints deploy-model ENDPOINT_ID --region=$GCP_REGION --model=MODEL_ID \
  --machine-type=g2-standard-8 --accelerator=type=nvidia-l4,count=1 --min-replica-count=1
```

Record the final choice as an ADR in `docs/decisions/`.
