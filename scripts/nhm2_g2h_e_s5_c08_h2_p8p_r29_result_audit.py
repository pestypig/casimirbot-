#!/usr/bin/env python3
"""Audit the conservative terminal candidate-neutral H2-P8P-R29 result."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r29-terminal-guest-depth-unknown-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r29-no-space-hostkey-successor-proposal.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r29_no_space_hostkey_controller_v1.ps1"
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r29-native-openssh-execution-v1-20260903"
SHORT = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r29-known-hosts")


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
    "proposal_identity": digest(PROPOSAL) == "b2690012739429b5e59c8a9d1f62fcf49c4d8c13ff9f0ad2bc488e6cab2fbf2b",
    "controller_identity": CONTROLLER.stat().st_size == 14891 and digest(CONTROLLER) == "e7163c720f6850fae9dd4a42499e0ee9f9d880823fd575d80384dec27de88e8e",
    "chronology": (EVIDENCE / "start.utc.txt").read_text().strip() == "2026-09-04T03:30:45Z" and (EVIDENCE / "finish.utc.txt").read_text().strip() == "2026-09-04T03:35:30Z",
    "terminal_exit": (EVIDENCE / "procedure.exit.txt").read_text().strip() == "1",
    "preexecution": (EVIDENCE / "preexecution.pass.txt").read_text().strip() == "R29_PREEXECUTION_PASS",
    "receipt_identity": SHORT.stat().st_size == 96 and digest(SHORT) == "7bf4a0c1174f11dc62783f5af0534f6161dd8240d5cbef5dbd907aafaf68c6e8" and digest(EVIDENCE / "known_hosts.r29.copy") == digest(SHORT),
    "scp_success": digest(EVIDENCE / "scp.txt") == "003fec2deb98a1cb313af86fdfe817eaaede513b35ba8346a22ecabd4b736a41",
    "ssh_exit_three": "native command failed (3)" in (EVIDENCE / "failure.txt").read_text(),
    "no_handoff_success": "ssh-handoff.txt" not in files,
    "no_complete_scientific_evidence": "nhm2-h2-p8p-evidence-export-v1.tgz" not in files and "p8q-audit.v1.json" not in files,
    "stop_receipt": digest(EVIDENCE / "failure-stop.txt") == "7934695aeb683743cc8facb07974d20cc2dbf591d20bd868dd7e08feea8c9fdd",
    "conservative_classification": "GUEST EXECUTION DEPTH UNKNOWN" in text and "does **not** claim that Docker, build or P=1024 execution was absent" in flat,
    "read_only_successor": "stopped-disk read-only inspection" in flat and "No service, Docker or numerical process may be started" in flat,
    "p8q_stop": "P8Q_STOP_GUEST_EXECUTION_DEPTH_UNKNOWN" in text,
    "authority_locks": "No candidate, proof, geometry/state, lane, lamp, physical, propulsion or transport authority is promoted" in flat,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
