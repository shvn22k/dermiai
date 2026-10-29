from dermiai_vision.config import VisionTrainConfig


def run(cfg: VisionTrainConfig) -> None:
    """Evaluate a trained classifier: accuracy, per-class / per-skin-tone metrics, calibration."""
    raise NotImplementedError("vision eval: not implemented yet")
