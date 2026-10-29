"""just vision-eval [CONFIG] [--dry-run]"""

import argparse

from dermiai_vision import eval as vision_eval
from dermiai_vision.config import VisionTrainConfig, load_config

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate the CNN classifier")
    parser.add_argument("--config", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    cfg = load_config(args.config, VisionTrainConfig)
    if args.dry_run:
        print(f"[dry-run] {args.config}: config OK")
    else:
        vision_eval.run(cfg)
