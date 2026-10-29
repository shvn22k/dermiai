from dermiai_llm.config import BuildDatasetConfig


def run(cfg: BuildDatasetConfig) -> None:
    """Clean and chunk extracted text, then write per-stage train/eval splits."""
    raise NotImplementedError("llm build-dataset: not implemented yet")
