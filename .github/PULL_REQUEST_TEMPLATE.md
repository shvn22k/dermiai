## What & why

<!-- One or two sentences. Link the issue: Closes #123 -->

## Area

- [ ] ml/llm
- [ ] ml/vision
- [ ] apps/web (Next.js routes / UI)
- [ ] apps/web/supabase (migrations, RLS, storage policies)
- [ ] packages/schemas (contract change: all owners must review)
- [ ] infra / CI / docs

## Checklist

- [ ] PR title follows Conventional Commits (`feat(llm): ...`, `fix(web): ...`)
- [ ] `just lint` and the tests for my area pass locally
- [ ] No data, weights, checkpoints, source texts or secrets committed (DVC / Secret Manager instead)
- [ ] No hardcoded hyperparameters or paths: everything is in a YAML config
- [ ] Contract changes: `just schemas` run (JSON Schema + TS committed), `SCHEMA_VERSION` bumped if breaking, web + model endpoints updated
- [ ] DB changes: migration added, RLS enabled on new tables, `npm run db:types` re-run
- [ ] No server secret is exposed to the browser (no `NEXT_PUBLIC_` on secrets, `server-only` imports)
- [ ] Docs / README / ADR updated if behaviour or a decision changed

## For `exp/` PRs (ML experiments)

- Config: `ml/.../configs/...yaml`
- W&B run(s): <!-- link -->
- Data version (DVC / git sha):
- Result vs baseline: <!-- metric table or one line -->
- Keep / discard / follow-up:
