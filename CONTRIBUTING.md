# Contributing to DermiAI

## Ground rules

1. **Stay in your area.** Change another area only through a PR its owner reviews (CODEOWNERS enforces this).
2. **Integrate through `packages/schemas`.** Never import another area's internals.
3. **Never commit** data, weights, checkpoints, the dermatology book, the film script, patient/user images, or secrets.
   Hooks block most of this, so don't bypass them with `--no-verify`.
4. **Nothing tunable in code.** Hyperparameters, paths and model IDs belong in YAML configs.

## Branches

`main` is protected. Every change goes through a PR. Branch from `main` and use:

| Prefix | Use | Example |
|---|---|---|
| `feat/` | New functionality | `feat/api-case-endpoints` |
| `fix/` | Bug fix | `fix/llm-chunk-overlap` |
| `exp/` | ML experiment (may be closed without merging) | `exp/llm-sft-lora-r32` |
| `docs/` | Documentation only | `docs/adr-llm-serving` |
| `chore/` | Tooling, deps, CI | `chore/bump-ruff` |

## Commits: [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <summary in imperative mood>

feat(llm): add token-aware chunker
fix(vision): correct label order in CNNOutput
exp(llm): sft with lora r=32
docs(adr): 0003 llm serving on vertex
```

- **Types:** `feat`, `fix`, `exp`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`, `data`
- **Scopes:** `llm`, `vision`, `web`, `db` (Supabase migrations), `schemas`, `infra`, `ci`, `adr`
- **Breaking contract change:** `feat(schemas)!: ...` plus a `BREAKING CHANGE:` footer

PRs are squash-merged, so the **PR title** must follow the same format.

## Pull requests

The [PR template](.github/PULL_REQUEST_TEMPLATE.md) includes the checklist. In short:

- [ ] `just lint` passes, and the tests for your area pass (`just test-llm`, `just test-vision`, ...)
- [ ] No data, weights or secrets are included, and configs are used for anything tunable
- [ ] For a contract change: run `just schemas` (commit `jsonschema/` + `ts/`), bump `SCHEMA_VERSION` if breaking, update the model endpoint and web route in the same PR, and get all owners to review
- [ ] For a DB change: add a new migration (never edit an applied one), enable RLS on new tables, and run `npm run db:types`
- [ ] Docs/ADR are updated if a decision changed
- [ ] For `exp/` PRs: link the W&B runs and give the result against baseline

Keep PRs small (under ~400 changed lines when possible). Only `ci-repo` is a required check. Area workflows only run
when their paths change.

## Adding a new experiment

1. **Open an issue** with the *ML experiment* template (hypothesis, setup, metric, threshold).
2. **Branch:** `git switch -c exp/llm-sft-lora-r32`
3. **Copy a config, don't edit one that has already been run:**
   ```bash
   cp ml/llm/configs/train/sft-baseline.yaml ml/llm/configs/train/sft-lora-r32.yaml
   ```
   Set a new unique `experiment.name` (`sft-lora-r32`), change only what the hypothesis needs, and update
   `output_dir` and `tracking.tags`.
4. **Validate:** `just llm-train sft ml/llm/configs/train/sft-lora-r32.yaml --dry-run` and `just test-llm`.
   If you need a new knob, add the field to `src/dermiai_llm/config.py` first.
5. **Run** on the GPU machine: `just llm-train sft ml/llm/configs/train/sft-lora-r32.yaml`.
   The run name follows `docs/experiment-tracking.md`.
6. **Version new data:** `dvc add ...`, `dvc push`, and commit the `.dvc` file.
7. **Open the PR** with the W&B links and a results table. If it beats the baseline, merge it (the config becomes the new
   reference). If not, record the result in the issue and close the PR. Negative results are still results.

The vision flow is the same, using `ml/vision/configs/` and `just vision-train`.

## Adding a dependency

```bash
uv add --package dermiai-llm "somepkg>=1.2"                 # base dep
uv add --package dermiai-llm --optional train "somepkg"     # heavy / GPU-only
```

```bash
npm install somepkg --workspace @dermiai/web                # web app (run from repo root)
```

Commit `uv.lock` / `package-lock.json`. Never add LLM/vision deps to `dermiai-schemas`. The web app never depends on
Python packages, only on the generated `@dermiai/schemas`.

## Notebooks

These are for exploration only. Number them (`01_...`). Outputs are stripped on commit. Anything reusable moves into `src/`.
