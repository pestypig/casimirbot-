#!/usr/bin/env python3
"""Static audit of the P8P-R12 authenticated IAB start/calibration proposal."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r12-iab-start-calibration-successor-proposal.md"
R11_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r11-iab-start-menu-preflight-result.md"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r7-retained-p8j-ingress-v1-20260902"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
stage = {path.name: path for path in STAGE.iterdir()} if STAGE.is_dir() else {}
checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "r11_identity": digest(R11_RESULT) == "d70b044f6596e5b9f161156110661dacfe4a28e833ca4653dc6f6042c1b5a9d1",
    "awaiting_authority": "FROZEN BILLABLE SUCCESSOR / AWAITING ACTION-TIME AUTHORIZATION" in text,
    "exact_resource": all(value in text for value in (
        "1920090043510946854", "dark-stratum-455714-h4", "us-east1-c",
        "c2d-standard-32", "debian-12-bookworm-v20260817",
        "30 GB Standard persistent")),
    "one_start": "click exactly once" in flat and "Start / Resume" in text,
    "one_confirmation": "accept it once" in flat,
    "no_fallback": all(value in flat for value in (
        "No second click", "Cloud Shell", "API command", "new VM", "fallback")),
    "runtime_cost": "18,000 seconds" in text and "$9.00" in text,
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
    "retained_base": "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978" in text,
    "existing_docker_only": "existing Docker" in text and "Docker installation is forbidden" in text,
    "binary": "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718" in text,
    "one_calibration": "exactly one candidate-neutral P=1024 controller process" in flat and "14,400-second timeout" in flat,
    "auditor": "cc25e6d79ec2d9fafd725285d39d1be5d6c004c2622884e95ed602bdc22411b9" in text,
    "automatic_stop": "automatically stop the VM" in flat,
    "p8q_bounded": all(value in text for value in (
        "P8Q_YES_PROPOSAL_READY", "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED")),
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
    "authorization_present": "I authorize exactly one H2-P8P-R12" in text,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
