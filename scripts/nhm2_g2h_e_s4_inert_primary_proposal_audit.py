#!/usr/bin/env python3
"""Audit the sole G2H-E-S4 proposal as inert, root-free and authority-neutral."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research"
PROPOSAL = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-future-primary-execution-proposal.v1.json"
CLOSURE = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-final-closure-receipt.v1.json"
MATRIX = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json"
ROOTS = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

checks: list[dict[str, object]] = []
def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})

proposal = json.loads(PROPOSAL.read_bytes())
closure = json.loads(CLOSURE.read_bytes())
matrix = json.loads(MATRIX.read_bytes())
sidecar = PROPOSAL.with_suffix(".sha256").read_text("ascii").split()[0]

check("sole_versioned_proposal", len(list(DOC.glob("nhm2-spherical-boson-star-v2-g2h-e-s4-future-primary-execution-proposal.v*.json"))) == 1, PROPOSAL.name)
check("proposal_sidecar", digest(PROPOSAL) == sidecar, sidecar)
check("closure_binding", proposal["closure_binding"]["final_closure_receipt_sha256"] == digest(CLOSURE) == "539a4ac5f8ea605abbf05e34802fc4f407e106b3d6555c1928389eefc58ca191", digest(CLOSURE))
check("matrix_binding", proposal["closure_binding"]["producer_completion_matrix_sha256"] == digest(MATRIX) == "6e5a0119a1a5c41d3c0cb764463c3fe09ddfecae8ba3c2800de0c1d100956ede", digest(MATRIX))
check("closure_pass_only", closure["status"] == "PASS_IMPLEMENTATION_PREEXECUTION_ONLY" and not closure["authority"]["receipt_is_mathematical_proof"], closure["status"])
check("matrix_eligible_only", matrix["promotion_summary"]["S4_implementation_closure"] is True and matrix["promotion_summary"]["inert_future_primary_proposal_allowed"] is True, matrix["promotion_summary"])
future = proposal["future_execution_identity"]
check("future_execution_identity_unset", all(future[key] is None for key in ("candidate_capable_source_sha256", "runtime_image_digest", "executable_sha256", "checkpoint_sha256", "exact_command", "environment_allowlist_sha256", "authorization_token", "authorization_record", "invocation_record", "result_record")), future)
check("proposal_inert", proposal["status"] == "INERT_NOT_AUTHORIZATION_NOT_EXECUTION_READY" and not proposal["inertness"]["is_authorization"] and not proposal["inertness"]["may_be_executed_as_written"] and not proposal["inertness"]["token_created"] and not proposal["inertness"]["candidate_root_created"], proposal["inertness"])
check("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
rust = proposal["independent_rust_boundary"]
check("rust_separately_locked", not rust["proposal_created"] and rust["authorization_token"] is None and not rust["execution_authorized"] and not rust["scientific_execution_performed"] and rust["separate_later_decision_required"], rust)
check("authority_false", not any(proposal["authority"].values()) and not any(matrix["authority"].values()), {"proposal": proposal["authority"], "matrix": matrix["authority"]})
check("no_execution_or_sampling", closure["execution_boundary"]["candidate_evaluations"] == 0 and closure["execution_boundary"]["positive_parameter_samples"] == 0 and not closure["execution_boundary"]["G3_started"], closure["execution_boundary"])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.inert_primary_proposal_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "authorization_token_created": False,
    "execution_authorized": False,
    "rust_scientific_execution_authorized": False,
    "authority_promoted": False,
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
