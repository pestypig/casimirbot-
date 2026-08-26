#!/usr/bin/env python3
"""Fail closed unless the G2H-E-S4 producer matrix matches bound evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json"
MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-fixture-build-bindings.v1.json"
P08_BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p08-r08-build-binding.v2.json"
P09_BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p09-r09-build-binding.v3.json"
P10_BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p10-r10-build-binding.v4.json"
P11_BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p11-r11-build-binding.v5.json"
P12_BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p12-r12-build-binding.v6.json"
P13_BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p13-r13-build-binding.v7.json"
CLOSURE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-final-closure-receipt.v1.json"
PRIMARY = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_fixture_primary.cpp"
RUST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_fixture_independent.rs"
ROOTS = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    matrix = json.loads(MATRIX.read_bytes())
    manifest = json.loads(MANIFEST.read_bytes())
    p08_binding = json.loads(P08_BINDING.read_bytes())
    p09_binding = json.loads(P09_BINDING.read_bytes())
    p10_binding = json.loads(P10_BINDING.read_bytes())
    p11_binding = json.loads(P11_BINDING.read_bytes())
    p12_binding = json.loads(P12_BINDING.read_bytes())
    p13_binding = json.loads(P13_BINDING.read_bytes())
    closure = json.loads(CLOSURE.read_bytes())
    checks: list[dict[str, object]] = []

    def check(name: str, condition: bool, detail: object) -> None:
        checks.append({"name": name, "pass": condition, "detail": detail})

    check(
        "manifest_binding",
        digest(MANIFEST) == matrix["current_bound_evidence"]["fixture_build_binding_raw_sha256"],
        digest(MANIFEST),
    )
    check(
        "p08_binding",
        digest(P08_BINDING) == matrix["current_bound_evidence"]["p08_r08_build_binding_raw_sha256"],
        digest(P08_BINDING),
    )
    check(
        "p09_binding",
        digest(P09_BINDING) == matrix["current_bound_evidence"]["p09_r09_build_binding_raw_sha256"],
        digest(P09_BINDING),
    )
    check(
        "p10_binding",
        digest(P10_BINDING) == matrix["current_bound_evidence"]["p10_r10_build_binding_raw_sha256"],
        digest(P10_BINDING),
    )
    check(
        "p11_binding",
        digest(P11_BINDING) == matrix["current_bound_evidence"]["p11_r11_build_binding_raw_sha256"],
        digest(P11_BINDING),
    )
    check(
        "p12_binding",
        digest(P12_BINDING) == matrix["current_bound_evidence"]["p12_r12_build_binding_raw_sha256"],
        digest(P12_BINDING),
    )
    check(
        "p13_binding",
        digest(P13_BINDING) == matrix["current_bound_evidence"]["p13_r13_build_binding_raw_sha256"],
        digest(P13_BINDING),
    )
    check(
        "final_closure_binding",
        digest(CLOSURE) == matrix["current_bound_evidence"]["final_closure_receipt_raw_sha256"]
        and closure["status"] == "PASS_IMPLEMENTATION_PREEXECUTION_ONLY"
        and closure["preclosure_evidence"]["final_preverification_checks_passed"] == 38
        and closure["preclosure_evidence"]["final_preverification_checks_total"] == 38
        and closure["repository_verification"]["math_validate"] == "PASS"
        and closure["repository_verification"]["warp_tests_passed"] == 179
        and closure["repository_verification"]["warp_tests_total"] == 179
        and closure["repository_verification"]["casimir_verdict"] == "PASS"
        and closure["repository_verification"]["casimir_certificate_integrity_ok"] is True,
        digest(CLOSURE),
    )
    check(
        "primary_source_binding",
        digest(PRIMARY) == p13_binding["primary_cpp_fixture"]["changed_sources"][0]["raw_sha256"],
        digest(PRIMARY),
    )
    check(
        "rust_source_binding",
        digest(RUST) == p13_binding["independent_rust_fixture"]["changed_sources"][0]["raw_sha256"],
        digest(RUST),
    )
    check("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])

    common = matrix["common_roles"]
    primary = matrix["primary_cpp_arb_flint_gmp_mpfr_roles"]
    rust = matrix["independent_pure_rust_roles"]
    maturity = {"complete", "partial", "missing"}
    check(
        "maturity_grammar",
        all(role["primary"] in maturity and role["independent"] in maturity for role in common)
        and all(role["status"] in maturity for role in primary + rust),
        sorted(maturity),
    )
    common_complete = sum(
        role["primary"] == "complete" and role["independent"] == "complete" for role in common
    )
    primary_complete = sum(role["status"] == "complete" for role in primary)
    rust_complete = sum(role["status"] == "complete" for role in rust)
    summary = matrix["promotion_summary"]
    check(
        "completion_counts",
        common_complete == summary["common_complete"]
        and len(common) == summary["common_required"]
        and primary_complete == summary["primary_complete"]
        and len(primary) == summary["primary_required"]
        and rust_complete == summary["independent_complete"]
        and len(rust) == summary["independent_required"],
        {"common": [common_complete, len(common)], "primary": [primary_complete, len(primary)], "independent": [rust_complete, len(rust)]},
    )
    incomplete = common_complete != len(common) or primary_complete != len(primary) or rust_complete != len(rust)
    check(
        "promotion_state",
        ((incomplete and summary["all_required_roles_complete"] is False)
         or (not incomplete and summary["all_required_roles_complete"] is True))
        and summary["S4_implementation_closure"] is True
        and summary["inert_future_primary_proposal_allowed"] is True
        and manifest["closure_flags"]["full_primary_scientific_producer_implemented"] is False
        and manifest["closure_flags"]["full_independent_scientific_producer_implemented"] is False,
        summary,
    )
    check(
        "authority_locked",
        all(value is False for value in matrix["authority"].values())
        and all(value is False for value in manifest["authority"].values())
        and all(value is False for value in p08_binding["authority"].values())
        and all(value is False for value in p09_binding["authority"].values())
        and all(value is False for value in p10_binding["authority"].values())
        and all(value is False for value in p11_binding["authority"].values())
        and all(value is False for value in p12_binding["authority"].values())
        and all(value is False for value in p13_binding["authority"].values()),
        {"matrix": matrix["authority"], "manifest": manifest["authority"], "p08_binding": p08_binding["authority"], "p09_binding": p09_binding["authority"], "p10_binding": p10_binding["authority"], "p11_binding": p11_binding["authority"], "p12_binding": p12_binding["authority"], "p13_binding": p13_binding["authority"]},
    )

    passed = sum(item["pass"] is True for item in checks)
    report = {
        "schema": "nhm2.g2h_e_s4.producer_completion_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS proves role counts, bindings and the final implementation/preexecution closure receipt match current evidence; it does not prove or authorize the candidate",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "common_roles_complete": common_complete,
        "primary_roles_complete": primary_complete,
        "independent_roles_complete": rust_complete,
        "S4_implementation_closure": True,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "execution_authorized": False,
        "authority_promoted": False,
        "disposition": matrix["next_frozen_order"][0],
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
