#!/usr/bin/env python3
"""Independent audit of the P8P-R8 Cloud Shell preexecution result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r8-cloudshell-limit-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r8-cloudshell-start-successor-proposal.md"
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
    "proposal_identity": digest(PROPOSAL) == "0972a2d552119af03af3c9da2027a704a0b3b2f5198a8d40940d301d43925ab5",
    "terminal_classification": "BLOCKED_PREEXECUTION_CLOUD_SHELL_LIMIT / R8 EXHAUSTED" in text,
    "exact_command_binding": "94dfefa6bd373d211f5722dd5c6d290e4768aafb3b80132f3005f417be087219" in text,
    "service_state": all(value in flat for value in (
        "Provisioning your Cloud Shell machine", "Connecting...",
        "You have temporarily exceeded a Cloud Shell limit")),
    "no_command_line": "terminal exposed no usable command line" in flat,
    "zero_input": "zero characters and zero commands were entered" in flat,
    "no_start": "command was not submitted" in flat and "No Google start operation" in flat,
    "zero_downstream": all(value in flat for value in (
        "VM boot", "SSH session", "uploaded byte", "Docker action",
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
    "successor_narrow": "replacing only the unavailable Cloud Shell start transport" in flat,
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
