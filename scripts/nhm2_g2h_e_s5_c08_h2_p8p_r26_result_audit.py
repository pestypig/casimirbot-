#!/usr/bin/env python3
"""Audit the terminal candidate-neutral H2-P8P-R26 transport result."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r26-terminal-transport-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r26-local-gcloud-successor-proposal.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r26_local_gcloud_controller_v1.ps1"
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r26-local-gcloud-execution-v1-20260903"
GCLOUD_LOG = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config\logs\2026.09.03\21.40.11.858407.log")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(item in text for item in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:",
    )),
    "proposal_identity": digest(PROPOSAL) == "ec41efaf2de6c7384e71c3d13f3978f939409bd037288d168ea633a835c643e1",
    "controller_identity": CONTROLLER.stat().st_size == 13377 and digest(CONTROLLER) == "50c2743a6f2e61fc61a0e9df53b8806db8f1b41a26297cd647f1087517ae1a24",
    "evidence_inventory": {p.name for p in EVIDENCE.iterdir() if p.is_file()} == {
        "account.txt", "bulk-create.json", "disk.post.json", "failure-stop.txt",
        "failure.txt", "finish.utc.txt", "instance.post.json", "instances.pre.json",
        "preexecution.pass.txt", "procedure.exit.txt", "project.txt", "region.pre.json",
        "selected-zone.txt", "start.utc.txt",
    },
    "chronology": (EVIDENCE / "start.utc.txt").read_text().strip() == "2026-09-04T01:36:22Z"
    and (EVIDENCE / "finish.utc.txt").read_text().strip() == "2026-09-04T01:40:35Z",
    "terminal_exit": (EVIDENCE / "procedure.exit.txt").read_text().strip() == "1",
    "preexecution_pass": (EVIDENCE / "preexecution.pass.txt").read_text().strip() == "R26_PREEXECUTION_PASS",
    "selected_zone": (EVIDENCE / "selected-zone.txt").read_text().strip() == "us-east1-c",
    "scp_log_identity": GCLOUD_LOG.stat().st_size == 9804 and digest(GCLOUD_LOG) == "e76eee365155d18601ee379726a19279666a47423282d373ecb16258947b71a9",
    "scp_log_cause": all(value in GCLOUD_LOG.read_text(encoding="utf-8") for value in (
        "You do not have an SSH key for gcloud", "Updating project ssh metadata",
        "dan@35.237.31.117:/home/pestypig/", "pscp.exe] exited with return code [1]",
    )),
    "stop_receipt": digest(EVIDENCE / "failure-stop.txt") == "2ff8a3d87de06ff28e69e7a14c6d1c7f170ccfcdd41122f54653a169fc1da5c1",
    "no_scp_receipt": not (EVIDENCE / "scp.txt").exists(),
    "no_scientific_evidence": not (EVIDENCE / "nhm2-h2-p8p-evidence-export-v1.tgz").exists()
    and not (EVIDENCE / "p8q-audit.v1.json").exists(),
    "terminal_classification": "TERMINAL PREEXECUTION FAIL / VM TERMINATED / NO NUMERICAL EXECUTION" in text,
    "successor_is_transport_only": "transport correction" in flat and "must not change the archive" in flat,
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
