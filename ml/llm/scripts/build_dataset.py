"""just llm-build-dataset [CONFIG]"""

from dermiai_llm.cli import run_step
from dermiai_llm.config import BuildDatasetConfig
from dermiai_llm.data import build

if __name__ == "__main__":
    run_step("Clean, chunk and build stage datasets", BuildDatasetConfig, build.run)
