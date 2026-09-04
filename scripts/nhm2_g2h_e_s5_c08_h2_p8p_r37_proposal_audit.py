#!/usr/bin/env python3
"""Audit the frozen P8P-R37 newline-free controller proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r37-single-line-controller-proposal.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r37_single_line_controller_v1.ps1"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r37-single-line-proposal-v1-20260904/h2-p8p-r37-proposal-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = PROPOSAL.read_text(encoding="utf-8")
    controller = CONTROLLER.read_text(encoding="utf-8")
    guard_line = next(line for line in controller.splitlines() if line.startswith("$guard = "))
    handoff_line = next(line for line in controller.splitlines() if line.startswith("$handoff = "))
    checks = {
        "header": text.startswith("Program gate:") and text.splitlines()[9].startswith("Downstream gate unlocked:"),
        "inert": "FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED" in text,
        "r36_bound": "R36 proved that Windows gcloud/PuTTY transformed" in text,
        "controller_bytes": CONTROLLER.stat().st_size == 7_701,
        "controller_hash": sha256(CONTROLLER) == "dd93e4a5be713770bd96e5bc9d4f8890586134b66d41144bdb95d1ee67ee6b6c",
        "literal_single_lines": "`r" not in guard_line and "`n" not in guard_line and "`r" not in handoff_line and "`n" not in handoff_line,
        "runtime_newline_guard": "remote command contains newline" in controller,
        "one_start": controller.count("'compute','instances','start'") == 1,
        "two_role_ssh": controller.count("'compute','ssh'") == 2,
        "one_scp": controller.count("'compute','scp'") == 1,
        "one_cleanup_stop": controller.count("'compute','instances','stop'") == 1,
        "archive_identity": "236,640,768 bytes" in text and "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5" in text,
        "vm_identity": "1893159507643031574" in text and "us-east1-b" in text,
        "fixture_identity": "97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79" in text,
        "wrapper_identity": "f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19" in text,
        "ceilings": "3,600-second aggregate restart ceiling" in text and "`$1.00` total ceiling" in text,
        "first_failure": "First failure is terminal" in text,
        "no_numerical": "R37 permits no numerical execution" in text,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
        "authority_false": "authority\nremains false" in text,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r37_proposal_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "proposal_sha256": sha256(PROPOSAL),
        "controller_sha256": sha256(CONTROLLER),
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
