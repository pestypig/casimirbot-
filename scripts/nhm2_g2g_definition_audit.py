#!/usr/bin/env python3
"""Definition-only audit of the frozen NHM2 G2G Tolman-VII contract.

This script performs exact rational bookkeeping and contract validation.  It
does not evaluate the pressure/lapse functions, solve an ODE or eigenproblem,
construct a quantum mode, or create either future proof root.
"""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json"
SIDECAR = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.sha256"
IDENTITY = "G2F_TOLMAN_VII_NATURAL_BETA_1_5_SCALAR_HADAMARD_V1"
SOURCE_HASHES = {
    "tolman_vii_exact": "a36fe51c5e54b306260f7950a831c527cced0892e24fbc8bd54dce39093f3438",
    "tolman_vii_independent": "81389455a1d94d1b46bc5f16e242f8f1f873a2aa551c41fc4aa34bc7f9aa51ac",
    "static_hadamard": "d65a9f9f82212aeabc1ae99e41315ebea2595d4c2676deeac89e9c188294aea6",
    "hadamard_rset": "676f41aac1dcff7f622ac147936e58e5e2ff60939a9688043d1657b92db29977",
    "noise_kernel": "38f2698b3f1dbefb3eda28d8aa24520818a021fb3f648376c56247c62bf2e820",
    "renormalized_fluctuations": "8642014b6bc46c5965fed0a7de217fd9ad0ffc3786418e684d3b05bba495df3e",
    "radial_stability": "be355176953fa63691948105a7e2e4f0ef3ed63d13adb34265b02c6c76cd509a",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    payload = json.loads(CONTRACT.read_text(encoding="utf-8"))
    before = copy.deepcopy(payload)
    sidecar = SIDECAR.read_text(encoding="ascii").split()[0]

    # Route A: integrate the frozen density through u'=x^2*RHO/2.
    compactness = Fraction(1, 5)
    rho0 = 15 * compactness
    route_a_u = {3: rho0 / 6, 5: -rho0 / 10}
    route_a_z = {0: Fraction(1), 2: -2 * route_a_u[3], 4: -2 * route_a_u[5]}

    # Route B: use the independent natural-star relation R/M=5/beta_N^2.
    beta_n = Fraction(1)
    route_b_c = beta_n * beta_n / 5
    route_b_rho0 = 15 * route_b_c
    route_b_u = {3: route_b_rho0 / 6, 5: -route_b_rho0 / 10}
    route_b_z = {0: Fraction(1), 2: -2 * route_b_u[3], 4: -2 * route_b_u[5]}

    y_min = Fraction(5, 6)  # y=x^2 at the nonzero stationary point.
    z_min = 1 - y_min + Fraction(3, 5) * y_min * y_min
    z_surface = sum(coefficient for coefficient in route_a_z.values())
    u_surface = sum(coefficient for coefficient in route_a_u.values())

    sources = {entry["id"]: entry["sha256"] for entry in payload["sources"]}
    authority = payload["authority"]
    future_roots = [ROOT / value for key, value in payload["future_roots"].items() if key in {"primary", "independent"}]
    classical_ids = [entry["id"] for entry in payload["classical_proof_duties"]]
    quantum_ids = [entry["id"] for entry in payload["quantum_proof_duties"]]

    checks = {
        "contract_digest_matches_sidecar": digest(CONTRACT) == sidecar,
        "schema_and_identity_frozen": payload["schema"] == "nhm2.g2g.tolman_vii_candidate_contract.v1" and payload["scientific_identity"] == IDENTITY,
        "selected_member_exact": payload["frozen_member"]["mu"] == "1" and payload["frozen_member"]["compactness_C_equals_M_over_R"] == "1/5",
        "route_a_exact_mass": rho0 == 3 and route_a_u == {3: Fraction(1, 2), 5: Fraction(-3, 10)},
        "route_b_exact_mass": route_b_c == compactness and route_b_u == route_a_u,
        "route_agreement_on_z": route_a_z == route_b_z == {0: Fraction(1), 2: Fraction(-1), 4: Fraction(3, 5)},
        "exact_origin_surface": route_a_u[3] == Fraction(1, 2) and u_surface == compactness and z_surface == Fraction(3, 5),
        "exact_horizon_margin": z_min == Fraction(7, 12) and z_min > 0,
        "lapse_pressure_tov_definitions_present": payload["interior_definition"]["Y"].startswith("s*cos") and "Y'" in payload["interior_definition"]["P"] and payload["interior_definition"]["tov_pressure"].startswith("P'="),
        "origin_and_junction_frozen": payload["origin_definition"]["regularity"].startswith("all scalar") and payload["surface_definition"]["P"] == "0" and "no surface shell" in payload["surface_definition"]["junction"],
        "classical_duty_inventory": classical_ids == [f"G2G-C{index:02d}" for index in range(1, 13)],
        "quantum_duty_inventory": quantum_ids == [f"G2G-Q{index:02d}" for index in range(1, 7)],
        "quantum_state_fully_frozen": payload["quantum_control"]["dimensionless_mass"] == "m_phi*R=1" and payload["quantum_control"]["curvature_coupling"] == "xi_R=0" and "ground state" in payload["quantum_control"]["state"],
        "rset_scheme_fully_frozen": (
            payload["renormalization_definition"]["hadamard_length"] == "ell_H=R"
            and payload["renormalization_definition"]["source_normalization"].startswith("alpha_4=1/(4*pi^2)")
            and payload["renormalization_definition"]["v1"] == "v1=(1/8)*m_phi^4-(1/24)*m_phi^2*R_scalar+(1/120)*Box*R_scalar+(1/288)*R_scalar^2-(1/720)*R_ab*R^ab+(1/720)*R_abcd*R^abcd"
            and payload["renormalization_definition"]["mean_stress"].startswith("<T_ab>_ren=(1/(8*pi^2))*(lim_x'_to_x T_ab'[W_H]+2*g_ab*v1)")
            and payload["renormalization_definition"]["finite_ambiguity_coefficients"] == ["0", "0", "0", "0"]
        ),
        "connected_noise_is_distributional": "unsmeared pointwise coincidence is forbidden" in payload["connected_noise_definition"]["distribution_rule"],
        "source_inventory_byte_bound": sources == SOURCE_HASHES and all(entry["bytes"] > 0 for entry in payload["sources"]),
        "future_implementations_disjoint": "Arb/FLINT/GMP/MPFR" in payload["future_proof_program"]["primary"]["runtime_lineage"] and "no GMP, MPFR, FLINT, Arb" in payload["future_proof_program"]["independent"]["runtime_lineage"],
        "toolchain_chronology_constructible": payload["future_proof_program"]["toolchain_pin_rule"] == "source, compiler, dependency and container digests must be frozen in G2H before either implementation is built; each reproducibly built executable digest must then be captured and frozen before that executable or any candidate-capable path is run",
        "arithmetic_and_partitions_frozen": payload["proof_arithmetic"]["working_precision_bits"] == 512 and payload["proof_partitions"]["interior_cells"] == 256 and payload["proof_partitions"]["adaptive_subdivision"] == "forbidden",
        "failure_chronology_frozen": len(payload["failure_precedence"]) == 12 and len(payload["chronology"]) == 8,
        "future_roots_absent": all(not path.exists() for path in future_roots),
        "zero_candidate_evaluations": authority["candidate_evaluations"] == 0,
        "all_authority_false": all(value is False for key, value in authority.items() if key != "candidate_evaluations"),
        "audit_did_not_mutate_contract": payload == before,
    }
    result = {
        "schema": "nhm2.g2g.definition_audit.v1",
        "checks": checks,
        "exact_route_result": {
            "C": "1/5",
            "RHO": "3*(1-x^2)",
            "u": "(5*x^3-3*x^5)/10",
            "Z": "1-x^2+3*x^4/5",
            "Z_min": "7/12",
        },
        "candidate_evaluations": 0,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
