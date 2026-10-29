"""Experiment tracking conventions (see docs/experiment-tracking.md).

W&B is initialised lazily in the training/eval entrypoints, so base installs don't need wandb.
"""

import subprocess
from datetime import UTC, datetime


def git_short_sha() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--short=7", "HEAD"],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return "nogit"
    return out.stdout.strip()


def make_run_name(area: str, step: str, experiment: str, *, sha: str | None = None) -> str:
    """`{area}-{step}-{experiment}-{yyyymmdd}-{sha7}`, e.g. `llm-sft-persona-v2-20261029-a1b2c3d`."""
    date = datetime.now(UTC).strftime("%Y%m%d")
    return f"{area}-{step}-{experiment}-{date}-{sha or git_short_sha()}"
