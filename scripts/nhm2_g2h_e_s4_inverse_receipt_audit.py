#!/usr/bin/env python3
"""Verify the versioned P02/P03/R02/R03 closure receipt at its bound snapshot."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-inverse-runtime-verification-receipt.v5.json"


def identity(path: Path) -> dict[str, object]:
    raw = path.read_bytes()
    return {"bytes": len(raw), "raw_sha256": hashlib.sha256(raw).hexdigest()}


receipt = json.loads(RECEIPT.read_bytes())
checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


sidecar = RECEIPT.with_suffix(".sha256").read_text("ascii").split()[0]
check("receipt_sidecar", identity(RECEIPT)["raw_sha256"] == sidecar, sidecar)
check(
    "receipt_status",
    receipt["status"] == "PASS_P02_P03_R02_R03_INVERSE_KERNELS_REMAINING_SCIENTIFIC_PRODUCERS_INCOMPLETE",
    receipt["status"],
)
paths = {
    "manifest": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-fixture-build-bindings.v1.json",
    "completion_matrix": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json",
    "runtime_audit": ROOT / "scripts/nhm2_g2h_e_s4_fixture_runtime_audit.py",
    "completion_audit": ROOT / "scripts/nhm2_g2h_e_s4_producer_completion_audit.py",
    "arithmetic_audit": ROOT / "scripts/nhm2_g2h_e_s4_arithmetic_kernel_audit.py",
    "inverse_audit": ROOT / "scripts/nhm2_g2h_e_s4_inverse_kernel_audit.py",
    "canonical_work_program": ROOT / "docs/research/nhm2-spherical-boson-star-v2-work-program.md",
    "active_packet": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-mini-boson-star-proof-implementation-preexecution.md",
}
for name, path in paths.items():
    observed = identity(path)
    check(f"binding_{name}", observed == receipt["bindings"][name], observed)

inverse = json.loads(subprocess.run(
    [sys.executable, str(paths["inverse_audit"])], cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)
check(
    "inverse_audit",
    inverse["status"] == "PASS" and inverse["checks_passed"] == inverse["checks_total"] == 19,
    [inverse["status"], inverse["checks_passed"], inverse["checks_total"]],
)
matrix = json.loads(paths["completion_matrix"].read_bytes())
check(
    "fail_closed",
    matrix["promotion_summary"]["primary_complete"] == 3
    and matrix["promotion_summary"]["independent_complete"] == 3
    and matrix["promotion_summary"]["S4_implementation_closure"] is False
    and matrix["promotion_summary"]["inert_future_primary_proposal_allowed"] is False,
    matrix["promotion_summary"],
)
check("authority_locked", not any(receipt["authority"].values()), receipt["authority"])
roots = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]
check("candidate_roots_absent", not any(path.exists() for path in roots), [path.exists() for path in roots])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.inverse_receipt_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "S4_implementation_closure": False,
    "candidate_evaluations": 0,
    "candidate_roots_created": False,
    "execution_authorized": False,
    "authority_promoted": False,
    "next_role": "P04/P05 then R04/R05 continuation builders",
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
