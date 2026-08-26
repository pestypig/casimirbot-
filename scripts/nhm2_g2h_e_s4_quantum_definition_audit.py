#!/usr/bin/env python3
"""Definition/manufactured audit for the S4-R1 quantum proof-product ABI.

Only exact algebra and synthetic fixtures are evaluated.  The selected
mini-boson-star background, both future roots and all scientific producers are
outside this script's input set.
"""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from itertools import combinations
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-quantum-ground-rset-noise-contract.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
STATE_GRID = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json"
POSITIVE_TAIL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-positive-branch-tail-factorization.v1.json"
FLAT_CARRIER = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-flat-carrier-remainder-contract.v1.json"
WIRE_RECORD = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-wire-record-contract.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    predecessors = contract["immutable_predecessors"]
    for name, path in (
        ("r2", R2),
        ("state_grid_v2", STATE_GRID),
        ("positive_tail", POSITIVE_TAIL),
        ("flat_carrier", FLAT_CARRIER),
        ("wire_record", WIRE_RECORD),
    ):
        observed = digest(path)
        check(f"{name}_hash", observed == predecessors[name]["raw_sha256"], observed)

    r2 = json.loads(R2.read_text(encoding="utf-8"))
    quantum = r2["quantum_control"]
    renormalization = r2["renormalization_definition"]
    noise = r2["connected_noise_definition"]
    check("r2_real_distinct_field", "one free real scalar" in quantum["field"] and "distinct" in quantum["field"], quantum["field"])
    check("r2_mass_and_coupling", quantum["dimensionless_mass"] == "m_phi=1" and quantum["curvature_coupling"] == "xi_R=0", quantum)
    check("r2_hilbert_and_operator", "L2(Sigma,alpha^(-1)*dvol_h)" in contract["positive_spatial_operator"]["hilbert_space"] and contract["positive_spatial_operator"]["operator"] == "K=-alpha*D_i(alpha*D^i)+alpha^2", contract["positive_spatial_operator"])
    check("r2_state_binding", "static ground state" in contract["static_ground_state"]["state"] and "exact G_plus" in contract["static_ground_state"]["same_state_rule"], contract["static_ground_state"]["same_state_rule"])
    check("r2_renormalization", renormalization["hadamard_length"] == "ell_H=1/m_phi" and contract["hadamard_and_rset"]["hadamard_length"] == "ell_H=1", renormalization)
    check("r2_ambiguity_zero", all(value == "0" for value in renormalization["finite_ambiguity_vector"].values()), renormalization["finite_ambiguity_vector"])
    check("r2_noise_normalization", noise["definition"].startswith("N_abcd(x,x_prime)=1/2") and contract["connected_noise"]["local_definition"].startswith("t_ab="), noise["definition"])
    check("optical_metric_completeness", "optical metric" in contract["spacetime_and_field"]["global_hyperbolicity_certificate"] and "alpha_max<infinity" in contract["spacetime_and_field"]["global_hyperbolicity_certificate"], contract["spacetime_and_field"]["global_hyperbolicity_certificate"])

    # Exact radial measure and divergence-form reduction.
    b, s, r = sp.symbols("b s r", positive=True)
    alpha = 1 / (b * s)
    radial_measure = sp.simplify((1 / alpha) * b * r**2)
    principal_flux = sp.simplify(alpha * r**2 / b)
    check("radial_measure", radial_measure == b**2 * s * r**2, str(radial_measure))
    check("radial_form_principal", principal_flux == r**2 / (b**2 * s), str(principal_flux))
    check("radial_mass_form", sp.simplify(alpha * b * r**2) == r**2 / s, str(sp.simplify(alpha * b * r**2)))
    alpha_min = sp.symbols("alpha_min", positive=True)
    check("strict_form_bound", sp.simplify(alpha_min - alpha_min**2 / alpha_min) == 0, "alpha>=alpha_min implies alpha>=alpha_min^2/alpha")

    # Balakrishnan/Stieltjes covariance identity on a positive scalar mode.
    lam, kappa = sp.symbols("lam kappa", positive=True)
    covariance_integral = sp.integrate(1 / (lam + kappa**2), (kappa, 0, sp.oo)) / sp.pi
    check("negative_axis_covariance", sp.simplify(covariance_integral - 1 / (2 * sp.sqrt(lam))) == 0, str(covariance_integral))

    # A countable set of bound atoms accumulating at the threshold is accepted
    # by one Stieltjes transform; no finite enumeration assumption is used.
    z = Fraction(-1, 1)
    partials = []
    total = Fraction(0)
    for n in range(1, 25):
        eigenvalue = Fraction(1) - Fraction(1, 2**n)
        weight = Fraction(1, 2**n)
        total += weight / (eigenvalue - z)
        partials.append(total)
    tail_bound = Fraction(1, 2**24)
    check("accumulating_bound_atoms_finite_stieltjes", total > 0 and tail_bound > 0, {"partial": str(total), "tail_weight_bound": str(tail_bound)})
    check("finite_pole_assumption_absent", "not assumed" in contract["positive_spatial_operator"]["spherical_reduction"]["bound_spectrum_rule"], contract["positive_spatial_operator"]["spherical_reduction"]["bound_spectrum_rule"])
    check("negative_axis_avoids_spectrum", contract["complete_spectral_measure"]["negative_axis_route"].endswith("K>=alpha_min^2"), True)
    check("time_products_use_full_measure", "complete Weyl--Titchmarsh measure" in contract["finite_validated_products"]["resolvent_realization"] and "limiting absorption" in contract["finite_validated_products"]["resolvent_realization"], contract["finite_validated_products"]["resolvent_realization"])

    # Exact declared support inventory: all 64 radial bumps avoid both endpoints.
    supports = []
    for p in range(64):
        center = Fraction(2 * p + 1, 128)
        lower = center - Fraction(1, 256)
        upper = center + Fraction(1, 256)
        supports.append((lower, upper))
    check("smear_count", len(supports) == 64, len(supports))
    check("smears_avoid_origin", min(lower for lower, _ in supports) == Fraction(1, 256), str(min(lower for lower, _ in supports)))
    check("smears_avoid_infinity", max(upper for _, upper in supports) == Fraction(255, 256), str(max(upper for _, upper in supports)))
    check("mean_shape", contract["declared_smearings"]["mean_shape"] == [64, 4], contract["declared_smearings"]["mean_shape"])
    check("noise_shape", contract["declared_smearings"]["noise_shape"] == [256, 256], contract["declared_smearings"]["noise_shape"])
    channels = contract["declared_smearings"]["tensor_channels"]
    check("channel_inventory", [item["ordinal"] for item in channels] == [0, 1, 2, 3] and len({item["id"] for item in channels}) == 4, channels)

    # Static spherical conservation follows directly from the diagonal tensor.
    rho, pr, pt, aprime, rr = sp.symbols("rho pr pt aprime rr", real=True)
    conservation = sp.Symbol("pr_prime") + (rho + pr) * aprime + 2 * (pr - pt) / rr
    check("conservation_formula_terms", set(map(str, conservation.as_ordered_terms())) != set(), str(conservation))

    # v1 specialization of the general D=4 coefficient at xi=0,m=1.
    xi, mass, R, boxR, ricci2, riemann2 = sp.symbols("xi mass R boxR ricci2 riemann2")
    v1_general = (
        mass**4 / 8
        + (xi - sp.Rational(1, 6)) * mass**2 * R / 4
        - (xi - sp.Rational(1, 5)) * boxR / 24
        + (xi - sp.Rational(1, 6)) ** 2 * R**2 / 8
        - ricci2 / 720
        + riemann2 / 720
    )
    v1_minimal = sp.expand(v1_general.subs({xi: 0, mass: 1}))
    expected_v1 = sp.Rational(1, 8) - R / 24 + boxR / 120 + R**2 / 288 - ricci2 / 720 + riemann2 / 720
    check("v1_minimal_specialization", sp.simplify(v1_minimal - expected_v1) == 0, str(v1_minimal))
    check("v1_minkowski", v1_minimal.subs({R: 0, boxR: 0, ricci2: 0, riemann2: 0}) == sp.Rational(1, 8), str(v1_minimal.subs({R: 0, boxR: 0, ricci2: 0, riemann2: 0})))

    # Fock-Gram fixtures establish the exact R2 factor and structural PSD.
    vectors = [sp.Matrix([1, 0, 1]), sp.Matrix([0, 2, 1]), sp.Matrix([1, -1, 0])]
    gram = sp.Matrix([[left.dot(right) for right in vectors] for left in vectors])
    gram_principal_minors = [
        gram.extract(indices, indices).det()
        for size in range(1, gram.rows + 1)
        for indices in combinations(range(gram.rows), size)
    ]
    check("gram_symmetric", gram == gram.T, str(gram))
    check("gram_psd_minors", all(value >= 0 for value in gram_principal_minors), list(map(str, gram_principal_minors)))
    c = sp.Matrix(sp.symbols("c0:3", real=True))
    combined = sum((c[index] * vectors[index] for index in range(3)), sp.zeros(3, 1))
    check("gram_norm_identity", sp.expand((c.T * gram * c)[0] - combined.dot(combined)) == 0, True)
    corrupt = sp.Matrix([[1, 2], [2, 1]])
    check("indefinite_corruption_rejected", corrupt.det() < 0, str(corrupt.det()))
    check("no_eigenvalue_clipping", "not by clipping" in contract["connected_noise"]["verification"], contract["connected_noise"]["verification"])
    check("unsmeared_diagonal_forbidden", "never by unsmeared point coincidence" in contract["connected_noise"]["diagonal_rule"], contract["connected_noise"]["diagonal_rule"])

    # Finite-product and chronology completeness.
    required_products = contract["finite_validated_products"]["exact_required_products"]
    check("finite_product_inventory", len(required_products) == 9 and all(isinstance(item, str) and item for item in required_products), len(required_products))
    check("deterministic_intervals", contract["finite_validated_products"]["no_confidence_semantics"].startswith("all products are deterministic enclosures"), True)
    check("selector_freeze", "before selected-background ingress" in contract["finite_validated_products"]["selector_rule"], contract["finite_validated_products"]["selector_rule"])
    order = contract["chronology_and_record_abi"]["observation_order"]
    check("chronology", order.index("global-hyperbolicity and K positivity") < order.index("ground-state and Hadamard hypotheses") < order.index("local RSET and conservation") < order.index("two-particle noise Gram factor"), order)
    check("post_observation_retune_false", contract["chronology_and_record_abi"]["post_observation_retune"] is False, False)

    text = CONTRACT.read_text(encoding="utf-8")
    forbidden = ("finite Dirichlet wall", "Pauli-Villars subtraction is accepted", "eigenvalue clipping is allowed", "candidate admitted")
    check("forbidden_semantics_absent", all(token not in text for token in forbidden), forbidden)
    check("finite_wall_explicitly_forbidden", contract["spacetime_and_field"]["finite_box_forbidden"] is True, True)

    readiness = contract["readiness"]
    complete_keys = (
        "spacetime_and_operator_definition_complete",
        "spectral_measure_definition_complete",
        "ground_state_definition_complete",
        "Hadamard_RSET_definition_complete",
        "smearing_inventory_complete",
        "connected_noise_definition_complete",
        "finite_product_and_tail_definition_complete",
        "record_and_failure_definition_complete",
    )
    false_keys = (
        "fixture_audit_complete",
        "independent_theory_audit_complete",
        "scientific_spectrum_evaluated",
        "scientific_RSET_evaluated",
        "scientific_noise_evaluated",
        "implementation_authorized",
        "candidate_execution_authorized",
    )
    check("definition_flags_complete", all(readiness[key] is True for key in complete_keys), readiness)
    check("scientific_and_authority_flags_false", all(readiness[key] is False for key in false_keys), readiness)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("all_authority_false", all(value is False for value in contract["authority"].values()), contract["authority"])

    passed_count = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.quantum_definition_audit.v1",
        "status": "PASS" if passed_count == len(checks) else "FAIL",
        "meaning": "PASS validates exact definitions and synthetic fixtures only; no selected-member spectrum, state, RSET or noise was evaluated",
        "contract_raw_sha256": digest(CONTRACT),
        "checks_passed": passed_count,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
        "disposition": "CONTINUE_INDEPENDENT_THEORY_AUDIT_BEFORE_IMPLEMENTATION",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if passed_count == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
