"""just llm-train STAGE CONFIG   (STAGE: cpt | sft | dpo)"""

from dermiai_llm import train
from dermiai_llm.cli import run_step
from dermiai_llm.config import TrainConfig

if __name__ == "__main__":
    run_step("Train one LLM stage", TrainConfig, train.run, stages=list(train.STAGES))
