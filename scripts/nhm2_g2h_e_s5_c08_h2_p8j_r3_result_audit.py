#!/usr/bin/env python3
"""Static independent audit of the P8J-R3 cloud preexecution stop."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r3-zone-capacity-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r3-cloud-preexecution-result.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r3-result-v1-20260831/h2-p8j-r3-result-audit.v1.json"


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

    exact("proposal", PROPOSAL, 5151, "7e82bd863eb21afed2739c7fee2fe702f44ac13a4c69baf65699f86bc96cc34b")
    exact("result", RESULT, 3471, "21dafa88f5ae9e783c689fdfe021afc5e399f231528056433e8c27e247d46dd7")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")

    text = RESULT.read_text(encoding="utf-8")
    checks["terminal_classification"] = "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R3 EXHAUSTED" in text
    checks["error_code_exact"] = "code: ZONE_RESOURCE_POOL_EXHAUSTED" in text
    checks["zone_exact"] = "zone: us-central1-b" in text
    checks["machine_exact"] = "vmType: n2-standard-32" in text
    checks["reason_exact"] = "reason: resource_availability" in text
    checks["vm_absence"] = "P8J_R3_NO_VM_CREATED" in text
    checks["no_disk"] = "No VM, disk," in text
    checks["no_billable_runtime"] = "billable runtime" in text
    checks["no_build"] = "Docker installation, build, fixture" in text
    checks["no_scientific_process"] = "representative process" in text and "No scientific\nexecutable ran" in text
    checks["no_automatic_successor"] = "unlocks no\nautomatic third cloud successor" in text
    checks["candidate_activity_zero"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r3_result_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "proposal_sha256": "7e82bd863eb21afed2739c7fee2fe702f44ac13a4c69baf65699f86bc96cc34b",
        "result_sha256": "21dafa88f5ae9e783c689fdfe021afc5e399f231528056433e8c27e247d46dd7",
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
