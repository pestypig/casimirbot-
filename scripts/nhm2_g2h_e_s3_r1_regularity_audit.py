#!/usr/bin/env python3
"""Read-only audit of the G2H-E-S3-R1 regularity disposition."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DISPOSITION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r1-regularity-disposition.v1.json"
PRIMARY_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-primary-result.v1.json"
WORK_PROGRAM = ROOT / "docs/research/nhm2-spherical-boson-star-v2-work-program.md"
EXPECTED_DISPOSITION_SHA256 = "e86dcd1060c9e753c5fef3a8d4bfb21d974244b7fd108d6b669765389902ec0a"
EXPECTED_PRIMARY_RESULT_SHA256 = "4248b29a38588dc6c1b1a0c283bb78399eabd3d815376d0ddad3fd7e481392d7"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    checks: list[tuple[str, bool]] = []

    def add(name: str, passed: object) -> None:
        checks.append((name, bool(passed)))

    data = json.loads(DISPOSITION.read_text(encoding="utf-8"))
    add("disposition_identity", sha(DISPOSITION) == EXPECTED_DISPOSITION_SHA256)
    add("primary_result_identity", sha(PRIMARY_RESULT) == EXPECTED_PRIMARY_RESULT_SHA256)

    upstream = subprocess.run(
        [sys.executable, str(ROOT / "scripts/nhm2_g2h_e_s3_primary_result_audit.py")],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    upstream_payload = json.loads(upstream.stdout)
    add("upstream_immutable_evidence_audit", upstream.returncode == 0 and upstream_payload["passed"] == upstream_payload["total"] == 77)

    failure = data["frozen_failure"]
    add("failure_binding", failure == {
        "B_second_exterior": "100/27",
        "B_second_interior": "-350/27",
        "first_disjoint_order": 2,
        "manifest_sha256": "b4eec02bdc166b10cfc0e795e7d3f1bb64b618356e07d1dfcf883e8cbe5edd98",
        "proposal_exhausted": True,
        "result_sha256": EXPECTED_PRIMARY_RESULT_SHA256,
        "typed_failure": "GLOBAL_STATIC_STATE_FAIL",
    })

    z, zp = Fraction(3, 5), Fraction(2, 5)
    reciprocal_second = lambda zpp: 2 * zp * zp / z**3 - zpp / z**2
    add("independent_B_second_replay", (reciprocal_second(Fraction(26, 5)), reciprocal_second(Fraction(-4, 5))) == (Fraction(-350, 27), Fraction(100, 27)))

    rho_x_inside, pressure_x_surface, scalar_x_outside = Fraction(-6), Fraction(0), Fraction(0)
    scalar_x_inside = rho_x_inside - 3 * pressure_x_surface
    jump = scalar_x_outside - scalar_x_inside
    box_delta = z * jump
    v1_delta = Fraction(1, 120) * box_delta
    replay = data["tolman_distributional_replay"]
    add("scalar_derivative_replay", scalar_x_inside == -6 and jump == 6)
    add("box_R_delta_replay", box_delta == Fraction(18, 5))
    add("v1_delta_replay", v1_delta == Fraction(3, 100))
    add("recorded_distribution_replay", replay["interior_surface_derivative"] == "S_x(1-)=-6" and replay["jump_exterior_minus_interior"] == "6" and replay["box_R_surface_delta_coefficient_dimensionless"] == "18/5" and replay["v1_surface_delta_coefficient_dimensionless"] == "3/100")

    junction = data["junction_disposition"]
    add("junction_scope_preserved", junction["ordinary_israel_darmois"] == "PASS_UNCHANGED" and "does not establish" in junction["quantum_implication"])
    ladder = {entry["layer"]: entry for entry in data["regularity_ladder"]}
    add("regularity_ladder_inventory", set(ladder) == {"ordinary_junction", "weak_kg_and_friedrichs_form", "static_ground_state_hadamard_theorem", "local_covariant_rset", "connected_noise"})
    add("standard_hadamard_ineligible", ladder["static_ground_state_hadamard_theorem"]["tolman_status"] == "INELIGIBLE" and "C_infinity" in ladder["static_ground_state_hadamard_theorem"]["required_route"])
    add("weak_route_not_overclaimed", ladder["weak_kg_and_friedrichs_form"]["tolman_status"] == "NOT_DECIDED_AND_NOT_NEEDED_AFTER_FIRST_FAIL")
    finite = data["sharp_finite_regularity_minimum"]
    add("finite_minimum_not_invented", finite["status"] == "NOT_ESTABLISHED_FOR_THE_FULL_FROZEN_PACKAGE" and finite["claim_boundary"] == "this is not a proof that no alternative low-regularity quantum field theory exists")

    successor = data["successor_standard_route"]
    add("smooth_not_analytic", successor["analyticity_required"] is False and "C_infinity" in successor["background_requirement"])
    add("global_static_requirements", all(key in successor for key in ("lapse_requirement", "spatial_requirement", "spectral_requirement", "interface_requirement")))
    add("finite_jet_insufficient", "agreement through any preregistered finite jet order alone" in successor["insufficient_proof_methods"])
    add("analytic_germ_special_only", "exact analytic interior/exterior germ identity as a sufficient special case" in successor["sufficient_proof_methods"])

    alternative = data["alternative_low_regularity_route"]
    add("alternative_not_admitted", alternative["eligible_now"] is False and len(alternative["required_before_future_eligibility"]) == 5)
    add("alternative_separate_program", alternative["program_scope"] == "separate research program rather than a repair or reinterpretation of Tolman VII")

    expected_sources = {
        "https://arxiv.org/abs/hep-th/9507097",
        "https://arxiv.org/abs/gr-qc/0512118",
        "https://arxiv.org/abs/gr-qc/0010019",
        "https://arxiv.org/abs/1401.2026",
        "https://arxiv.org/abs/1602.00930",
    }
    add("primary_source_inventory", {source["url"] for source in data["sources"]} == expected_sources)
    authority = data["authority"]
    add("authority_locked", authority["candidate_evaluations"] == 1 and not any(value for key, value in authority.items() if key != "candidate_evaluations"))
    add("decision", data["decision"] == "UPHOLD_TOLMAN_FAIL_REQUIRE_STANDARD_C_INFINITY_ROUTE_NARROW_ANALYTIC_GERM_RULE")
    add("schema", data["schema"] == "nhm2.g2h_e_s3_r1.regularity_disposition.v1")
    work_program = WORK_PROGRAM.read_text(encoding="utf-8")
    add("single_active_program_gate", work_program.count("Active program gate:") == 1)
    add("successor_gate_active", "Active program gate: **G2H-E-S3-R2 — smooth replacement-family research and preregistration**" in work_program)
    add("r1_closed_in_roadmap", "| G2H-E-S3-R1 — Surface-regularity first-failure theoretical disposition | closed: independently audited theoretical `PASS` |" in work_program)

    failures = [name for name, passed in checks if not passed]
    print(json.dumps({
        "schema": "nhm2.g2h_e_s3_r1.regularity_audit.v1",
        "passed": len(checks) - len(failures),
        "total": len(checks),
        "failures": failures,
        "disposition_sha256": sha(DISPOSITION),
    }, sort_keys=True))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
