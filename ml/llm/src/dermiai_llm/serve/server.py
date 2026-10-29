from dermiai_llm.config import ServeConfig


def run(cfg: ServeConfig) -> None:
    """Load base model + adapter and serve DermiRequest -> DermiResponse."""
    raise NotImplementedError("llm serve: not implemented yet")
