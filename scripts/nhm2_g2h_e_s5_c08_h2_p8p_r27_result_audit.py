#!/usr/bin/env python3
"""Audit the terminal candidate-neutral H2-P8P-R27 result."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r27-terminal-hostkey-receipt-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r27-native-openssh-successor-proposal.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r27_native_openssh_controller_v1.ps1"
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r27-native-openssh-execution-v1-20260903"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
files = {p.name for p in EVIDENCE.iterdir() if p.is_file()}
checks = {
    "required_header": all(item in text for item in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:",
    )),
    "proposal_identity": digest(PROPOSAL) == "ca51e39c517967490bcc66fb966da7a35979b4bd38b408cd02cd43a3c1f8d6d0",
    "controller_identity": CONTROLLER.stat().st_size == 14360 and digest(CONTROLLER) == "4fdb40027927f8d0006cfcb6e604fe7dad44b8ed481c484161b215434af14911",
    "chronology": (EVIDENCE / "start.utc.txt").read_text().strip() == "2026-09-04T02:48:59Z"
    and (EVIDENCE / "finish.utc.txt").read_text().strip() == "2026-09-04T02:53:08Z",
    "terminal_exit": (EVIDENCE / "procedure.exit.txt").read_text().strip() == "1",
    "preexecution_pass": (EVIDENCE / "preexecution.pass.txt").read_text().strip() == "R27_PREEXECUTION_PASS",
    "scp_success": digest(EVIDENCE / "scp.txt") == "003fec2deb98a1cb313af86fdfe817eaaede513b35ba8346a22ecabd4b736a41"
    and "Permanently added" in (EVIDENCE / "scp.txt").read_text(),
    "guard_failure": digest(EVIDENCE / "failure.txt") == "d62bca07c5f1668645b43cf315f2e8113b93513f04c1e2e57f20cc56d03aa405"
    and "dedicated known_hosts was not created" in (EVIDENCE / "failure.txt").read_text(),
    "known_hosts_absent": "known_hosts.r27" not in files and "known-hosts.sha256.txt" not in files,
    "ssh_handoff_absent": "ssh-handoff.txt" not in files,
    "scientific_evidence_absent": "nhm2-h2-p8p-evidence-export-v1.tgz" not in files and "p8q-audit.v1.json" not in files,
    "stop_receipt": digest(EVIDENCE / "failure-stop.txt") == "1da4e4d7175e9f0ad0743f3f4cdfe191091f4007e6159e1f7c1c88af792afbb1",
    "terminal_classification": "ARCHIVE TRANSFERRED / VM TERMINATED / NO NUMERICAL EXECUTION" in text,
    "successor_narrow": "path-normalization correction" in flat and "new R28 remote filename" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_EXECUTED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat
    and "physical, propulsion and transport authority remain false" in flat,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
