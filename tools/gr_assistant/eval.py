from __future__ import annotations

import argparse
import json
from collections import Counter
from typing import Any, Dict, List

from .orchestrator import Orchestrator


def load_dataset(path: str) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))
    return records


def evaluate_entry(entry: Dict[str, Any], base_url: str) -> Dict[str, Any]:
    orchestrator = Orchestrator(base_url)
    metric = entry["metric_spec"]
    dag = orchestrator.run_metric_pipeline(metric)
    expected = entry.get("expected_checks", [])
    expected_map = {item["check_name"]: item["passed"] for item in expected}
    results = {check["check_name"]: check.get("passed") for check in dag.checks}
    failures = []
    for check_name, expected_pass in expected_map.items():
        actual_pass = results.get(check_name)
        if actual_pass is None:
            failures.append({"check": check_name, "reason": "missing"})
        elif bool(actual_pass) != bool(expected_pass):
            failures.append({"check": check_name, "reason": "mismatch"})
    return {
        "id": entry.get("id"),
        "prompt": entry.get("prompt"),
        "passed": len(failures) == 0,
        "failures": failures,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate GR assistant dataset.")
    parser.add_argument("--dataset", required=True, help="Path to JSONL dataset.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--limit", type=int, default=0, help="Limit entries.")
    parser.add_argument("--out", default="-", help="Output JSON summary path.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    records = load_dataset(args.dataset)
    if args.limit > 0:
        records = records[: args.limit]
    results = []
    failures = Counter()
    for entry in records:
        result = evaluate_entry(entry, args.base_url)
        results.append(result)
        if not result["passed"]:
            failures.update({f["check"]: 1 for f in result["failures"]})
    summary = {
        "total": len(results),
        "passed": sum(1 for r in results if r["passed"]),
        "failed": sum(1 for r in results if not r["passed"]),
        "failure_reasons": dict(failures),
    }
    output = json.dumps({"summary": summary, "results": results}, indent=2)
    if args.out in ("-", "", None):
        print(output)
    else:
        with open(args.out, "w", encoding="utf-8") as handle:
            handle.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
