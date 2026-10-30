# DermiAI showcase (branch `demo/showcase`)

**Never merge this branch.** It runs the whole product flow on mock models and browser storage, for demos only.
Share its Vercel preview link instead: Project → Deployments → the `demo/showcase` deployment.

## What's real and what's mocked

Open **Under the hood** in the top banner to see this live, along with every request and streamed event.

| Part | In the demo | Real system |
|---|---|---|
| Web app, API routes, SSE streaming | Real | Same |
| Contracts (`@dermiai/schemas`) | Real event types | Same |
| CNN (`/api/classify`) | `src/demo/mock-models.ts`: canned results picked from the chat, photo quality from real brightness | `ml/vision` on Cloud Run |
| Dermi (`/api/consult`) | `src/demo/engine.ts`: scripted, with red-flag detection | Fine-tuned LLM on Cloud Run |
| Retrieval (RAG) | Keyword search over 10 short notes written for the demo | Dermatology corpus index |
| Data, photos | `localStorage`, per browser; **Reset demo** clears it | Supabase |
| Ingredient label reading | Sample labels; matching against the profile is real | OCR (not built) |

All demo-only code lives in `apps/web/src/demo/`.

## Presenter script (about 5 minutes)

1. **Landing page → Get started.** Fill in onboarding: a name, a skin type, and the **Fragrance** allergy.
2. **Dashboard** (empty state) → **Start your first consultation**.
3. Type: *"I've had a red itchy rash on my left forearm for 4 days and it's getting bumpy."*
4. Dermi asks for a photo. Use **Take a photo** (real camera) or **Upload**. Watch the analysis steps stream; the
   live summary fills from the CNN result.
5. Answer the questions: *"Yes, I switched to a new body lotion on Sunday"*, then *"Mostly itchy, worse at night"*.
6. Tap a face on the discomfort scale. Dermi then:
   - looks up its notes (RAG)
   - summarises the advice
   - adds a fragrance note, because of the profile
   - creates a reminder
   - asks **"Are you satisfied with your care?"** Answer **Yes**, and the case becomes Healing.
7. **Dashboard:** the case and today's reminder appear. **Case** page: **Log a check-in** (try a 3/10) to extend the
   trend chart. **Print / save PDF** produces the report for a dermatologist.
8. **Ingredient check → Snap a label:** fragrance and MI are flagged against the profile and the open case.
9. **Safety:** start a new consultation and type *"It's spreading quickly, it feels hot and I have a fever."* Dermi
   escalates straight away.
10. For technical viewers, open **Under the hood**: `DermiRequest` → `StreamStatus` / `TokenDelta` → `StreamDone`.
    The **Mock CNN result** menu forces acne, eczema or a mole check.

For a lived-in account, use **Reset demo → Load the sample patient (Aanya)**.

## Run it locally

```powershell
git switch demo/showcase
just web-dev     # http://localhost:3000, no env vars needed
```

The camera needs `localhost` or HTTPS, which the Vercel preview has.
