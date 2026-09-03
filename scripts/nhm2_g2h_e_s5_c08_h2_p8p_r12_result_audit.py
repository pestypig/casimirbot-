#!/usr/bin/env python3
"""Independent audit of the P8P-R12 start-completion failure result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r12-start-completion-failure-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r12-iab-start-calibration-successor-proposal.md"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r7-retained-p8j-ingress-v1-20260902"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
stage = {path.name: path for path in STAGE.iterdir()} if STAGE.is_dir() else {}
checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "proposal_identity": digest(PROPOSAL) == "5bf120d9cfb3f66435cf0f97dd8c6f0002b4c1511dfc5504b0ce1163e03be7d4",
    "classification": "BLOCKED_START_COMPLETION_NOT_OBSERVED / R12 EXHAUSTED" in text,
    "resource_identity": all(value in text for value in (
        "1920090043510946854", "dark-stratum-455714-h4", "us-east1-c",
        "c2d-standard-32", "debian-12-bookworm-v20260817",
        "30 GB Standard")),
    "one_start": "clicked exactly once" in flat,
    "one_confirmation": "accepted exactly once" in flat,
    "still_stopped": all(value in flat for value in (
        "immediate returned Details state still showed `Stopped`",
        "later read of the same retained page still showed exact state `Stopped`",
        "disabled SSH")),
    "no_retry": "No second start or confirmation occurred" in flat,
    "cause_uninferred": all(value in flat for value in (
        "no explicit capacity or operation error", "does not establish whether the cause was")),
    "zero_downstream": all(value in flat for value in (
        "No VM boot was authenticated", "No SSH surface", "upload",
        "Docker action", "P=1024 process", "occurred")),
    "already_stopped": "resource was already stopped" in flat,
    "stage_inventory": set(stage) == {
        "h2-p8p-overlay-upload-v1.tar",
        "h2_p8p_r7_retained_p8j_guest_sequence_v1.sh",
    },
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "successor_read_only": "separately frozen read-only inspection" in flat,
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
