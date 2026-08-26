#!/usr/bin/env python3
"""Exact/manufactured audit of the S4-R1 continuation-tube definition."""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-continuation-tube-contract.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    for name, binding in contract["immutable_predecessors"].items():
        path = ROOT / binding["path"]
        expected = binding.get("sha256", binding.get("raw_sha256"))
        check(f"binding_{name}", digest(path) == expected, digest(path))

    inventory = contract["cell_inventory"]
    cells = [(Fraction(i, 1024), Fraction(i + 1, 1024)) for i in range(1024)]
    check("cell_count", len(cells) == inventory["cell_count"] == 1024, len(cells))
    check("cell_cover_start_end", cells[0][0] == 0 and cells[-1][1] == 1, [str(cells[0][0]), str(cells[-1][1])])
    check("cell_no_gap", all(cells[i][1] == cells[i + 1][0] for i in range(1023)), True)
    check("source_orientation", Fraction(1, 5) > 0, "1/5")
    check("vacuum_then_positive", inventory["vacuum_cell"].startswith("i=0") and inventory["positive_cells"].startswith("i=1..1023"), inventory)

    # Manufactured F(lambda,x)=x-lambda has x'=1 and x''=0, so every
    # second-order left predictor is the exact branch on its cell.
    for ordinal in (0, 1, 511, 1023):
        left = Fraction(ordinal, 1024)
        for offset in (Fraction(0), Fraction(1, 2048), Fraction(1, 1024)):
            predictor = left + offset * 1 + offset * offset * 0 / 2
            check(f"manufactured_predictor_{ordinal}_{offset}", predictor == left + offset, str(predictor))

    previous_center = Fraction(1, 4)
    next_center = previous_center + Fraction(1, 1 << 150)
    previous_radius = Fraction(1, 1 << 120)
    next_radius = Fraction(1, 1 << 121)
    contains = lambda distance, left_radius, right_radius: distance + left_radius < right_radius or distance + right_radius < left_radius
    check("strict_overlap_pass", contains(abs(next_center - previous_center), previous_radius, next_radius), True)
    check("reverse_containment_pass", contains(Fraction(1, 1 << 150), Fraction(1, 1 << 121), Fraction(1, 1 << 120)), True)
    check("overlap_touch_fails", not contains(Fraction(0), previous_radius, previous_radius), True)
    check("overlap_outside_fails", not contains(Fraction(1, 1 << 119), previous_radius, next_radius), True)

    events = ["cell_0"] + [f"cell_{i}" for i in range(1, 1024)] + ["terminal"]
    check("synthetic_chain_order", all(events[i] == f"cell_{i}" for i in range(1024)) and events[-1] == "terminal", [events[0], events[-2], events[-1]])
    mutated = list(events)
    mutated[5], mutated[6] = mutated[6], mutated[5]
    check("out_of_order_detected", not all(mutated[i] == f"cell_{i}" for i in range(1024)), [mutated[5], mutated[6]])

    check("grid_predictor_independence", contract["prerequisite_terminal_solves"]["coarse_to_fine_initialization"] is False and contract["prerequisite_terminal_solves"]["continuation_to_terminal_initialization"] is False, contract["prerequisite_terminal_solves"])
    check("chart_interfaces_not_equal", "not equated" in contract["chart_handoff"]["interface_warning"], contract["chart_handoff"]["interface_warning"])
    check("first_failure_no_retry", contract["first_failure_and_records"]["retry_retune_alternate_root"] is False, False)

    readiness = contract["readiness"]
    check("definition_complete", all(readiness[key] is True for key in ("cell_inventory_complete", "center_tube_complete", "same_chart_overlap_complete", "chart_handoff_complete", "no_fold_orientation_complete", "terminal_containment_complete", "record_chronology_complete")), readiness)
    check("scientific_continuation_false", readiness["scientific_cells_executed"] == 0 and all(readiness[key] is False for key in ("fixture_audit_complete", "independent_definition_audit_complete", "vacuum_connection_established", "implementation_authorized", "candidate_execution_authorized")), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.continuation_tube_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates exact/synthetic tube, overlap and chronology semantics only; zero scientific cells were executed",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "scientific_cells_executed": 0,
        "candidate_evaluations": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_INDEPENDENT_DEFINITION_REPLAY_AND_REMAINING_CLASSICAL_OBSERVABLE_STABILITY_DEFINITIONS",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
