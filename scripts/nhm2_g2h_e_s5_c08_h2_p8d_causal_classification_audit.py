#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-terminal-capture-v1-20260829"
AUDIT = CAPTURE / "p8c-authenticated-result-audit-r17-v1.json"
RESULT = CAPTURE / "p8d-causal-classification-r17-v1.json"

audit = json.loads(AUDIT.read_text(encoding="utf-8"))
result = json.loads(RESULT.read_text(encoding="utf-8"))
checks = {
    "schema": result["schema"] == "nhm2.g2h_e_s5.c08_h2_p8d_causal_classification.v1",
    "status": result["status"] == "CLASSIFIED_RESULT_ONLY",
    "input_hash": result["input_audit_sha256"] == hashlib.sha256(AUDIT.read_bytes()).hexdigest(),
    "input_audit_pass": audit["audit_status"] == "PASS",
    "input_numerical_fail": audit["result_classification"] == "P8C_DIAGNOSTIC_NUMERICAL_FAIL",
    "classification": result["classification"] == "LOW_DEGREE_HIGH_JET_COEFFICIENT_BOUND_EXHAUSTION_WITH_NEAR_THRESHOLD_TAIL",
    "all_candidates": result["evidence"]["all_17_candidates_failed"] is True,
    "degree": result["evidence"]["first_failed_degree_counts"] == {"3": 17},
    "jets": result["evidence"]["first_failed_jet_counts"] == {"8": 3, "9": 14},
    "kind": result["evidence"]["first_failed_kind_counts"] == {"COEFFICIENT": 17},
    "best_index": result["evidence"]["best_candidate_index"] == 16,
    "best_still_fails": float(result["evidence"]["best_first_failure_ratio"]) > 1.0,
    "schedule": result["evidence"]["candidate_schedule"] == [1 << index for index in range(17)],
    "not_transport": result["excluded_interpretations"]["infrastructure_or_transport_failure"] is True,
    "not_timeout": result["excluded_interpretations"]["compute_timeout_or_partial_result"] is True,
    "next_lead_exact": "degree-3 jet-8/9" in result["next_lead"]["action"],
    "no_threshold_relaxation": "no threshold relaxation" in result["next_lead"]["forbidden_change"],
    "no_candidate_retry": "frozen-candidate evaluation" in result["next_lead"]["forbidden_change"],
    "authority_false": all(value is False for value in result["authority"].values()),
}
passed = sum(checks.values())
print(f"{passed}/{len(checks)} {'PASS' if passed == len(checks) else 'FAIL'}")
print(hashlib.sha256(RESULT.read_bytes()).hexdigest())
if passed != len(checks):
    print("failed=" + ",".join(name for name, ok in checks.items() if not ok))
    raise SystemExit(1)
