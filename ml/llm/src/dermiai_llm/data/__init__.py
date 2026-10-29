"""Data pipeline: raw sources -> clean text -> chunks -> stage datasets.

Planned modules:
    extract.py   PDF (book) / screenplay text extraction        data/raw     -> data/interim
    clean.py     de-hyphenation, header/footer removal, unicode fixes
    chunk.py     token-aware chunking with overlap
    build.py     CPT corpus, SFT chat, DPO preference datasets   data/interim -> data/processed
"""
