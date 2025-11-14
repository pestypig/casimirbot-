#!/usr/bin/env python3
"""
Convert SymPy verifier logs into DPO-style preference pairs.

Input JSONL lines should include:
{
  "trace_id": "...",
  "prompt": "...",
  "candidate": "...",        # usually solver_output.summary
  "ground_truth": "...",
  "ok": true|false
}
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple


def load_records(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def build_pairs(records):
    grouped: Dict[Tuple[str, str], Dict[str, List[dict]]] = {}
    for record in records:
        prompt = (record.get("prompt") or "").strip()
        ground_truth = (record.get("ground_truth") or "").strip()
        candidate = (record.get("candidate") or record.get("solver_output") or "").strip()
        if not prompt or not ground_truth or not candidate:
            continue
        key = (prompt, ground_truth)
        grouped.setdefault(key, {"pass": [], "fail": []})
        bucket = "pass" if record.get("ok") else "fail"
        grouped[key][bucket].append({"candidate": candidate, "trace_id": record.get("trace_id")})
    for (prompt, _truth), buckets in grouped.items():
        if not buckets["pass"] or not buckets["fail"]:
            continue
        for good in buckets["pass"]:
            for bad in buckets["fail"]:
                yield {
                    "prompt": prompt,
                    "chosen": good["candidate"],
                    "rejected": bad["candidate"],
                    "meta": {
                        "trace_id_pass": good["trace_id"],
                        "trace_id_fail": bad["trace_id"],
                        "verifier": "math.sympy.verify",
                    },
                }


def main():
    parser = argparse.ArgumentParser(description="Build DPO preference pairs from SymPy verifier logs.")
    parser.add_argument("--input", required=True, help="Path to JSONL log file.")
    parser.add_argument("--output", required=True, help="Destination JSONL for prompt/chosen/rejected entries.")
    args = parser.parse_args()

    src = Path(args.input)
    dst = Path(args.output)
    dst.parent.mkdir(parents=True, exist_ok=True)

    records = load_records(src)
    total = 0
    with dst.open("w", encoding="utf-8") as handle:
        for pair in build_pairs(records):
            handle.write(json.dumps(pair, ensure_ascii=False) + "\n")
            total += 1
    print(f"wrote {total} pairs to {dst}")


if __name__ == "__main__":
    main()
