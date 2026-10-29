from dermiai_llm.config import EvalConfig


def run(cfg: EvalConfig) -> None:
    """Generate on each eval set, score with metrics + judge rubrics, log to tracking."""
    raise NotImplementedError("llm eval: not implemented yet")
