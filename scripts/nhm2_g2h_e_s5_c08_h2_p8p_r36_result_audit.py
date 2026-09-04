#!/usr/bin/env python3
"""Audit the immutable P8P-R36 remote-guard failure."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
E = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r36-static-guard-cloud-fixture-v1-20260904"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r36-remote-command-result.md"
OUT = E / "h2-p8p-r36-result-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = RESULT.read_text(encoding="utf-8")
    guard = (E / "guard.stdout.txt").read_text(encoding="utf-8")
    checks = {
        "header": text.startswith("Program gate:") and text.splitlines()[9].startswith("Downstream gate unlocked:"),
        "proposal_bound": "19cd0f6933c8672eb6273c5ae6b900dd487b9b0e7b02965a259c0b2c0bf1789f" in text,
        "controller_bound": "e02a7c1ff8023402802c949f82a57826cad7e9227b69b6e27545c20a0ebd93dc" in text,
        "guard_output": guard == "bash: line 1: C:WINDOWSsystem32cmd.exe: command not found\n",
        "guard_exit": (E / "guard.exit.txt").read_text(encoding="utf-8") == "127\n",
        "procedure_exit": (E / "procedure.exit.txt").read_text(encoding="utf-8") == "1\n",
        "failure_receipt": "read-only remote guard failed" in (E / "failure.txt").read_text(encoding="utf-8"),
        "cleanup_receipt": "Stopped" in (E / "cleanup-stop.txt").read_text(encoding="utf-8") or "Updated" in (E / "cleanup-stop.txt").read_text(encoding="utf-8"),
        "no_scp": not (E / "archive.scp.txt").exists(),
        "no_handoff": not (E / "handoff.stdout.txt").exists(),
        "no_build_or_numerical": "No SCP, archive upload" in text and "numerical process\noccurred" in text,
        "terminated": "authenticated\n`TERMINATED`" in text,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
        "authority_false": "authority\nremains false" in text,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r36_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "classification": "BLOCKED_REMOTE_GUARD_MULTILINE_COMMAND_TRANSPORT",
        "vm_restarts": 1,
        "ssh_guards": 1,
        "uploads": 0,
        "builds": 0,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
        "result_sha256": sha256(RESULT),
    }
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(OUT))
    print(payload["result_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
