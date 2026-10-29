"""DermiAI CNN skin-condition classifier.

    data/     dataset loading, splits, augmentation
    models/   backbones + classification heads
    train/    training loop
    eval/     metrics (incl. per-skin-tone breakdown), calibration, error analysis
    serve/    SSE inference endpoint (Cloud Run)

Inference output MUST be `dermiai_schemas.CNNOutput`. That contract is shared with the web app and the LLM.
"""
