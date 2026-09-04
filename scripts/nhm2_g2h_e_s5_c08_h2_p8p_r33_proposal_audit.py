#!/usr/bin/env python3
"""Audit the P8P-R33 no-space archive transport proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r33-no-space-archive-transport-proposal.md"
R32 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r32-upload-result.md"
FIXTURE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r31_local_image_binding_fixture_v1.sh"
GUEST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r32_fresh_vm_binding_guest_v1.sh"
OUT_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r33-proposal-v1-20260904"
OUT = OUT_DIR / "h2-p8p-r33-proposal-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    p = PACKET.read_text(encoding="utf-8")
    checks = {
        "header": p.startswith("Program gate:") and p.splitlines()[9].startswith("Downstream gate unlocked:"),
        "r32_result": sha256(R32) == "19105e7be61a4bf800f71a4fb8d83ae2f16c0602ea90e7043e5bebb794fbce4c",
        "fixture_unchanged": sha256(FIXTURE) == "97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79",
        "wrapper_unchanged": sha256(GUEST) == "f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19",
        "exact_vm": "nhm2-h2-p8p-r32-e2-4-20260904" in p and "1893159507643031574" in p,
        "exact_zone_disk": "`us-east1-b`" in p and "30 GB" in p and "`pd-standard`" in p,
        "no_space_path": "`C:\\NHM2-R33\\p8p.tar`" in p,
        "hard_link_only": "same-volume hard link" in p and "same NTFS data" in p,
        "archive_identity": "236,640,768-byte" in p and "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5" in p,
        "partial_files_reauthenticated": "4,024-byte" in p and "3,129-byte" in p,
        "archive_absent_before_scp": "require the target archive absent" in p,
        "one_scp": "Exactly\none SCP" in p or "Exactly one SCP" in p,
        "one_wrapper_execution": "invoke the unchanged wrapper exactly once" in p,
        "one_restart": "exactly one restart" in p,
        "cost_runtime": "3,600-second" in p and "`$1.00`" in p,
        "first_failure": "First\nfailure is terminal" in p or "First failure is terminal" in p,
        "no_new_resource": "new VM/disk" in p and "No R33 resource" in p,
        "no_numerical_work": "P=1024 or P=65,536 execution" in p,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in p,
        "authority_false": "all authority remains false" in p,
    }
    failed = [k for k, v in checks.items() if not v]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r33_proposal_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()), "checks_total": len(checks),
        "checks": checks, "failed": failed, "proposal_sha256": sha256(PACKET),
        "cloud_actions": 0, "numerical_runs": 0, "candidate_evaluated": False,
        "authority_promoted": False,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(OUT)); print(payload["proposal_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
