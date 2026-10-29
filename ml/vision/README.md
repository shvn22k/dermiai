# dermiai-vision

Owner: `@palakbansal05` (see `.github/CODEOWNERS`)

CNN skin-condition classifier. Its inference output **must** be `dermiai_schemas.CNNOutput`:

```json
{"top_k": [{"condition": "eczema", "confidence": 0.71}], "image_quality": "good", "model_version": "vision-..."}
```

```bash
just setup-vision                    # light env: configs + tests, no torch
just setup-vision --extra train      # + torch/torchvision/timm
just vision-train ml/vision/configs/baseline.yaml --dry-run
just test-vision
just vision-serve ml/vision/configs/serve.yaml --dry-run
```

**Serving:** `src/dermiai_vision/serve/` becomes an SSE endpoint on Cloud Run (`infra/docker/vision-serve.Dockerfile`).
It receives a `VisionRequest` (a short-lived signed image URL from the web app) and streams `VisionStreamEvent`s.

You never need the LLM or web dependencies. `uv sync --package dermiai-vision` installs only this area and `dermiai-schemas`.

The internal layout (`src/dermiai_vision/{data,models,train,eval}`) is a suggestion. The owner can restructure
anything inside `ml/vision/` as long as `CNNOutput` stays the output contract and configs stay in YAML.

Things to plan for: patient-level splits (no leakage), per-Fitzpatrick-skin-type metrics, calibrated confidences
(the LLM reads them), and an `image_quality` signal.
