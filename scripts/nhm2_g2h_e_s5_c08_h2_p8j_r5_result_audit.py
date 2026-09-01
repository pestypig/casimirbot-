#!/usr/bin/env python3
"""Static independent audit of the P8J-R5 cloud preexecution quota stop."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r5-c4-capacity-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r5-cloud-preexecution-result.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r5-result-v1-20260831/h2-p8j-r5-result-audit.v1.json"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    checks: dict[str, bool] = {}

    def exact(name: str, path: pathlib.Path, size: int, sha: str) -> None:
        checks[f"{name}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{name}_bytes"] = checks[f"{name}_regular"] and path.stat().st_size == size
        checks[f"{name}_sha256"] = checks[f"{name}_regular"] and digest(path) == sha

    exact("proposal", PROPOSAL, 7207, "bc883b8f6763987a1e7f4fc4744335aad7c633cef6de36bd33d6cf0961ae06ea")
    exact("result", RESULT, 4088, "0e8534f618aea8b09a75f26400668c0d79378a7ecf64aecee2ecbee01c7dfa0c")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")

    text = RESULT.read_text(encoding="utf-8")
    checks["metadata_complete"] = all(
        f"{field}:" in text
        for field in (
            "Program gate", "Workstream", "Capability or component", "Current maturity",
            "Target maturity", "Required frozen inputs", "Required evidence", "Stop/fail criteria",
            "Explicit non-goals", "Downstream gate unlocked",
        )
    )
    checks["terminal_classification"] = "BLOCKED_PREEXECUTION_C4_FAMILY_QUOTA / R5 EXHAUSTED" in text
    checks["operation_exact"] = "operation-1788223864323-65a6150363ded-20ec0738-1f295ce4" in text
    checks["operation_insert_done"] = "operationType: insert" in text and "status: DONE" in text
    checks["http_403"] = "httpErrorStatusCode: 403" in text and "httpErrorMessage: FORBIDDEN" in text
    checks["error_code_exact"] = "code: QUOTA_EXCEEDED" in text
    checks["family_exact"] = "vm_family: C4" in text and "region: us-central1" in text
    checks["quota_metric_exact"] = "compute.googleapis.com/cpus_per_vm_family" in text
    checks["quota_limit_exact"] = "CPUS-PER-VM-FAMILY-per-project-region" in text and "limit: 24.0" in text
    checks["timestamps_exact"] = all(x in text for x in ("2026-08-31T17:51:05.473-07:00", "2026-08-31T17:51:16.820-07:00"))
    checks["vm_absence"] = "resource not found for the exact\nR5 VM" in text
    checks["no_disk"] = "No VM, disk," in text
    checks["no_billable_runtime"] = "billable runtime" in text
    checks["no_build"] = "Docker installation, build, fixture" in text
    checks["no_scientific_process"] = "representative process" in text and "No scientific\nexecutable ran" in text
    checks["provisioning_not_science"] = "provisioning\nconstraint, not a scientific or mathematical result" in text
    checks["no_automatic_successor"] = "unlocks no automatic retry" in text
    checks["candidate_activity_zero"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r5_result_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "proposal_sha256": "bc883b8f6763987a1e7f4fc4744335aad7c633cef6de36bd33d6cf0961ae06ea",
        "result_sha256": "0e8534f618aea8b09a75f26400668c0d79378a7ecf64aecee2ecbee01c7dfa0c",
        "classification": "BLOCKED_PREEXECUTION_C4_FAMILY_QUOTA",
        "operation": "operation-1788223864323-65a6150363ded-20ec0738-1f295ce4",
        "vm_created": False,
        "disk_created": False,
        "numerical_process_started": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "authority_promoted": False,
        "checks": checks,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{passed}/{len(checks)} {receipt['status']}")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
