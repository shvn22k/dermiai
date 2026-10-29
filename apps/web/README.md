# @dermiai/web

Next.js (App Router, TypeScript, Tailwind v4) on **Vercel**, with **Supabase** for Postgres, Auth and image Storage.
This is the product's only backend: its route handlers do auth, cases, reminders and report export, and proxy to
the model endpoints on GCP.

> The UI is built from the design handoff ([`design/`](../../design/README.md)) and renders demo content from
> `src/lib/demo.ts`. Every API route still returns `501 not_implemented`. The Supabase client wiring is in place.

## Pages

| Route | Screen (design/screens) | Preview states |
|---|---|---|
| `/` | Main (landing) | |
| `/sign-in` | not in the handoff, built from its tokens | |
| `/onboarding` | Onboarding | `?step=1..5` |
| `/dashboard` | Dashboard, DashboardMobile | `?preview=empty` → DashboardEmpty |
| `/cases` | not in the handoff, reuses the dashboard grid | |
| `/cases/[caseId]` | CaseDetail (timeline + printable report) | |
| `/consult` | Consultation, ConsultMobile | `?state=camera\|analyzing\|closing\|redflag` |
| `/reminders` | Reminders | |
| `/ingredients` | IngredientCheck | |

- **Design tokens** live in `src/app/globals.css` (`@theme`): `bg-merino`, `text-venice`, `rounded-card`,
  `font-display`, and the `caps` / `display` utilities for the Fustat label and Ortica heading voices. Keep the
  design rules: no icon sets, alert colours only for red flags and clashes, Rock Blue never as text.
- **Fonts:** Fustat, Poppins and Newsreader come through `next/font`. To use Ortica, add an `@font-face` for
  `"Ortica"` weight 300. It is already first in `--font-display`.
- **Shared pieces:** `components/ui.tsx` (buttons, chips, switch, hatch placeholder, pain face),
  `components/dermi.tsx` (mascot with `mood`), `components/nav.tsx` (sidebar ≥ lg, tab bar below).
- **Wiring the data:** replace the exports in `lib/demo.ts` with Supabase queries or route calls. The
  consultation summary already uses the `CNNOutput` contract.

## Layout

```
src/
├── proxy.ts                      Next 16 proxy (formerly middleware): refreshes the Supabase session
├── app/
│   ├── auth/callback/route.ts    OAuth / magic-link code exchange
│   ├── auth/signout/route.ts
│   └── api/
│       ├── uploads/              POST → signed direct-upload URL (browser uploads straight to Storage)
│       ├── classify/             POST → vision endpoint, streams VisionStreamEvent (SSE)
│       ├── consult/              POST → LLM endpoint, streams DermiStreamEvent (SSE)
│       ├── cases/[caseId]/report GET → report export
│       ├── cases/, reminders/    CRUD
│       └── reminders/dispatch/   Vercel Cron target (vercel.json)
└── lib/
    ├── env.ts / env.public.ts    zod-validated env (server-only / NEXT_PUBLIC_)
    ├── supabase/                 server (RLS, as user), client (browser), admin (service role), session
    └── models/client.ts          typed SSE clients for the GCP model endpoints
supabase/                         Supabase CLI project: config.toml, migrations/
```

## Contracts

Model request and stream-event types come from `@dermiai/schemas`. That package is **generated** from the Pydantic
models used by the ML endpoints, so web and models share one contract:

```ts
import type { DermiRequest, DermiStreamEvent } from "@dermiai/schemas";
```

Never hand-write these types. Change the Pydantic model and run `just schemas`.
Database row types are generated separately from the Supabase schema with `npm run db:types`.

## Local dev

```bash
npm install                        # at the repo root (npm workspace)
cp apps/web/.env.example apps/web/.env.local
npm run db:start -w @dermiai/web   # local Supabase (needs Docker). Prints URL and keys for .env.local
npm run dev -w @dermiai/web        # http://localhost:3000
```

## Image flow (why direct uploads)

1. `POST /api/uploads` creates a one-time signed **upload** URL under `skin-images/<user_id>/<case_id>/...`.
2. The browser uploads the bytes straight to Supabase Storage (`uploadToSignedUrl`). They never pass through Vercel,
   which avoids function body limits and transfer costs.
3. `POST /api/classify` creates a short-lived signed **download** URL and sends it to the vision endpoint
   (`VisionRequest.image_url`). The model fetches the image itself.

The bucket is private. RLS policies restrict each user to their own path prefix.

## Deploy (Vercel)

- Project **Root Directory** = `apps/web`. Vercel detects the npm workspace and installs from the repo root.
- Set the env vars from `.env.example` per environment. `SUPABASE_SECRET_KEY`, `MODEL_ENDPOINT_TOKEN` and `CRON_SECRET`
  must never get a `NEXT_PUBLIC_` prefix.
- Streaming routes set `maxDuration`. Check the limits of your Vercel plan.
