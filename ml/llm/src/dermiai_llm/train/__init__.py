"""Three-stage training, each stage producing a LoRA adapter consumed by the next.

cpt.py   stage 1: continued pretraining on dermatology text (domain adaptation)
sft.py   stage 2: supervised fine-tuning on persona dialogues
dpo.py   stage 3: preference optimisation (safety, persona consistency)
"""

from collections.abc import Callable

from dermiai_llm.config import Stage, TrainConfig
from dermiai_llm.train import cpt, dpo, sft

STAGES: dict[Stage, Callable[[TrainConfig], None]] = {
    "cpt": cpt.run,
    "sft": sft.run,
    "dpo": dpo.run,
}


def run(cfg: TrainConfig) -> None:
    STAGES[cfg.stage](cfg)
