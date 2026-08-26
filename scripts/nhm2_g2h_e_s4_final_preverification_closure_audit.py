#!/usr/bin/env python3
"""Requirement-by-requirement G2H-E-S4 closure audit before repository gates."""
from __future__ import annotations
import hashlib, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research"
ROOTS = [ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary", ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"]
PROPOSAL = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-future-primary-execution-proposal.v1.json"
def digest(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def run_json(path: str) -> dict[str, object]:
    run = subprocess.run(["python", path], cwd=ROOT, check=False, capture_output=True, text=True)
    if run.returncode != 0: return {"status": "COMMAND_FAIL", "exit": run.returncode, "stdout": run.stdout, "stderr": run.stderr}
    try: return json.loads(run.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError): return {"status": "PARSE_FAIL", "stdout": run.stdout, "stderr": run.stderr}

checks: list[dict[str, object]] = []
def record(name: str, condition: bool, detail: object) -> None: checks.append({"name": name, "pass": bool(condition), "detail": detail})

frozen = {
    "selection_protocol": ("nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.md", "f2fec60d0211e8762bee1a1b282dfdf3e38c8ebdbdb220ec068a8b02f2ba6cb2"),
    "evidence_matrix": ("nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.json", "7f7b7ac889de82d52a2b6fc667e4b458d42ac833f350c91c5c48890266310d03"),
    "candidate_contract": ("nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json", "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a"),
    "regularity_disposition": ("nhm2-spherical-boson-star-v2-g2h-e-s3-r1-regularity-disposition.v1.json", "e86dcd1060c9e753c5fef3a8d4bfb21d974244b7fd108d6b669765389902ec0a"),
    "tolman_result": ("nhm2-spherical-boson-star-v2-g2h-e-s3-primary-result.v1.json", "4248b29a38588dc6c1b1a0c283bb78399eabd3d815376d0ddad3fd7e481392d7"),
    "r1_definition_seal": ("nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json", "728d8c9a807d27356a6d9f33e897feb73331abb12e6a76435dbce099d9c025ca"),
    "quantum_builder": ("nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json", "2989373624362e7f591ca0f00b76d1b01e2aa861f01eaf53f9b62c666f2862fc"),
}
for name, (relative, expected) in frozen.items():
    observed = digest(DOC / relative); record(f"frozen_{name}", observed == expected, observed)
contract = json.loads((DOC / frozen["candidate_contract"][0]).read_bytes())
selected_identity = {
    "scientific_identity": contract["scientific_identity"],
    "source_coordinate_exact_ingress": contract["frozen_member"]["source_coordinate_exact_ingress"],
}
record("selected_identity_exact", selected_identity["source_coordinate_exact_ingress"] == "6/5" and selected_identity["scientific_identity"] == "G2H_E_S3_R2_MINI_BOSON_STAR_SHAT0_6_5_SCALAR_HADAMARD_V1", selected_identity)

builds = [
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p08-r08-build-binding.v2.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p09-r09-build-binding.v3.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p10-r10-build-binding.v4.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p11-r11-build-binding.v5.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p12-r12-build-binding.v6.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p13-r13-build-binding.v7.json",
]
receipts = [
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p08-r08-runtime-verification-receipt.v8.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p09-r09-runtime-verification-receipt.v9.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p10-r10-runtime-verification-receipt.v10.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p11-r11-runtime-verification-receipt.v11.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p12-r12-runtime-verification-receipt.v12.json",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-p13-r13-runtime-verification-receipt.v13.json",
]
for group, names in (("build", builds), ("receipt", receipts)):
    for ordinal, name in enumerate(names, start=8):
        path = DOC / name; sidecar = path.with_suffix(".sha256").read_text("ascii").split()[0]
        record(f"{group}_P{ordinal:02d}_sidecar", digest(path) == sidecar, sidecar)

matrix_path = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json"
matrix = json.loads(matrix_path.read_bytes())
common = matrix["common_roles"]; primary = matrix["primary_cpp_arb_flint_gmp_mpfr_roles"]; rust = matrix["independent_pure_rust_roles"]
record("common_4_of_4", len(common) == 4 and all(role["primary"] == role["independent"] == "complete" for role in common), common)
record("primary_13_of_13", len(primary) == 13 and all(role["status"] == "complete" for role in primary), [role["id"] for role in primary])
record("independent_13_of_13", len(rust) == 13 and all(role["status"] == "complete" for role in rust), [role["id"] for role in rust])
record("fixture_classes_complete", all("not_covered" not in item["status"] and "predicate_covered_builder_not_covered" not in item["status"] for item in matrix["fixture_class_coverage"]), matrix["fixture_class_coverage"])
summary = matrix["promotion_summary"]
record("preverification_promotion_boundary", summary["all_required_roles_complete"] and not summary["S4_implementation_closure"] and not summary["inert_future_primary_proposal_allowed"], summary)
record("matrix_authority_false", not any(matrix["authority"].values()), matrix["authority"])

audits = {
    "selection_closure": "scripts/nhm2_g2h_e_s3_r2_closure_audit.py",
    "r1_definition_closure": "scripts/nhm2_g2h_e_s4_r1_definition_closure_audit.py",
    "quantum_total_definition": "scripts/nhm2_g2h_e_s4_r2_total_quantum_builder_definition_audit.py",
    "r2_definition_receipt": "scripts/nhm2_g2h_e_s4_r2_definition_closure_receipt_audit.py",
    "producer_completion": "scripts/nhm2_g2h_e_s4_producer_completion_audit.py",
    "p13_runtime": "scripts/nhm2_g2h_e_s4_p13_r13_runtime_audit.py",
    "p13_receipt": "scripts/nhm2_g2h_e_s4_p13_r13_receipt_audit.py",
}
for name, command in audits.items():
    report = run_json(command)
    passed = report.get("status") == "PASS" or (report.get("checks_passed") == report.get("checks_total") and report.get("checks_total", 0) > 0)
    record(f"audit_{name}", passed, {key: report.get(key) for key in ("schema", "status", "checks_passed", "checks_total")})

final_binding = json.loads((DOC / builds[-1]).read_bytes())
record("runtime_source_disjoint", all(final_binding["disjointness"].values()), final_binding["disjointness"])
record("final_binding_authority_false", not any(final_binding["authority"].values()), final_binding["authority"])
record("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
record("inert_proposal_absent_before_verification", not PROPOSAL.exists(), PROPOSAL.exists())
record("no_execution_or_samples", matrix["current_bound_evidence"]["candidate_evaluations"] == 0 and matrix["current_bound_evidence"]["positive_parameter_samples"] == 0 and not matrix["current_bound_evidence"]["candidate_roots_created"], matrix["current_bound_evidence"])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.final_preverification_closure_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "common_roles_complete": 4,
    "primary_roles_complete": 13,
    "independent_roles_complete": 13,
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "execution_authorized": False,
    "rust_scientific_execution_authorized": False,
    "authority_promoted": False,
    "S4_implementation_closure": False,
    "next_operation": "current-head math report/validation, required WARP tests and Casimir certificate verification",
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
