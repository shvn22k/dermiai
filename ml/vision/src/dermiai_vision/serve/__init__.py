"""Inference endpoint, deployed on GCP (Cloud Run).

Contract (dermiai_schemas): POST a `VisionRequest` JSON body (a signed Supabase Storage URL),
and get back a Server-Sent Events stream of `VisionStreamEvent`: zero or more `status`, then one
`result` (CNNOutput) or `error`. The endpoint downloads the image itself, enforces
`max_image_bytes`, and rejects requests without the expected auth header.
"""

from dermiai_vision.config import VisionServeConfig


def run(cfg: VisionServeConfig) -> None:
    """Load the model from `cfg.model_path` and serve on `cfg.host:cfg.port`."""
    raise NotImplementedError("vision serve: not implemented yet")
