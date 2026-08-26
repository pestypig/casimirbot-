#!/usr/bin/env python3
"""Audit the sealed S4-R2 definition closure receipt without candidate ingress."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-definition-closure-receipt.v1.json"
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json"
SIDECAR = CONTRACT.with_suffix(".sha256")
ROOTS = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


receipt = json.loads(RECEIPT.read_bytes())
contract = json.loads(CONTRACT.read_bytes())
checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


contract_hash = digest(CONTRACT)
check("receipt_status", receipt["status"].startswith("PASS_SEALED_FIXTURE_IMPLEMENTATION_ELIGIBLE"), receipt["status"])
check("contract_hash", receipt["sealed_contract"]["raw_sha256"] == contract_hash, contract_hash)
check("contract_sidecar", SIDECAR.read_text(encoding="ascii").split()[0] == contract_hash, SIDECAR.read_text(encoding="ascii").strip())
check("contract_status", contract["status"].startswith("sealed_additive_candidate_neutral"), contract["status"])
for index, audit in enumerate(receipt["audits"]):
    observed = digest(ROOT / audit["path"])
    check(f"audit_{index}_hash", observed == audit["raw_sha256"], observed)
    check(f"audit_{index}_pass", audit["result"].startswith("PASS_"), audit["result"])
check("twelve_gaps", receipt["replayed_facts"]["hard_gap_classes_closed"] == 12 and receipt["replayed_facts"]["quantum_roles_total"] == 12, receipt["replayed_facts"])
check("zero_ingress", receipt["replayed_facts"]["candidate_evaluations"] == 0 and receipt["replayed_facts"]["positive_parameter_samples"] == 0, receipt["replayed_facts"])
check("roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
check("scientific_execution_locked", receipt["readiness"]["fixture_implementation_eligible"] is True and receipt["readiness"]["scientific_execution_eligible"] is False and receipt["readiness"]["candidate_execution_authorized"] is False, receipt["readiness"])
check("authority_false", not any(receipt["authority"].values()) and not any(contract["authority"].values()), {"receipt": receipt["authority"], "contract": contract["authority"]})

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4_r2.definition_closure_receipt_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "meaning": "PASS closes definition repair only and permits fixture source implementation; it grants no scientific execution or quantum authority",
    "receipt_raw_sha256": digest(RECEIPT),
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "execution_authorized": False,
    "authority_promoted": False,
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
