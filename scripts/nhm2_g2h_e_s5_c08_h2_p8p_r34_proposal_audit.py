#!/usr/bin/env python3
"""Audit the frozen P8P-R34 extended-path hard-link proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r34-extended-path-hardlink-proposal.md"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r34-extended-path-proposal-v1-20260904/h2-p8p-r34-proposal-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = PROPOSAL.read_text(encoding="utf-8")
    checks = {
        "header": text.startswith("Program gate:") and text.splitlines()[9].startswith("Downstream gate unlocked:"),
        "inert": "FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED" in text,
        "r33_boundary": "exact 260-character legacy\nWindows boundary" in text,
        "extended_path": "extended-length `\\\\?\\C:\\...` representation" in text,
        "one_hardlink": "creates exactly one same-volume\nhard link" in text,
        "no_copy_fallback": "No copy fallback is permitted" in text,
        "archive_identity": "236,640,768 bytes" in text and "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5" in text,
        "vm_identity": "1893159507643031574" in text and "us-east1-b" in text,
        "disk_shape": "30 GB `pd-standard` disk unchanged" in text,
        "fixture_identity": "97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79" in text,
        "wrapper_identity": "f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19" in text,
        "one_restart": "exactly one restart and one 120-second wait" in text,
        "one_scp": "Exactly one SCP" in text,
        "one_wrapper": "invoke the unchanged R32 wrapper exactly once" in text,
        "ceilings": "3,600-second aggregate restart ceiling" in text and "`$1.00` total ceiling" in text,
        "first_failure": "first\nfailure" in text,
        "no_numerical": "It permits no\nnumerical execution" in text,
        "no_candidate": "candidate data" in text and "frozen-candidate evaluation" in text,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
        "authority_false": "authority remains false" in text,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r34_proposal_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "proposal_sha256": sha256(PROPOSAL),
        "cloud_actions": 0,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(OUT))
    print(payload["proposal_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
