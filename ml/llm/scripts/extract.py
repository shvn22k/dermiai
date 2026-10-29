"""just llm-extract [CONFIG]"""

from dermiai_llm.cli import run_step
from dermiai_llm.config import ExtractConfig
from dermiai_llm.data import extract

if __name__ == "__main__":
    run_step("Extract text from raw sources", ExtractConfig, extract.run)
