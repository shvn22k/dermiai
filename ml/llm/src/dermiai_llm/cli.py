"""Shared argument handling for the thin entry points in ml/llm/scripts/."""

import argparse
from collections.abc import Callable, Sequence
from typing import TypeVar

from pydantic import BaseModel

from dermiai_llm.config import load_config

C = TypeVar("C", bound=BaseModel)


def run_step(
    description: str,
    config_cls: type[C],
    entrypoint: Callable[[C], None],
    *,
    stages: Sequence[str] | None = None,
    argv: Sequence[str] | None = None,
) -> None:
    """Parse `--config [--stage] [--dry-run]`, validate the config, then call `entrypoint`."""
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--config", required=True, help="Path to a YAML config")
    if stages:
        parser.add_argument("--stage", required=True, choices=stages)
    parser.add_argument(
        "--dry-run", action="store_true", help="Validate and print the config, then exit"
    )
    args = parser.parse_args(argv)

    cfg = load_config(args.config, config_cls)
    if stages and getattr(cfg, "stage", None) != args.stage:
        parser.error(f"--stage {args.stage} does not match `stage:` in {args.config}")
    if args.dry_run:
        print(cfg.model_dump_json(indent=2))
        print(f"[dry-run] {args.config}: config OK")
        return
    entrypoint(cfg)
