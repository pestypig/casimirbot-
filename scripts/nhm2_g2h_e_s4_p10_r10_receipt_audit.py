#!/usr/bin/env python3
"""Audit the immutable fixture-only P10/R10 verification receipt."""
from __future__ import annotations
import hashlib, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p10-r10-runtime-verification-receipt.v10.json"
PATHS = {
    "quantum_builder": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json",
    "p09_r09_build": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p09-r09-build-binding.v3.json",
    "p10_r10_build": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p10-r10-build-binding.v4.json",
    "matrix": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json",
}
ROOTS = [ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary", ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"]
def digest(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
receipt = json.loads(RECEIPT.read_bytes()); checks: list[dict[str, object]] = []
def record(name: str, condition: bool, detail: object) -> None: checks.append({"name": name, "pass": bool(condition), "detail": detail})
sidecar = RECEIPT.with_suffix(".sha256").read_text("ascii").split()[0]
record("receipt_sidecar", digest(RECEIPT) == sidecar, sidecar)
record("status_fixture_only", receipt["status"] == "PASS_FIXTURE_ONLY_10_OF_13_PER_LANE_NO_SCIENTIFIC_EXECUTION_AUTHORITY", receipt["status"])
for name, path in PATHS.items():
    observed = digest(path); record(f"binding_{name}", observed == receipt["bindings"][name], observed)
for name in ("runtime_audit", "completion_audit"):
    item = receipt[name]; observed = digest(ROOT / item["path"]); record(name, observed == item["raw_sha256"], observed)
for name, image_name in (("primary", "nhm2-g2h-s4-primary-fixture:v4"), ("independent", "nhm2-g2h-s4-independent-fixture:v4")):
    observed = subprocess.run(["docker", "image", "inspect", image_name, "--format", "{{.Id}}"], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()
    record(f"{name}_image", observed == receipt[name]["image_id"], observed)
promotion = receipt["promotion"]
record("promotion_fail_closed", promotion["primary_complete"] == 10 and promotion["independent_complete"] == 10 and not promotion["S4_complete"] and not promotion["inert_future_primary_proposal_allowed"], promotion)
guard = receipt["guard_evidence"]
record("guard_zero", guard["candidate_evaluations"] == 0 and guard["positive_parameter_samples"] == 0 and not guard["candidate_roots_created"] and not guard["scientific_builder_executed"], guard)
record("roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
record("authority_false", not any(receipt["authority"].values()), receipt["authority"])
passed = sum(item["pass"] is True for item in checks)
report = {"schema": "nhm2.g2h_e_s4.p10_r10_receipt_audit.v1", "status": "PASS" if passed == len(checks) else "FAIL", "checks_passed": passed, "checks_total": len(checks), "checks": checks, "candidate_evaluations": 0, "candidate_roots_created": False, "execution_authorized": False, "authority_promoted": False, "S4_implementation_closure": False}
print(json.dumps(report, sort_keys=True, separators=(",", ":"))); raise SystemExit(0 if report["status"] == "PASS" else 1)
