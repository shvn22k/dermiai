"""just llm-eval [CONFIG]"""

from dermiai_llm.cli import run_step
from dermiai_llm.config import EvalConfig
from dermiai_llm.eval import harness

if __name__ == "__main__":
    run_step("Run the LLM eval harness", EvalConfig, harness.run)
