#!/usr/bin/env python3
"""Static independent audit for the candidate-neutral P8J-R3 zone successor."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r2-cloud-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r3-zone-capacity-successor-proposal.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
P8J_AUDIT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8j_result_audit.py"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v1.sh"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r3-zone-successor-preflight-v1-20260831/h2-p8j-r3-zone-successor-audit.v1.json"


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    checks: dict[str, bool] = {}

    def exact(name: str, path: pathlib.Path, size: int, digest: str) -> None:
        checks[f"{name}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{name}_bytes"] = checks[f"{name}_regular"] and path.stat().st_size == size
        checks[f"{name}_sha256"] = checks[f"{name}_regular"] and sha256(path) == digest

    exact("r2_result", RESULT, 3635, "72b914b83ae405843a1db42723b35f0ec001f4f31c262c0246bdf7e7a2cf1bae")
    exact("r3_proposal", PROPOSAL, 5151, "7e82bd863eb21afed2739c7fee2fe702f44ac13a4c69baf65699f86bc96cc34b")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")
    exact("p8j_audit", P8J_AUDIT, 10138, "5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2")
    exact("controller", CONTROLLER, 5857, "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6")

    result = RESULT.read_text(encoding="utf-8")
    proposal = PROPOSAL.read_text(encoding="utf-8")
    checks["r2_classification_exact"] = "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R2 EXHAUSTED" in result
    checks["r2_vm_absence_bound"] = "P8J_R2_NO_VM_CREATED" in result and "no\nVM, disk" in result
    checks["r2_no_scientific_execution"] = "No scientific executable ran" in result
    checks["r3_zone_only"] = "zone: `us-central1-a` -> `us-central1-b`" in proposal
    checks["r3_name_only"] = "nhm2-h2-p8j-r3-n2-32-20260831" in proposal
    checks["r3_machine_exact"] = "exactly one temporary on-demand `n2-standard-32`" in proposal
    checks["r3_image_exact"] = "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" in proposal
    checks["r3_disk_exact"] = "exactly 30 GB `pd-balanced`" in proposal
    checks["r3_no_upload"] = "No upload, replacement, rename, move or deletion is permitted" in proposal
    checks["r3_single_creation"] = "exactly one R3 creation attempt" in proposal
    checks["r3_failure_terminal"] = "If creation fails, R3 is terminal" in proposal
    checks["r3_no_retry"] = "There is no\nretry, fallback, retune, resource substitution" in proposal
    checks["r3_one_process"] = "starting exactly one no-network" in proposal
    checks["r3_timeout_bound"] = "`86,400` seconds" in proposal and "`90,000` seconds" in proposal
    checks["r3_cost_bound"] = "`$40.00`" in proposal
    checks["r3_binary_bound"] = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6" in proposal
    checks["r3_fixture_bound"] = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2" in proposal
    checks["r3_authority_locked"] = "authority remain false" in proposal

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r3_zone_successor_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "r2_result_sha256": "72b914b83ae405843a1db42723b35f0ec001f4f31c262c0246bdf7e7a2cf1bae",
        "r3_proposal_sha256": "7e82bd863eb21afed2739c7fee2fe702f44ac13a4c69baf65699f86bc96cc34b",
        "r3_cloud_action_performed": False,
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
