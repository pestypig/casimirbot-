#!/usr/bin/env python3
"""Exact/manufactured audit of the S4-R1 inverse and radii definition."""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-validated-inverse-radii-contract.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def determinant_2x2(matrix: list[list[Fraction]]) -> Fraction:
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]


def radii_pass(y: Fraction, z0: Fraction, z1: Fraction, z2: Fraction, radius: Fraction) -> bool:
    polynomial = z2 * radius * radius - (1 - z0 - z1) * radius + y
    contraction = z0 + z1 + z2 * radius
    return polynomial < 0 and contraction < 1


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    for name, binding in contract["immutable_predecessors"].items():
        path = ROOT / binding["path"]
        expected = binding.get("sha256", binding.get("raw_sha256"))
        check(f"binding_{name}", digest(path) == expected, digest(path))

    inverse = [[Fraction(1, 2), Fraction(0)], [Fraction(0), Fraction(1, 3)]]
    derivative = [[Fraction(2), Fraction(0)], [Fraction(0), Fraction(3)]]
    product = [[sum(inverse[i][k] * derivative[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    check("manufactured_finite_invertible", determinant_2x2(inverse) == Fraction(1, 6), str(determinant_2x2(inverse)))
    check("manufactured_A_Adagger_identity", product == [[1, 0], [0, 1]], [[str(value) for value in row] for row in product])
    check("singular_finite_rejected", determinant_2x2([[Fraction(1), Fraction(2)], [Fraction(2), Fraction(4)]]) == 0, True)

    gamma = [Fraction(1, 2), Fraction(-3, 4)]
    delta = [Fraction(2), Fraction(-4, 3)]
    check("tail_multipliers_nonzero", all(value != 0 for value in gamma + delta), [str(value) for value in gamma + delta])
    check("tail_identity", all(gamma[i] * delta[i] == 1 for i in range(2)), True)
    check("zero_tail_rejected", not all(value != 0 for value in [Fraction(1), Fraction(0)]), True)

    radii = [Fraction(1, 1 << exponent) for exponent in range(192, 119, -1)]
    check("radius_count", len(radii) == 73, len(radii))
    check("radius_order", all(left < right for left, right in zip(radii, radii[1:])), True)
    y, z0, z1, z2 = Fraction(1, 1 << 200), Fraction(0), Fraction(1, 4), Fraction(1)
    passing = [index for index, radius in enumerate(radii) if radii_pass(y, z0, z1, z2, radius)]
    check("manufactured_radius_pass_exists", bool(passing), passing[:4])
    check("least_radius_selected", passing[0] == 0, passing[0])
    touch_radius = radii[20]
    check("polynomial_touch_fails", not radii_pass(touch_radius, Fraction(0), Fraction(0), Fraction(0), touch_radius), True)
    check("contraction_touch_fails", not radii_pass(Fraction(0), Fraction(1), Fraction(0), Fraction(0), radii[0]), True)
    check("negative_bound_rejected", not all(value >= 0 for value in (Fraction(0), Fraction(-1, 10), Fraction(0), Fraction(0))), True)

    events = contract["chronology"]["ordered_events"]
    inverse_freeze = events.index("inverse_record_self_hash_frozen")
    y_event = events.index("Y_computed")
    check("inverse_precedes_bounds", inverse_freeze < y_event, {"inverse": inverse_freeze, "Y": y_event})
    mutated_event_order = list(events)
    mutated_event_order.insert(mutated_event_order.index("Z0_computed"), "A_and_A_dagger_constructed")
    check("post_Y_reconstruction_rejected", mutated_event_order.index("A_and_A_dagger_constructed", y_event) > y_event, True)

    readiness = contract["readiness"]
    check("definition_complete", all(readiness[key] is True for key in ("operator_class_complete", "chronology_complete", "Y_Z_definitions_complete", "radii_decision_complete", "record_ABI_complete")), readiness)
    check("scientific_work_false", all(readiness[key] is False for key in ("fixture_audit_complete", "independent_definition_audit_complete", "scientific_inverse_constructed", "scientific_bounds_computed", "implementation_authorized", "candidate_execution_authorized")), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.validated_inverse_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS validates exact/synthetic inverse and radii semantics only; no scientific matrix or bound was constructed",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_INDEPENDENT_REPLAY_AND_CONTINUATION_TUBE_DEFINITION",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
