#!/usr/bin/env python3
"""Independent audit of the P8P-R7 preexecution UI-control result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r7-ui-control-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r7-retained-p8j-environment-successor-proposal.md"
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
    "proposal_identity": digest(PROPOSAL) == "78186ed461c88e4f5a8757d88a6c9a5fc61ed55a13587040ef95b85d6555a974",
    "terminal_classification": "BLOCKED_PREEXECUTION_START_CONTROL_GEOMETRY_UNAVAILABLE / R7 EXHAUSTED" in text,
    "resource_identity": all(value in flat for value in (
        "nhm2-h2-p8j-r9-c2d-32-20260831", "1920090043510946854",
        "us-east1-c", "c2d-standard-32", "debian-12-bookworm-v20260817",
        "30 GB Standard persistent disk")),
    "initial_stopped": "stopped state" in flat,
    "intervening_stopped": "fresh state read then proved the exact VM still `Stopped`" in flat,
    "exact_error": "coordinate input geometry is unavailable" in text,
    "no_start_operation": "No Google start operation" in flat,
    "zero_guest": all(value in flat for value in (
        "guest boot", "SSH surface", "uploaded byte", "Docker action",
        "P=1024 process", "occurred")),
    "first_failure": "first-failure/no-fallback rule" in flat,
    "capacity_not_inferred": "not C2D capacity" in flat,
    "stage_inventory": set(stage) == {
        "h2-p8p-overlay-upload-v1.tar",
        "h2_p8p_r7_retained_p8j_guest_sequence_v1.sh",
    },
    "stage_identity": (
        set(stage) == {"h2-p8p-overlay-upload-v1.tar", "h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"}
        and stage["h2-p8p-overlay-upload-v1.tar"].stat().st_size == 134656
        and digest(stage["h2-p8p-overlay-upload-v1.tar"]) == "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e"
        and stage["h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"].stat().st_size == 2971
        and digest(stage["h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"]) == "9af4180a714d9dfd24dd6cfe6d3952a73d75c932a3f05f5e3484f79467c94a5b"
    ),
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "successor_narrow": "replacing only the unexecutable browser Start control" in flat,
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
