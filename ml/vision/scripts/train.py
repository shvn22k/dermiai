"""just vision-train [CONFIG] [--dry-run]"""

import argparse

from dermiai_vision import train
from dermiai_vision.config import VisionTrainConfig, load_config

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the CNN classifier")
    parser.add_argument("--config", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    cfg = load_config(args.config, VisionTrainConfig)
    if args.dry_run:
        print(cfg.model_dump_json(indent=2))
        print(f"[dry-run] {args.config}: config OK")
    else:
        train.run(cfg)
