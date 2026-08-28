#!/usr/bin/env python3
"""Candidate-neutral H2-P5 runtime/turnaround decision audit."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
P4 = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-scaling-v1-20260827"
RECEIPT = P4 / "receipt.json"
AUDIT = P4 / "independent-audit.json"
RAW_16_B = P4 / "nhm2-h2-p4-evidence-v1-20260827/calibration-threads-16-b.ndjson"
SELECTOR = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_selector_v1.cpp"
HEADER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_selector_v1.hpp"
COST_MODEL = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_cost_model.py"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    records = [json.loads(line) for line in RAW_16_B.read_text(encoding="utf-8").splitlines()]
    selector = SELECTOR.read_text(encoding="utf-8")
    header = HEADER.read_text(encoding="utf-8")
    cost_model = COST_MODEL.read_text(encoding="utf-8")

    progress = [record for record in records if record["status"] == "PROGRESS"]
    complete = records[-1]
    largest_calibrated_candidate = max(record["u_panels"] for record in progress)
    cumulative_calibrated_subpanels = complete["cumulative_subpanels"]
    maximum_tested_threads = max(receipt["tested_threads"])
    full_selector_subpanels = sum(1 << exponent for exponent in range(17))
    best_ms = min(receipt["candidate_milliseconds"][key] for key in ("16-a", "16-b"))
    seconds_per_subpanel = best_ms / 1000.0 / cumulative_calibrated_subpanels
    one_selector_hours = seconds_per_subpanel * full_selector_subpanels / 3600.0
    two_selector_hours = 2.0 * one_selector_hours

    checks = {
        "p4_receipt_pass": receipt["verdict"] == "PASS",
        "p4_audit_40_of_40": audit["verdict"] == "PASS" and audit["checks_passed"] == audit["checks_total"] == 40,
        "p4_semantics_equal": receipt["all_thread_semantics_equal"] is True,
        "p4_candidate_neutral": receipt["candidate_evaluations"] == 0 and receipt["positive_parameter_samples"] == 0,
        "p4_authority_false": receipt["authority_promoted"] is False and receipt["scientific_handler_linked"] is False,
        "calibration_exactly_exponent_2": [record["exponent"] for record in progress] == [0, 1, 2],
        "calibration_seven_subpanels": cumulative_calibrated_subpanels == 7,
        "largest_candidate_four": largest_calibrated_candidate == 4,
        "threads_exceed_calibrated_parallel_width": maximum_tested_threads == 16 and largest_calibrated_candidate < maximum_tested_threads,
        "parallelism_is_outer_subpanel_only": "H2-P3 owns only the explicit outer" in selector and "accumulate_candidate_parallel" in selector,
        "refinement_candidates_remain_sequential": "Refinement candidates remain sequential" in header,
        "candidate_only_calibration_surface_exists": "evaluate_prepared_candidate" in header and "evaluate_prepared_candidate" in selector,
        "full_selector_is_131071_subpanels": full_selector_subpanels == 131071 and "range(17)" in cost_model,
        "two_selector_projection_exceeds_24h": two_selector_hours > 24.0,
        "p4_receipt_hash": sha256(RECEIPT) == "425640f07ef23abf503829b222fe7ece8854ea7677520d85f663b2f5891671a4",
        "p4_audit_hash": sha256(AUDIT) == "4cb7ffc8e04c29eea26654fbb0cc115672e85b7f2b2cd7a7acf50dea871afe3d",
        "selector_source_hash": sha256(SELECTOR) == "060d8b1147746de24258dd47837f95887e836ef932e36fb4c0c3909d08bcfbfa",
        "selector_header_hash": sha256(HEADER) == "003baafdddc58646098b4e196389fd2f49e89bb4e3f8194c953ceeb512a32a96",
        "cost_model_hash": sha256(COST_MODEL) == "9d7aa36c41d4e8f6fe15b6f7402bac60aa89822b479f8ad9594fd1e680d37c30",
    }
    passed = sum(checks.values())
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p5_runtime_decision_audit.v1",
        "verdict": "PASS" if passed == len(checks) else "FAIL",
        "decision": "ASYMPTOTIC_PARALLEL_WIDTH_EVIDENCE_REQUIRED_BEFORE_RUNTIME_BINDING",
        "classification": "BLOCKED_NOT_SCIENTIFIC_FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "measured": {
            "calibration_maximum_exponent": 2,
            "calibration_cumulative_subpanels": cumulative_calibrated_subpanels,
            "largest_parallel_candidate": largest_calibrated_candidate,
            "maximum_tested_threads": maximum_tested_threads,
            "best_16_thread_candidate_milliseconds": best_ms,
        },
        "linear_forecast_only": {
            "seconds_per_subpanel": seconds_per_subpanel,
            "one_selector_hours": one_selector_hours,
            "two_selector_hours": two_selector_hours,
            "forecast_is_runtime_binding": False,
        },
        "next_packet": {
            "name": "H2-P5A",
            "purpose": "candidate-neutral representative-width scaling calibration",
            "named_candidate_panels": 1024,
            "threads": [1, 4, 8, 16, 16],
            "full_selector_execution": False,
            "candidate_evaluation": False,
        },
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
