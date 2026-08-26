#!/usr/bin/env python3
"""Reproduce the fail-closed G2H-E-S4-R2 quantum builder definition gaps."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-quantum-builder-gap-inventory.v1.json"
BUILDER = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-disjoint-builder-algorithms.v1.json"
QUANTUM = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-quantum-ground-rset-noise-contract.v1.json"
R2 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
ROOTS = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


inventory = json.loads(INVENTORY.read_bytes())
builder = json.loads(BUILDER.read_bytes())
quantum = json.loads(QUANTUM.read_bytes())
checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


check("immutable_R2", digest(R2) == "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a", digest(R2))
check("immutable_quantum", digest(QUANTUM) == "cf0a49ad816af742f0d1f86acbe6afd33538f126ebf5eb7487dbb154359fe3cc", digest(QUANTUM))
check("immutable_builder_v1", digest(BUILDER) == "5bd4c47069bf1716acef1bb572af8d1d9aee78d251f6df883f068d9ed75f0abf", digest(BUILDER))
check("twelve_hard_gaps", len(inventory["hard_gaps"]) == 12 and len({gap["id"] for gap in inventory["hard_gaps"]}) == 12, [gap["id"] for gap in inventory["hard_gaps"]])
affected = {role for gap in inventory["hard_gaps"] for role in gap["affected_roles"]}
check("all_quantum_roles_covered", affected == {f"P{i:02d}" for i in range(8, 14)} | {f"R{i:02d}" for i in range(8, 14)}, sorted(affected))

primary = builder["primary_cpp_arb_lineage"]["quantum_builder"]
rust = builder["independent_pure_rust_lineage"]["quantum_builder"]
primary_budget = primary["budgets"]
rust_budget = rust["budgets"]
check("existing_primary_selectors_preserved", primary_budget == {
    "ell_max": 255, "Hadamard_WKB_order": 20, "radial_degree": 24,
    "kappa_panels": 1024, "kappa_nodes_per_panel": 32, "energy_panels": 2048,
    "energy_nodes_per_panel": 32, "limiting_absorption_levels": 9,
    "adaptive_panels": 0, "target_total_width": "2^-120", "per_tail_target": "2^-132",
}, primary_budget)
check("existing_rust_selectors_preserved", rust_budget == {
    "ell_max": 287, "Hadamard_WKB_order": 22, "radial_degree": 28,
    "Taylor_steps_per_cell": 48, "kappa_panels": 1536, "kappa_nodes_per_panel": 24,
    "energy_panels": 2304, "energy_nodes_per_panel": 24,
    "limiting_absorption_levels": 9, "adaptive_panels": 0,
    "target_total_width": "2^-120", "per_tail_target": "2^-132",
}, rust_budget)

serialized = json.dumps(builder, sort_keys=True)
missing_terms = {
    "primary_x_endpoint": "x_domain_endpoint",
    "rust_t_endpoint": "t_domain_endpoint",
    "primary_GL_node_generation": "gauss_legendre_node_generation",
    "rust_tanh_sinh_spacing": "tanh_sinh_step",
    "energy_coordinate": "energy_coordinate",
    "epsilon_extrapolation_stencil": "epsilon_extrapolation_stencil",
    "radial_defect_iterations": "radial_defect_correction_iterations",
    "Picard_iterations": "picard_iterations",
    "Hadamard_projection_budget": "hadamard_projection_budget",
    "noise_reorthogonalization": "noise_reorthogonalization",
    "error_allocation": "quantum_error_allocation",
    "role_payload_schema": "quantum_role_payload_schema",
}
for name, token in missing_terms.items():
    check(f"missing_{name}", token not in serialized, token)

check("mathematical_products_remain_defined", quantum["readiness"]["finite_product_and_tail_definition_complete"] is True
      and quantum["readiness"]["scientific_spectrum_evaluated"] is False
      and quantum["readiness"]["scientific_RSET_evaluated"] is False
      and quantum["readiness"]["scientific_noise_evaluated"] is False, quantum["readiness"])
check("repair_not_implementation_ready", inventory["readiness"]["gap_inventory_complete"] is True
      and inventory["readiness"]["successor_quantum_builder_contract_complete"] is False
      and inventory["readiness"]["quantum_source_implementation_eligible"] is False, inventory["readiness"])
check("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
check("authority_locked", not any(inventory["authority"].values()) and not any(quantum["authority"].values()), {"inventory": inventory["authority"], "quantum": quantum["authority"]})

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4_r2.quantum_builder_gap_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "meaning": "PASS reproduces an implementation-blocking definition gap; it is not quantum or candidate failure",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "execution_authorized": False,
    "authority_promoted": False,
    "disposition": "RETURN_TO_ADDITIVE_QUANTUM_BUILDER_DEFINITION_BEFORE_P08_R08_IMPLEMENTATION",
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
