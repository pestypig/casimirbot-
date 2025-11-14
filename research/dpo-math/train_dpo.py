#!/usr/bin/env python3
"""
Minimal DPO training scaffold.

This script intentionally does not import heavyweight ML stacks. Instead, it
validates inputs and prints a ready-to-run TRL command so you can launch the
actual training job in whichever environment has GPUs available.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def sample_record(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                continue
    return None


def main():
    parser = argparse.ArgumentParser(description="Prepare a DPO training command for math preference data.")
    parser.add_argument("--model", required=True, help="Base HF model id, e.g. meta-llama/Llama-3-8b-instruct")
    parser.add_argument("--data", required=True, help="JSONL file produced by build_pairs.py")
    parser.add_argument("--out", required=True, help="Output directory for checkpoints")
    parser.add_argument("--batch", type=int, default=64, help="Global batch size")
    parser.add_argument("--epochs", type=int, default=1, help="Epochs over the preference data")
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise SystemExit(f"data file not found: {data_path}")
    out_path = Path(args.out)
    out_path.mkdir(parents=True, exist_ok=True)

    example = sample_record(data_path)
    if not example:
        raise SystemExit("no valid JSONL rows found in data file")

    print("✅ DPO scaffold ready.")
    print(f" • Model: {args.model}")
    print(f" • Data:  {data_path} ({data_path.stat().st_size} bytes)")
    print(f" • Out:   {out_path}")
    print(f" • Batch: {args.batch}")
    print(f" • Epochs:{args.epochs}")
    print("\nSuggested TRL command:\n")
    print(
        "python -m trl.trainer.dpo_trainer \\"
        f"\n  --model_name {args.model} \\"
        f"\n  --train_file {data_path} \\"
        f"\n  --output_dir {out_path} \\"
        f"\n  --per_device_train_batch_size {max(1, args.batch // 8)} \\"
        f"\n  --num_train_epochs {args.epochs} \\"
        "\n  --dataset_text_field prompt"
        "\n  --dataset_chosen_field chosen"
        "\n  --dataset_rejected_field rejected"
    )

    print("\nExample JSONL row:")
    print(json.dumps(example, indent=2))


if __name__ == "__main__":
    main()
