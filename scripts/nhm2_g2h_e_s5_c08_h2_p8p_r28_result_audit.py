#!/usr/bin/env python3
"""Audit the terminal candidate-neutral H2-P8P-R28 result."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r28-terminal-spaced-hostkey-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r28-forward-hostkey-path-successor-proposal.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r28_forward_path_controller_v1.ps1"
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r28-native-openssh-execution-v1-20260903"


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
    "proposal_identity": digest(PROPOSAL) == "aa18c16745765915a512987098be85b4e53b17ef9c160e1ab7555983faf97f69",
    "controller_identity": CONTROLLER.stat().st_size == 14541 and digest(CONTROLLER) == "479e59f066d6cba8367b4955a08c1c830e98c9eee68f1333c5e653cc7ccd6f50",
    "chronology": (EVIDENCE / "start.utc.txt").read_text().strip() == "2026-09-04T03:04:02Z" and (EVIDENCE / "finish.utc.txt").read_text().strip() == "2026-09-04T03:08:16Z",
    "terminal_exit": (EVIDENCE / "procedure.exit.txt").read_text().strip() == "1",
    "preexecution": (EVIDENCE / "preexecution.pass.txt").read_text().strip() == "R28_PREEXECUTION_PASS",
    "scp_success": digest(EVIDENCE / "scp.txt") == "39ac60102ffccf3e47cf7ac797dfe2f41a464548b56db958ab210acbf5a3cbd3" and "Permanently added" in (EVIDENCE / "scp.txt").read_text(),
    "guard_failure": digest(EVIDENCE / "failure.txt") == "d62bca07c5f1668645b43cf315f2e8113b93513f04c1e2e57f20cc56d03aa405",
    "receipt_absent": "known_hosts.r28" not in files and "known-hosts.sha256.txt" not in files,
    "ssh_absent": "ssh-handoff.txt" not in files,
    "scientific_absent": "nhm2-h2-p8p-evidence-export-v1.tgz" not in files and "p8q-audit.v1.json" not in files,
    "stop_receipt": digest(EVIDENCE / "failure-stop.txt") == "bf37e13c7e6abca2cc1351250f24e628d299d895b4dd50caa38fca411ae2b25c",
    "terminal_classification": "SECOND ARCHIVE TRANSFERRED / VM TERMINATED / NO NUMERICAL EXECUTION" in text,
    "successor_narrow": "no-space dedicated receipt path" in flat and "new R29 remote filename" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_EXECUTED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
