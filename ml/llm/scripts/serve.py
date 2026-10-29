"""just llm-serve [CONFIG]"""

from dermiai_llm.cli import run_step
from dermiai_llm.config import ServeConfig
from dermiai_llm.serve import server

if __name__ == "__main__":
    run_step("Serve the Dermi model", ServeConfig, server.run)
