# Model card: <model name> (<version>)

Copy to `docs/model-cards/<area>-<model>.md`. Format based on Mitchell et al., "Model Cards for Model Reporting".

## Model details

- **Owner:**
- **Version / artifact ref:** (W&B artifact, GCS path)
- **Type:** CNN classifier / causal LM + LoRA (CPT → SFT → DPO)
- **Base model / backbone and its licence:**
- **Training config(s):** `ml/.../configs/....yaml` @ git sha
- **Date:**

## Intended use

- **Primary use:** decision support and education inside DermiAI. **Not a medical device. Not a diagnosis.**
- **Users:**
- **Out-of-scope uses:**

## Training data

- Sources (IDs from `docs/data-sources.md`) and DVC version:
- Synthetic data share and the generator used:
- Known gaps (e.g. skin-tone distribution, conditions underrepresented):

## Evaluation

| Eval set | Metric | Value | Baseline |
|---|---|---|---|
| | | | |

- **Disaggregated results** (vision: per Fitzpatrick type, per condition. LLM: per rubric):
- **W&B runs:** links

## Safety, ethics and limitations

- Failure modes observed:
- Escalation / refusal behaviour (LLM):
- Calibration (vision):
- Bias analysis:

## How to use

```python
# loading / calling snippet, or the serving endpoint + contract (dermiai_schemas.<Model>)
```
