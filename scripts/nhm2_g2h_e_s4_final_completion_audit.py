#!/usr/bin/env python3
"""Final fail-closed audit for the G2H-E-S4 implementation/preexecution gate."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs" / "research"
checks: list[dict[str, object]] = []


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


frozen = {
    "r2_protocol": (
        DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.md",
        "f2fec60d0211e8762bee1a1b282dfdf3e38c8ebdbdb220ec068a8b02f2ba6cb2",
    ),
    "r2_matrix": (
        DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.json",
        "7f7b7ac889de82d52a2b6fc667e4b458d42ac833f350c91c5c48890266310d03",
    ),
    "r2_contract": (
        DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json",
        "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a",
    ),
    "r1_definition_seal": (
        DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json",
        "728d8c9a807d27356a6d9f33e897feb73331abb12e6a76435dbce099d9c025ca",
    ),
    "r2_quantum_builder": (
        DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json",
        "2989373624362e7f591ca0f00b76d1b01e2aa861f01eaf53f9b62c666f2862fc",
    ),
}
for name, (path, expected) in frozen.items():
    actual = sha(path)
    check(name, actual == expected, actual)

closure_path = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-final-closure-receipt.v1.json"
proposal_path = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-future-primary-execution-proposal.v1.json"
matrix_path = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json"
verification_path = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-current-head-verification-receipt.v1.json"

closure = json.loads(closure_path.read_text(encoding="utf-8"))
proposal = json.loads(proposal_path.read_text(encoding="utf-8"))
matrix = json.loads(matrix_path.read_text(encoding="utf-8"))
verification = json.loads(verification_path.read_text(encoding="utf-8"))

for name, path in {
    "closure_sidecar": closure_path,
    "proposal_sidecar": proposal_path,
    "verification_sidecar": verification_path,
}.items():
    sidecar = path.with_suffix(".sha256")
    token = sidecar.read_text(encoding="utf-8").split()[0]
    check(name, token == sha(path), {"expected": token, "actual": sha(path)})

promotion = matrix["promotion_summary"]
check(
    "role_completion",
    promotion == {
        "common_complete": 4,
        "common_required": 4,
        "primary_complete": 13,
        "primary_required": 13,
        "independent_complete": 13,
        "independent_required": 13,
        "all_required_roles_complete": True,
        "S4_implementation_closure": True,
        "inert_future_primary_proposal_allowed": True,
    },
    promotion,
)
check("selected_exact_6_5", "6/5" in proposal_path.read_text(encoding="utf-8"), "proposal binding")

future = proposal["future_execution_identity"]
unset = [
    "candidate_capable_source_sha256",
    "runtime_image_digest",
    "executable_sha256",
    "checkpoint_sha256",
    "exact_command",
    "environment_allowlist_sha256",
    "authorization_token",
    "authorization_record",
    "invocation_record",
    "result_record",
]
check("proposal_execution_identity_null", all(future[key] is None for key in unset), future)
check("proposal_inert", all(value is False for value in proposal["inertness"].values()), proposal["inertness"])

roots = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]
check("candidate_roots_absent", not any(path.exists() for path in roots), [path.exists() for path in roots])
check("closure_zero_execution", closure["execution_boundary"]["candidate_evaluations"] == 0 and closure["execution_boundary"]["positive_parameter_samples"] == 0, closure["execution_boundary"])
check("all_authority_false", not any(closure["authority"].values()) and not any(proposal["authority"].values()), {"closure": closure["authority"], "proposal": proposal["authority"]})

math_path = ROOT / verification["math"]["report_path"]
trace_path = ROOT / verification["casimir"]["training_trace_path"]
check("math_report_binding", sha(math_path) == verification["math"]["report_sha256"] and verification["math"]["registry_entries"] == 318 and verification["math"]["validation"] == "PASS", sha(math_path))
check("warp_gate", verification["warp"] == {"test_files_passed": 18, "test_files_total": 18, "tests_passed": 179, "tests_total": 179, "status": "PASS"}, verification["warp"])
check("casimir_gate", verification["casimir"]["verdict"] == "PASS" and verification["casimir"]["status"] == "GREEN" and verification["casimir"]["certificate_integrity_ok"] is True and sha(trace_path) == verification["casimir"]["training_trace_sha256"], verification["casimir"])

program = (DOC / "nhm2-spherical-boson-star-v2-work-program.md").read_text(encoding="utf-8")
umbrella = (DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-mini-boson-star-proof-implementation-preexecution.md").read_text(encoding="utf-8")
result = (DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-result.md").read_text(encoding="utf-8")
check("canonical_gate_handoff", "Active program gate: **G2H-E-S5" in program and "G2H-E-S4 — Mini-boson-star proof implementation and preexecution closure | closed:" in program, "S4 closed / S5 active")
check("closure_documented", "## Final S4 closure" in umbrella and "PASS_IMPLEMENTATION_PREEXECUTION_ONLY" in result, "umbrella and result")

for script, expected in [
    ("scripts/nhm2_g2h_e_s4_producer_completion_audit.py", (15, 15)),
    ("scripts/nhm2_g2h_e_s4_inert_primary_proposal_audit.py", (12, 12)),
    ("scripts/nhm2_g2h_e_s4_r2_definition_closure_receipt_audit.py", (13, 13)),
]:
    proc = subprocess.run([sys.executable, str(ROOT / script)], cwd=ROOT, capture_output=True, text=True)
    payload = json.loads(proc.stdout.strip().splitlines()[-1]) if proc.stdout.strip() else {}
    actual = (payload.get("checks_passed"), payload.get("checks_total"))
    check(Path(script).stem, proc.returncode == 0 and payload.get("status") == "PASS" and actual == expected, actual)

passed = sum(1 for item in checks if item["pass"])
output = {
    "schema": "nhm2.g2h_e_s4.final_completion_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "candidate_evaluations": 0,
    "candidate_roots_created": False,
    "execution_authorized": False,
    "authority_promoted": False,
    "meaning": "PASS closes implementation/preexecution only; it is not candidate proof or execution authority",
    "checks": checks,
}
print(json.dumps(output, separators=(",", ":"), sort_keys=True))
raise SystemExit(0 if passed == len(checks) else 1)
