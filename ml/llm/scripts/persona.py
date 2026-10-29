"""just llm-persona [CONFIG]"""

from dermiai_llm.cli import run_step
from dermiai_llm.config import PersonaConfig
from dermiai_llm.persona import generate

if __name__ == "__main__":
    run_step(
        "Persona style extraction + synthetic dialogue generation", PersonaConfig, generate.run
    )
