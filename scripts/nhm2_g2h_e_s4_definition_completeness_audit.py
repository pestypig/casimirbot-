#!/usr/bin/env python3
"""Fail-closed definition-completeness audit for the frozen G2H-E-S3-R2 contract.

This audit does not solve or evaluate the selected mini-boson-star member.  It
checks immutable ingress identities, authority locks, absent output roots, and
whether the frozen v1 contract contains enough exact definitions to admit two
independent proof-program implementations without scientific invention.
"""

from __future__ import annotations

import hashlib
import json
from fractions import Fraction
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "research"
CONTRACT_PATH = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
LEGACY_ABI_PATH = ROOT / "shared" / "contracts" / "nhm2-spherical-boson-star-v2-vacuum-continuation-proof-abi.v1.ts"
INVENTORY_PATH = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-inventory.v1.json"
MASS_CONTRACT_PATH = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s4-r1-mass-observable-contract.v1.json"

FROZEN = {
    DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.md":
        "f2fec60d0211e8762bee1a1b282dfdf3e38c8ebdbdb220ec068a8b02f2ba6cb2",
    DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.json":
        "7f7b7ac889de82d52a2b6fc667e4b458d42ac833f350c91c5c48890266310d03",
    CONTRACT_PATH:
        "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a",
    DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s3-r1-regularity-disposition.v1.json":
        "e86dcd1060c9e753c5fef3a8d4bfb21d974244b7fd108d6b669765389902ec0a",
    DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s3-primary-result.v1.json":
        "4248b29a38588dc6c1b1a0c283bb78399eabd3d815376d0ddad3fd7e481392d7",
}

# These are scientific or proof-semantic choices, not compiler details.  A
# prose duty or method label is not an executable definition of the choice.
REQUIRED_EXACT_DEFINITIONS = {
    "unknown_vector_and_coefficient_packing": (
        "ordered unknown vector, field transforms, coefficient order and canonical codec"
    ),
    "analytic_seed": (
        "exact seed on every grid; the predictor rule references but does not define it"
    ),
    "grid_nodes_maps_and_frozen_norms": (
        "node formulas, core/tail maps, component weights and every cross-grid norm"
    ),
    "validated_nonlinear_map": (
        "operator F, derivative, approximate inverse and interval-Newton/radii assembly"
    ),
    "continuation_cell_proof": (
        "tube representation, Y/Z0/Z1/Z2 bounds, candidate radii and strict predicates"
    ),
    "continuation_orientation_and_endpoint_maps": (
        "overlap/orientation/kernel/transversality and endpoint containment definitions"
    ),
    "mass_observable_normalization": (
        "geometrized mass convention and exact ADM, Komar and integrated-energy maps"
    ),
    "radial_stability_problem": (
        "perturbation operator, gauge reduction, domain, boundary conditions, norm and eigenvalue sign"
    ),
    "classical_record_abi": (
        "canonical manifests, records, first-failure payloads and self-hash domains"
    ),
    "quantum_mode_and_observable_abi": (
        "mode basis/normalization, admissible smearing inventory, RSET/noise algorithms and records"
    ),
}

# No key in the frozen contract supplies the exact definition above.  Keep the
# list explicit so a future additive contract version must address each item.
FORBIDDEN_AS_COMPLETION = (
    "basis",
    "predictor_rule",
    "cross_grid_rule",
    "candidate_radii_per_cell",
    "ordered_classical_proof_duties",
    "ordered_quantum_proof_duties",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    checks: list[dict[str, object]] = []

    for path, expected in FROZEN.items():
        actual = sha256(path) if path.is_file() else None
        checks.append({
            "check": f"frozen_sha256:{path.relative_to(ROOT).as_posix()}",
            "passed": actual == expected,
            "expected": expected,
            "actual": actual,
        })

    contract = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    checks.extend([
        {
            "check": "selected_identity_preserved",
            "passed": contract.get("scientific_identity") ==
                "G2H_E_S3_R2_MINI_BOSON_STAR_SHAT0_6_5_SCALAR_HADAMARD_V1",
        },
        {
            "check": "source_coordinate_preserved",
            "passed": contract.get("frozen_member", {}).get("source_coordinate_exact_ingress") == "6/5",
        },
        {
            "check": "no_r2_candidate_evaluation",
            "passed": contract.get("preserved_failure_lineage", {}).get("r2_candidate_evaluations") == 0,
        },
        {
            "check": "implementations_remain_unimplemented",
            "passed": all(
                v.get("status") == "not_implemented_not_authorized"
                for k, v in contract.get("future_implementations", {}).items()
                if k in {"primary", "independent"}
            ),
        },
    ])

    authority = contract.get("authority", {})
    authority_ok = authority.get("replacement_selected_for_future_proof") is True and all(
        value is False
        for key, value in authority.items()
        if key != "replacement_selected_for_future_proof"
    )
    checks.append({"check": "authority_fail_closed", "passed": authority_ok})

    boundaries = contract.get("preexecution_boundaries", {})
    roots = [ROOT / boundaries[name] for name in ("future_primary_root", "future_independent_root")]
    checks.append({
        "check": "future_candidate_roots_absent",
        "passed": all(not path.exists() for path in roots),
        "paths": [path.relative_to(ROOT).as_posix() for path in roots],
    })

    # Structural completeness test: v1 has no exact-definition namespace and
    # none of the required exact-definition identifiers.  Existing summary
    # fields are deliberately not accepted as substitutes.
    exact_namespace = contract.get("exact_proof_definitions")
    exact_defs = exact_namespace if isinstance(exact_namespace, dict) else {}
    gaps = [
        {"id": gap_id, "required": description, "bound": gap_id in exact_defs and exact_defs[gap_id] not in (None, "")}
        for gap_id, description in REQUIRED_EXACT_DEFINITIONS.items()
    ]
    no_summary_substitution = all(key in json.dumps(contract, sort_keys=True) for key in FORBIDDEN_AS_COMPLETION)
    checks.append({
        "check": "exact_proof_definition_namespace_absent",
        "passed": exact_namespace is None and no_summary_substitution,
        "gap_count": len(gaps),
    })

    legacy_text = LEGACY_ABI_PATH.read_text(encoding="utf-8")
    checks.append({
        "check": "legacy_vacuum_abi_does_not_complete_r2",
        "passed": "const MISSING_EXACT_CHOICES" in legacy_text
            and "exactScientificDefinitionsComplete: false" in legacy_text
            and str(LEGACY_ABI_PATH.relative_to(ROOT).as_posix()) not in json.dumps(contract),
    })

    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    mass_contract = json.loads(MASS_CONTRACT_PATH.read_text(encoding="utf-8"))
    ordered_inventory = inventory.get("ordered_gaps", [])
    mass_entries = [item for item in ordered_inventory if item.get("id") == "mass_observable_normalization"]
    # With mbar_P^2=1=1/(8*pi*G), multiplying physical energy mass
    # derivative 4*pi*r^2*rho by G gives r^2*rho/2 exactly.
    geometrized_energy_factor = Fraction(1, 8) * 4
    checks.extend([
        {
            "check": "definition_inventory_order_and_identity",
            "passed": len(ordered_inventory) == 10
                and [item.get("ordinal") for item in ordered_inventory] == list(range(1, 11))
                and [item.get("id") for item in ordered_inventory] == list(REQUIRED_EXACT_DEFINITIONS),
        },
        {
            "check": "mass_convention_exact_derivation",
            "passed": len(mass_entries) == 1
                and geometrized_energy_factor == Fraction(1, 2)
                and mass_entries[0].get("status", "").startswith("exact_ADM_Komar_integrated_energy_")
                and mass_entries[0].get("draft_path") == str(MASS_CONTRACT_PATH.relative_to(ROOT).as_posix())
                and mass_contract.get("integrated_energy_mass", {}).get("definition")
                    == "M_energy=(1/2)*integral_0^infinity r^2*rho(r) dr",
            "exact_factor": str(geometrized_energy_factor),
        },
        {
            "check": "inventory_authority_fail_closed",
            "passed": inventory.get("status") == "draft_unsealed_definition_review_no_implementation_or_execution_authority"
                and inventory.get("candidate_evaluated") is False
                and inventory.get("candidate_roots_created") is False
                and inventory.get("implementation_authorized") is False
                and inventory.get("execution_authorized") is False
                and inventory.get("authority_promoted") is False,
        },
    ])

    integrity_pass = all(bool(item["passed"]) for item in checks)
    disposition = (
        "RETURN_TO_VERSIONED_DEFINITION_REVIEW_BEFORE_IMPLEMENTATION"
        if integrity_pass and all(not item["bound"] for item in gaps)
        else "AUDIT_INTEGRITY_FAILURE"
    )
    report = {
        "schema": "nhm2.g2h_e_s4.definition_completeness_audit.v1",
        "candidate_evaluated": False,
        "candidate_roots_created": False,
        "checks": checks,
        "unbound_exact_definitions": gaps,
        "disposition": disposition,
        "implementation_authorized": False,
        "execution_authorized": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if disposition == "RETURN_TO_VERSIONED_DEFINITION_REVIEW_BEFORE_IMPLEMENTATION" else 1


if __name__ == "__main__":
    sys.exit(main())
