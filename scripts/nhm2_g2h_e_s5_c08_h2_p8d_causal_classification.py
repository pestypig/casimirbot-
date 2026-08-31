#!/usr/bin/env python3
"""Result-only causal classification for the authenticated P8C diagnostic."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path


def decimal_prefix(text: str) -> Decimal:
    match = re.search(r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?", text)
    if not match:
        raise ValueError(text)
    return Decimal(match.group(0))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    audit_path = args.audit.resolve()
    output = args.output.resolve()
    assert audit_path.is_file() and not output.exists()
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    assert audit["audit_status"] == "PASS"
    assert audit["result_classification"] == "P8C_DIAGNOSTIC_NUMERICAL_FAIL"
    assert audit["diagnostic_h2_pass"] is False
    assert audit["frozen_candidate_evaluated"] is False
    assert all(value is False for value in audit["authority"].values())

    record = audit["terminal_record"]
    diagnostic = record["diagnostic"]
    observations = diagnostic["observations"]
    assert len(observations) == 17
    assert [item["candidate_index"] for item in observations] == list(range(17))
    assert [item["panel_count"] for item in observations] == [1 << index for index in range(17)]
    assert all(item["passed"] is False for item in observations)
    assert all(item["first_failed_kind"] == "COEFFICIENT" for item in observations)
    assert all(item["first_failed_degree"] == 3 for item in observations)

    first_ratios = [decimal_prefix(item["first_failed_ratio"]) for item in observations]
    first_jets = Counter(item["first_failed_jet"] for item in observations)
    best_index = min(range(len(first_ratios)), key=first_ratios.__getitem__)
    best_ratio = first_ratios[best_index]
    assert best_ratio > 1
    assert first_jets == Counter({9: 14, 8: 3})
    assert diagnostic["fixed_candidate_schedule"] is True
    assert diagnostic["thresholds_unchanged"] is True
    assert diagnostic["reduction_order_unchanged"] is True
    assert diagnostic["observation_only"] is True

    payload = {
        "authority": {name: False for name in audit["authority"]},
        "classification": "LOW_DEGREE_HIGH_JET_COEFFICIENT_BOUND_EXHAUSTION_WITH_NEAR_THRESHOLD_TAIL",
        "evidence": {
            "all_17_candidates_failed": True,
            "best_candidate_index": best_index,
            "best_first_failure_excess_fraction": str(best_ratio - 1),
            "best_first_failure_ratio": str(best_ratio),
            "candidate_schedule": [item["panel_count"] for item in observations],
            "first_failed_degree_counts": {"3": 17},
            "first_failed_jet_counts": {str(key): value for key, value in sorted(first_jets.items())},
            "first_failed_kind_counts": {"COEFFICIENT": 17},
            "maximum_first_failure_ratio": str(max(first_ratios)),
            "minimum_first_failure_ratio": str(min(first_ratios)),
        },
        "excluded_interpretations": {
            "compute_timeout_or_partial_result": True,
            "failure_only_at_high_polynomial_degree": True,
            "insufficient_candidate_schedule_coverage": True,
            "infrastructure_or_transport_failure": True,
            "successful_h2_extension": True,
        },
        "input_audit_sha256": sha256(audit_path),
        "next_lead": {
            "action": "candidate-neutral exact decomposition audit of the degree-3 jet-8/9 coefficient radius and threshold construction",
            "allowed_change": "instrument and independently replay constituent bound terms on manufactured and persisted P8C observations",
            "decision_after_audit": "distinguish genuine analytic-bound insufficiency from implementation scaling or aggregation defect before proposing any selector change",
            "forbidden_change": "no threshold relaxation, schedule extension, candidate retune, numerical retry, or frozen-candidate evaluation",
        },
        "schema": "nhm2.g2h_e_s5.c08_h2_p8d_causal_classification.v1",
        "status": "CLASSIFIED_RESULT_ONLY",
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print("P8D_CAUSAL_CLASSIFICATION_PASS")
    print(payload["classification"])
    print(sha256(output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
