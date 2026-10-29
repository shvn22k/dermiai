# data/

Git ignores everything here except READMEs, `.gitkeep` and DVC pointer files (`*.dvc`).
Contents are versioned with **DVC**, with the remote at `gs://dermiai-data`.
A pre-commit hook also blocks data files, so `git add -f` won't slip through.

| Folder | Contains | Who writes it | Mutable? |
|---|---|---|---|
| `raw/` | Original sources exactly as obtained: dermatology book, film script, image datasets | Humans (download/copy) | **Never edit.** Add new versions only |
| `interim/` | Intermediate outputs: extracted text, cleaned text, resized images | Pipeline scripts | Regenerable |
| `processed/` | Final model-ready datasets (JSONL splits, image manifests) | Pipeline scripts | Regenerable, versioned by name (`dataset-v1`) |

Suggested layout: `raw/llm/derm_book/`, `raw/llm/film_script/`, `raw/vision/<dataset>/`, and the same under `interim/` and `processed/`.

## Workflow

```bash
# first time (after GCP access is granted)
gcloud auth application-default login
dvc pull                                   # fetch everything tracked

# add / update a dataset
dvc add data/raw/llm/derm_book             # creates data/raw/llm/derm_book.dvc
git add data/raw/llm/derm_book.dvc data/raw/llm/.gitignore
dvc push
git commit -m "data(llm): add dermatology book v1"
```

Every source must have an entry in [`docs/data-sources.md`](../docs/data-sources.md) (license, usage restrictions, location) **before** it is added.

**Copyrighted texts** (the dermatology book, the film script) are for private research/training use under the terms
recorded in `docs/data-sources.md`. Don't redistribute them, don't paste them into issues, notebooks or prompts in
public places, and don't commit them. **User-uploaded skin images** are health data. They never go into this folder or into DVC.
