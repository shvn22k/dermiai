# dermiai-llm

Owner: `@shvn22k` (see `.github/CODEOWNERS`)

The pipeline that turns a general LLM into **Dermi**: domain-adapted on dermatology text, then
persona-tuned.

```
data/raw ──extract──▶ data/interim ──build_dataset──▶ data/processed ──▶ cpt ──▶ sft ──▶ dpo ──▶ eval ──▶ serve
                         film script ──persona──▶ dialogues / pairs ──┘
```

| Step | Code | Config | Command |
|---|---|---|---|
| Extract | `src/dermiai_llm/data/extract.py` | `configs/data/extract.yaml` | `just llm-extract` |
| Build datasets | `src/dermiai_llm/data/build.py` | `configs/data/build_dataset.yaml` | `just llm-build-dataset` |
| Persona data | `src/dermiai_llm/persona/generate.py` | `configs/persona/generate.yaml` | `just llm-persona` |
| Train (stage 1-3) | `src/dermiai_llm/train/{cpt,sft,dpo}.py` | `configs/train/*.yaml` | `just llm-train sft configs/...` |
| Eval | `src/dermiai_llm/eval/harness.py` | `configs/eval/*.yaml` | `just llm-eval` |
| Serve | `src/dermiai_llm/serve/server.py` | `configs/serve.yaml` | `just llm-serve` |

Every command accepts `--dry-run`, which validates the config and prints it. Example:
`just llm-train sft ml/llm/configs/train/sft-baseline.yaml --dry-run`.

## Environments

Heavy dependencies are split into extras, so you only install what the current step needs:

```bash
just setup-llm                          # config validation, tests (fast, no torch)
just setup-llm --extra data             # PDF extraction
just setup-llm --extra train            # GPU training (torch, transformers, peft, trl)
```

## Rules

- **No hyperparameters, paths or model IDs in code.** Add a field to `config.py`, then set it in YAML.
  Unknown YAML keys are rejected.
- Configs are immutable once a run has been logged. To change a config, copy it under a new `experiment.name`.
- `tests/test_configs.py` validates every config in CI.
