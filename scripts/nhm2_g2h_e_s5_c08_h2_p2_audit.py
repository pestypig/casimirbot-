#!/usr/bin/env python3
"""Independent evidence audit for the candidate-neutral H2-P2 receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
from typing import Any


EXPECTED_BASELINE = "0afc791ec06d1d9870f77b4a0cc95460a3d0dca61a103e47a106e9415c2b2b73"
AUTHORITY_FALSE = {
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "scientific_handler_linked": False,
    "authority_promoted": False,
}


def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load(path: pathlib.Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"),
                       object_pairs_hook=unique_object)
    if not isinstance(value, dict):
        raise ValueError(f"{path.name} is not an object")
    return value


def records(path: pathlib.Path) -> list[dict[str, Any]]:
    values: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        value = json.loads(line, object_pairs_hook=unique_object)
        if not isinstance(value, dict):
            raise ValueError(f"{path.name} contains a non-object")
        values.append(value)
    return values


def authority_false(value: dict[str, Any]) -> bool:
    return all(value.get(key) == expected for key, expected in AUTHORITY_FALSE.items())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence-root", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    root = args.evidence_root.resolve()
    output = args.output.resolve()
    if output.exists():
        parser.error("exclusive audit output already exists")

    receipt = load(root / "receipt.json")
    identities = load(root / "identities.json")
    manufactured = load(root / "manufactured.stdout.json")
    order128 = load(root / "order128.stdout.json")
    equivalence = load(root / "calibration-equivalence.json")
    exp2 = records(root / "prepared-exp2.stdout.ndjson")

    inventory_ok = True
    inventory_count = 0
    for line in (root / "evidence.sha256").read_text(encoding="utf-8").splitlines():
        expected, name = line.split("  ", 1)
        path = root / name
        inventory_ok = inventory_ok and path.is_file() \
            and hashlib.sha256(path.read_bytes()).hexdigest() == expected
        inventory_count += 1

    progress = [value for value in exp2 if value.get("status") == "PROGRESS"]
    complete = [value for value in exp2
                if value.get("status") == "CALIBRATION_COMPLETE"]
    checks = {
        "receipt_pass": receipt.get("status") == "PASS",
        "receipt_authority_false": authority_false(receipt),
        "manufactured_8_of_8": manufactured.get("status") == "PASS"
            and manufactured.get("checks_passed") == 8
            and manufactured.get("checks_total") == 8,
        "manufactured_authority_false": authority_false(manufactured),
        "order128_pass": order128.get("status") == "PASS",
        "order128_arb_equal": order128.get("arb_equal_all_outputs") is True,
        "order128_results_equal": order128.get("results_equal") is True,
        "order128_43_convolutions": order128.get("elementary_convolutions") == 43,
        "order128_authority_false": authority_false(order128),
        "calibration_equivalence_pass": equivalence.get("status") == "PASS",
        "calibration_semantic_hash_equal":
            equivalence.get("baseline_semantic_sha256")
            == equivalence.get("profile_semantic_sha256"),
        "prepared_schedule": [value.get("cumulative_subpanels")
                              for value in progress] == [1, 3, 7],
        "prepared_convolutions": [value.get("cumulative_elementary_convolutions")
                                  for value in progress] == [43, 129, 301],
        "prepared_complete": len(complete) == 1
            and complete[0].get("cumulative_subpanels") == 7
            and complete[0].get("cumulative_elementary_convolutions") == 301,
        "prepared_authority_false": bool(exp2)
            and all(authority_false(value) for value in exp2),
        "performance_target_met": receipt.get("performance_target_met") is True
            and float(receipt.get("measured_speedup", 0.0)) >= 4.0,
        "baseline_identity": identities.get("baseline", {}).get(
            "executable_sha256") == EXPECTED_BASELINE,
        "identity_inventory": all(
            len(value.get("image_id", "")) > 7
            and len(value.get("executable_sha256", "")) == 64
            for value in identities.values()),
        "evidence_inventory": inventory_ok and inventory_count >= 15,
    }
    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p2_prepared_moment_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        **AUTHORITY_FALSE,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, sort_keys=True, separators=(",", ":")) + "\n",
                      encoding="utf-8", newline="\n")
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
