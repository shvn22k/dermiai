from dermiai_llm.config import ExtractConfig


def run(cfg: ExtractConfig) -> None:
    """Extract raw text from each source in `cfg.sources` into `cfg.output_dir`."""
    raise NotImplementedError("llm extract: not implemented yet")
