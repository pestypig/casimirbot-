#!/usr/bin/env python3
"""Audit the candidate-neutral H2-P8J-R14 stopped-disk rescue definition."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r14-stopped-disk-rescue.md"
RESCUE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_r14_stopped_disk_rescue_v1.sh"
ORCHESTRATOR = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_r14_cloudshell_rescue_orchestrator_v1.sh"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    doc = DOC.read_text(encoding="utf-8")
    rescue = RESCUE.read_text(encoding="utf-8")
    orchestrator = ORCHESTRATOR.read_text(encoding="utf-8")
    rescue_sha = sha(RESCUE)
    orchestrator_sha = sha(ORCHESTRATOR)
    checks = {
        "packet_header_complete": all(key in doc for key in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        )),
        "rescue_identity_bound": RESCUE.stat().st_size == 2682
        and rescue_sha == "c68a29d0645c6c5400ea0b31c144499711ee7d63784933e11681cc94a89f97f2"
        and rescue_sha in doc,
        "orchestrator_identity_bound": ORCHESTRATOR.stat().st_size == 5388
        and orchestrator_sha == "a51925a4d046d526d452079c15a7450ca36c48c93ee04b6636b989a5b97058b3"
        and orchestrator_sha in doc,
        "original_source_protected": "status']=='TERMINATED'" in orchestrator
        and "instances start" not in orchestrator
        and "neither it nor its source\ndisk may be restarted or modified" in doc,
        "resources_exact": all(value in orchestrator for value in (
            "nhm2-h2-p8j-r13-evidence-snapshot-20260901",
            "nhm2-h2-p8j-r13-evidence-clone-20260901",
            "nhm2-h2-p8j-r14-rescue-e2-small-20260901",
            "--machine-type=e2-small", "--boot-disk-size=10GB",
            "--boot-disk-type=pd-standard", "--max-run-duration=3600s",
        )),
        "boot_before_readonly_attach": orchestrator.index("instances create")
        < orchestrator.index("disks create") < orchestrator.index("attach-disk")
        and "--mode=ro" in orchestrator,
        "guest_readonly_guard": all(value in rescue for value in (
            "blockdev --getro", "mount -o ro,noload", "mount -o ro,norecovery",
            "findmnt -no OPTIONS", "grep -qx ro",
        )),
        "single_filesystem_guard": "${#PARTS[@]}" in rescue
        and "== 1" in rescue and "findmnt -rn -S" in rescue,
        "bounded_evidence_inventory": all(value in rescue for value in (
            "nhm2-h2-p8j-evidence-v1", "nhm2-h2-p8j-evidence-export-v1.tgz",
            "p8j-fixture-build.txt", "p8j-target-build.txt",
            "h2_p8j_cloud_run_v2.sh", "nhm2-h2-p8j-r13.service",
        )),
        "deterministic_archive": all(value in rescue for value in (
            "--sort=name", "--mtime='UTC 2026-09-01'", "--owner=0",
            "--group=0", "--numeric-owner", "sha256sum",
        )),
        "helper_stop_on_all_paths": "trap cleanup EXIT" in orchestrator
        and "instances stop" in orchestrator and "HELPER_CREATED" in orchestrator,
        "retrieval_hash_verified": "recovered-archive.sha256.txt" in orchestrator
        and "stat -c %s" in orchestrator and "sha256sum" in orchestrator,
        "authority_locked": all(value in doc for value in (
            "authorizes no deletion", "numerical execution", "candidate evaluation",
            "physical, propulsion, or transport authority promotion",
        )),
    }
    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r14_stopped_disk_rescue_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "rescue_sha256": rescue_sha,
        "orchestrator_sha256": orchestrator_sha,
        "proposal_sha256": sha(DOC),
        "candidate_evaluations": 0,
        "numerical_executions": 0,
        "authority_promoted": False,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
