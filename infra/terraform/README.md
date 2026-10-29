# Terraform (placeholder)

Empty on purpose. Once the manual setup in `infra/gcp/README.md` is stable, codify it here:

- `modules/`: `cloud_run_service`, `gcs_bucket`, `artifact_registry`, `secret`, `service_account`
- `envs/dev/`, `envs/prod/`: one root module per environment, with remote state in a GCS bucket
- Workload Identity Federation for GitHub Actions deploys

State files and `*.tfvars` are gitignored. Commit `*.tfvars.example` instead.
