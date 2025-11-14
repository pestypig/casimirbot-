#!/usr/bin/env python3
"""
Aggregate summary.json files (from tools/run_eval.py) across different sampling scales.
"""
from __future__ import annotations

import argparse
import glob
import json
import re
from pathlib import Path
from typing import List, Tuple


def infer_k(path: Path, summary: dict) -> int:
    if "k_default" in summary:
        try:
            return int(summary["k_default"])
        except (TypeError, ValueError):
            pass
    match = re.search(r"[kK](\d+)", path.name)
    if match:
        return int(match.group(1))
    return -1


def load_rows(patterns: List[str]) -> List[Tuple[int, float, float, float, str]]:
    rows: List[Tuple[int, float, float, float, str]] = []
    for pattern in patterns:
        for file_path in glob.glob(pattern):
            path = Path(file_path)
            with path.open("r", encoding="utf-8") as handle:
                summary = json.load(handle)
            k_value = infer_k(path, summary)
            rows.append(
                (
                    k_value,
                    float(summary.get("acc_majority", 0.0)),
                    float(summary.get("acc_verifier_oracle", 0.0)),
                    float(summary.get("parse_none_rate", 0.0)),
                    str(path),
                )
            )
    rows.sort(key=lambda item: item[0])
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare scaling behavior across run_eval summaries.")
    parser.add_argument("--patterns", nargs="+", required=True, help="Glob(s) pointing to summary JSON files.")
    args = parser.parse_args()

    rows = load_rows(args.patterns)
    if not rows:
        print("No summary files matched the provided patterns.")
        return 1

    print("K\tMaj\tVG(oracle)\tparse_none\tpath")
    for k_value, maj, vg, parse_none, path in rows:
        print(f"{k_value}\t{maj:.4f}\t{vg:.4f}\t{parse_none:.4f}\t{path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
