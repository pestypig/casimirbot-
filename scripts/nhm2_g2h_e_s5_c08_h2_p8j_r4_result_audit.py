#!/usr/bin/env python3
"""Static independent audit of the P8J-R4 cloud preexecution stop."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r4-region-capacity-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r4-cloud-preexecution-result.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r4-result-v1-20260831/h2-p8j-r4-result-audit.v1.json"


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

    exact("proposal", PROPOSAL, 6462, "2510cae2367a1f7b71fa3813d7b9d616d29983993017a3fdeac24aeec8c23d9f")
    exact("result", RESULT, 3760, "9c368edd093e3a44696ff85c9ce73a1a32bceb60f95b58a179d254a740839fbe")
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
    checks["terminal_classification"] = "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R4 EXHAUSTED" in text
    checks["operation_exact"] = "operation-1788220914081-65a60a05d1d9a-15dcfdd8-56b86984" in text
    checks["operation_insert_done"] = "operationType: insert" in text and "status: DONE" in text
    checks["http_503"] = "httpErrorStatusCode: 503" in text
    checks["error_code_exact"] = "code: ZONE_RESOURCE_POOL_EXHAUSTED" in text
    checks["zone_exact"] = "zone: us-east1-b" in text
    checks["timestamp_exact"] = "2026-08-31T17:01:57.300-07:00" in text
    checks["vm_absence"] = "P8J_R4_VM_ABSENT" in text
    checks["no_disk"] = "No VM, disk," in text
    checks["no_billable_runtime"] = "billable runtime" in text
    checks["no_build"] = "Docker installation, build, fixture" in text
    checks["no_scientific_process"] = "representative process" in text and "No scientific\nexecutable ran" in text
    checks["three_zones_two_regions"] = all(x in text for x in ("us-central1-a", "us-central1-b", "us-east1-b", "spans two regions"))
    checks["no_automatic_successor"] = "unlocks no automatic fourth cloud successor" in text
    checks["candidate_activity_zero"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r4_result_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "proposal_sha256": "2510cae2367a1f7b71fa3813d7b9d616d29983993017a3fdeac24aeec8c23d9f",
        "result_sha256": "9c368edd093e3a44696ff85c9ce73a1a32bceb60f95b58a179d254a740839fbe",
        "classification": "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED",
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
