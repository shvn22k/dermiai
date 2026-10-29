# 0003. Next.js on Vercel + Supabase as the backend, with models as streaming endpoints on GCP

- **Status:** accepted
- **Date:** 2026-10-29
- **Deciders:** @shvn22k, @palakbansal05, @Kunall04, @Hardik-1226

## Context

The first layout had a FastAPI service (`services/api`) on Cloud Run between the web app and the models. It would
handle auth, cases, reminders and report export, and orchestrate the CNN and LLM. Nobody on the team owns that service,
and auth, a database and file storage are commodity work. The models need Python and a GPU. Nothing else does.

## Decision

1. **`apps/web` is a Next.js (App Router, TypeScript, Tailwind) app on Vercel.** Its route handlers are the only backend:
   auth callbacks, cases, reminders (Vercel Cron), report export, and proxying to the model endpoints.
2. **Supabase** provides Postgres (RLS on every table), Auth, and a private Storage bucket for skin images.
   Browsers upload images **directly** to Storage with signed upload URLs created by an API route. Image bytes never pass through Vercel.
3. **The ML models are deployed separately on GCP Cloud Run** as HTTP endpoints that stream **Server-Sent Events**:
   vision (CPU) and LLM (L4 GPU). Their URLs come from env vars (`VISION_ENDPOINT_URL`, `LLM_ENDPOINT_URL`).
   The vision endpoint fetches the image itself from a short-lived signed download URL.
4. **Contracts** for requests and stream events are Pydantic models in `packages/schemas`, generated as TypeScript for the web app.
5. **Endpoint auth:** start with a shared bearer token (Secret Manager on GCP, Vercel env on the web side). Move to
   Vercel OIDC → GCP Workload Identity Federation → Cloud Run IAM before real users (`MODEL_AUTH_MODE=gcp-oidc`).

## Alternatives considered

- **Keep FastAPI on Cloud Run:** a single language for backend and ML, but it means building auth, a DB layer and uploads
  ourselves, plus one more service to deploy and own.
- **Firebase (Auth + Firestore + Storage):** similar managed convenience, but a document DB is a poor fit for relational
  cases/messages/reminders and for report queries. Postgres + RLS is easier to reason about for health data.
- **Vertex AI endpoints for the models:** model registry and traffic splitting, but streaming is less direct
  (`streamRawPredict`) and endpoints don't scale to zero. Still an option for the CNN.
- **Upload images through an API route:** simpler, but it hits function body-size limits and pays Vercel for bandwidth.

## Consequences

- Three platforms (Vercel, Supabase, GCP) each need env and secret management. `.env.example` files document them per side.
- Vercel function duration limits apply to the streaming routes (`maxDuration`). GPU cold starts must emit `status`
  events quickly so the stream stays alive and the UI can show progress.
- Supabase holds personal health data. Pick an EU region, enable RLS before any data exists, and keep the service-role key
  server-only (`server-only` imports, never `NEXT_PUBLIC_`).
- Model teams can redeploy endpoints independently, as long as the contract version is compatible.
- DB row types come from Supabase migrations (`npm run db:types`), not from `packages/schemas`.
