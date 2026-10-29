"""DermiAI LLM pipeline.

    data/     raw source -> text extraction -> cleaning -> chunking -> stage datasets
    persona/  persona style extraction + synthetic dialogue generation
    train/    stage 1 continued pretraining (cpt), stage 2 SFT, stage 3 DPO
    eval/     eval harness, rubrics, LLM-as-judge
    serve/    inference wrapper for deployment

Every step reads a YAML config validated by `dermiai_llm.config`. Nothing tunable lives in code.
"""
