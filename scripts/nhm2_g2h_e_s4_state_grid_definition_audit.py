#!/usr/bin/env python3
"""Fail-closed audit of the invalidated S4-R1 state/grid draft."""

from __future__ import annotations

import hashlib
import json
import sys
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
GRID = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v1.json"
AUDIT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-state-grid-definition-audit.md"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inverse_dct_stored(a: list[Fraction], j: int) -> Fraction:
    # Only the exact endpoint/interior factors matter for the counterexample.
    n = len(a) - 1
    if n == 2 and j == 0:
        return a[0] / 2 + a[1] + a[2] / 2
    if n == 4 and j == 0:
        return a[0] / 2 + a[1] + a[2] + a[3] + a[4] / 2
    raise ValueError("fixture_surface")


def main() -> int:
    r2 = json.loads(R2.read_text(encoding="utf-8"))
    grid = json.loads(GRID.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    check("r2_hash_preserved", sha256(R2) == "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a", sha256(R2))
    check("audit_packet_present", AUDIT.is_file(), str(AUDIT.relative_to(ROOT)))
    check("draft_explicitly_invalidated", grid["status"].startswith("invalidated_before_implementation_"), grid["status"])
    check("replacement_required", grid["readiness"]["replacement_required"] is True, grid["readiness"])
    check("readiness_false", all(grid["readiness"][key] is False for key in ("state_packing_complete", "grid_and_row_order_complete", "cross_grid_norms_complete", "sealed", "implementation_authorized", "candidate_execution_authorized")), grid["readiness"])
    check("r2_grid_integers_preserved", r2["proof_grids_and_partitions"]["full_solve_grids"] == [64, 96, 128, 256], r2["proof_grids_and_partitions"]["full_solve_grids"])
    check("invented_degree_semantics_detected", grid["grid_meaning"]["N_definition"].startswith("polynomial degree on each"), grid["grid_meaning"]["N_definition"])

    # Degree-two T_2 is stored with endpoint coefficient 2.  Raw zero-padding
    # makes that coefficient interior on degree four and doubles the polynomial.
    low = [Fraction(0), Fraction(0), Fraction(2)]
    raw_padded = [Fraction(0), Fraction(0), Fraction(2), Fraction(0), Fraction(0)]
    canonical_padded = [Fraction(0), Fraction(0), Fraction(1), Fraction(0), Fraction(0)]
    low_at_one = inverse_dct_stored(low, 0)
    raw_at_one = inverse_dct_stored(raw_padded, 0)
    canonical_at_one = inverse_dct_stored(canonical_padded, 0)
    check("dct_low_represents_T2", low_at_one == 1, str(low_at_one))
    check("raw_zero_pad_changes_polynomial", raw_at_one == 2 and raw_at_one != low_at_one, str(raw_at_one))
    check("canonical_conversion_preserves_polynomial", canonical_at_one == low_at_one, str(canonical_at_one))

    comparison = grid["frozen_cross_grid_norms"]["comparison"]
    check("draft_uses_raw_zero_pad_language", "zero-pad the lower-degree coefficient vector" in comparison, comparison)
    check("raw_tail_fields_detected", grid["continuum_unknowns"]["field_order"] == ["b", "s", "sigma", "p"] and grid["continuum_unknowns"]["no_field_transform"] is True, grid["continuum_unknowns"])
    check("exponential_weight_detected", grid["frozen_cross_grid_norms"]["coefficient_prime_weight"].startswith("endpoint coefficients") and "(17/16)^k" in grid["frozen_cross_grid_norms"]["norms_in_frozen_order"][0]["definition"], grid["frozen_cross_grid_norms"]["norms_in_frozen_order"][0])
    check("tail_factorization_was_left_unbound", grid["unsealed_dependencies"]["tail_factorization_and_recurrence"] is None, grid["unsealed_dependencies"])
    check("generic_lobatto_not_explicit_parity_basis", grid["continuum_unknowns"]["no_field_transform"] is True and "cos(" in grid["grid_meaning"]["core_patch"]["node_formula"], grid["grid_meaning"]["core_patch"])

    for n in (64, 96, 128, 256):
        state_count = 8 * (n + 1) + 1
        row_count = 4 * n + 4 * n + 4 + 5
        check(f"square_count_{n}", state_count == row_count, {"state": state_count, "rows": row_count})

    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", not any(grid["authority"].values()), grid["authority"])

    passed = all(entry["pass"] for entry in checks)
    result = {
        "schema": "nhm2.g2h_e_s4_r1.state_grid_definition_audit.v1",
        "status": "PASS" if passed else "FAIL",
        "meaning": "PASS means the audit reproduced the invalidating defects; it does not accept the grid draft",
        "grid_contract_raw_sha256": sha256(GRID),
        "audit_packet_raw_sha256": sha256(AUDIT),
        "checks_passed": sum(bool(entry["pass"]) for entry in checks),
        "checks_total": len(checks),
        "candidate_evaluations": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "RETURN_TO_TAIL_FACTORIZATION_THEN_STATE_GRID_REPLACEMENT" if passed else "STOP_AUDIT_INCONSISTENT",
        "checks": checks,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
