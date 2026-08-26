#!/usr/bin/env python3
"""Independent read-only audit of the frozen G2H-E-S decision packet."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs/research"
PROPOSAL = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-r1-successor-proposal.v1.json"
DECISION = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s-authorization-decision.v1.json"
WORK_PROGRAM = DOCS / "nhm2-spherical-boson-star-v2-work-program.md"
PROPOSAL_SHA256 = "65093d0084a513b101172e339123ecb2839cd76ef4350c6a351acdf054dbcfdd"
DECISION_SHA256 = "4a77e9f693bddbe2228ea42204ae419af14c0e76f885f7fba137290d50f1b666"
EXACT_STATEMENT = (
    "I authorize exactly one G2H-E-S primary-v2 Tolman-VII execution under proposal "
    "SHA-256 65093d0084a513b101172e339123ecb2839cd76ef4350c6a351acdf054dbcfdd "
    "using token ec667713a193b0b70e79d851f279e53ab945ccdfc749135fbe5ee1b098f3dd09 "
    "and the frozen checkpoint command. I understand that PASS, FAIL, or partial output "
    "becomes immutable evidence and there will be no retry, retune, deletion, or alternate "
    "output root. I do not authorize the independent Rust execution at this time."
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sidecar_matches(path: Path) -> bool:
    return path.with_suffix(".sha256").read_text(encoding="ascii").split()[0] == sha256(path)


def main() -> int:
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    decision = json.loads(DECISION.read_text(encoding="utf-8"))
    checks = [
        ("proposal_identity", sha256(PROPOSAL) == PROPOSAL_SHA256 and sidecar_matches(PROPOSAL)),
        ("decision_identity", sha256(DECISION) == DECISION_SHA256 and sidecar_matches(DECISION)),
        ("decision_binds_proposal", decision["proposal_sha256"] == PROPOSAL_SHA256),
        ("exact_statement_frozen", decision["exact_user_authorization_statement"] == EXACT_STATEMENT),
        ("checkpoint_binding_agrees",
         decision["checkpoint_sha256"] == proposal["checkpoint"]["sha256"]
         and decision["checkpoint_command"] == proposal["checkpoint"]["command"]),
        ("runtime_binding_agrees",
         decision["primary_image_id"] == proposal["primary_image_id"]
         and decision["primary_executable_sha256"] == proposal["primary_executable_sha256"]),
        ("authorization_still_required",
         decision["decision"] == "READY_FOR_SEPARATE_EXACT_USER_AUTHORIZATION"
         and decision["separate_user_authorization_required"] is True
         and decision["authorization_record_absent"] is True),
        ("all_authority_false",
         all(value is False for key, value in decision["authority"].items()
             if key != "candidate_evaluations")
         and decision["authority"]["candidate_evaluations"] == 0),
        ("future_evidence_absent",
         not (ROOT / decision["future_authorization_path"]).exists()
         and not (ROOT / decision["future_output_root"]).exists()
         and decision["future_evidence_absent"] is True),
        ("independent_ineligible", decision["independent_lane_ineligible"] is True
         and decision["authority"]["independent_execution_authorized"] is False),
        ("active_gate_consistent",
         "Active program gate: **G2H-E-S — versioned primary successor authorization decision**"
         in WORK_PROGRAM.read_text(encoding="utf-8")),
    ]
    container = subprocess.run(
        ["docker", "container", "inspect", decision["future_container"]],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
    )
    checks.append(("future_container_absent", container.returncode != 0))

    for name, passed in checks:
        print(f"{'PASS' if passed else 'FAIL'} {name}")
    passed_count = sum(passed for _, passed in checks)
    print(f"SUMMARY {passed_count}/{len(checks)}")
    return 0 if passed_count == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
