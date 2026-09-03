#!/usr/bin/env python3
"""Independent static audit of the candidate-neutral P8P-R8 proposal."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r8-cloudshell-start-successor-proposal.md"
R7_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r7-ui-control-preexecution-result.md"
R7_AUDITOR = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_r7_result_audit.py"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r7-retained-p8j-ingress-v1-20260902"
COMMAND = "gcloud compute instances start nhm2-h2-p8j-r9-c2d-32-20260831 --project=dark-stratum-455714-h4 --zone=us-east1-c --quiet"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = PROPOSAL.read_text(encoding="utf-8")
flat = " ".join(text.split())
stage = {path.name: path for path in STAGE.iterdir()} if STAGE.is_dir() else {}
checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "r7_result_identity": digest(R7_RESULT) == "09e87815d3b8da57ce67dc0e9c2b941e08db3172108063704c801dc8d0d50ef4",
    "r7_auditor_identity": digest(R7_AUDITOR) == "db17384660fefaf0a34eb3704dd0a6e68f8a8f12ec74a4140fa47337b43119c0",
    "causal_scope": all(value in flat for value in (
        "coordinate geometry was unavailable", "No Google start operation",
        "replaces only that unexecutable button activation")),
    "command_identity": len(COMMAND) == 120 and hashlib.sha256(COMMAND.encode()).hexdigest() == "94dfefa6bd373d211f5722dd5c6d290e4768aafb3b80132f3005f417be087219",
    "command_exactly_once": text.count(COMMAND) == 1,
    "one_command": all(value in flat for value in (
        "visibly empty command line", "Submit it once", "No second command")),
    "resource_identity": all(value in flat for value in (
        "nhm2-h2-p8j-r9-c2d-32-20260831", "1920090043510946854",
        "us-east1-c", "c2d-standard-32", "debian-12-bookworm-v20260817",
        "30 GB `pd-standard`")),
    "ceilings": "18,000-second aggregate restart ceiling" in flat and "$9.00 total ceiling" in flat and "14,400-second external timeout" in flat,
    "stage_inventory": set(stage) == {"h2-p8p-overlay-upload-v1.tar", "h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"},
    "stage_identity": (
        set(stage) == {"h2-p8p-overlay-upload-v1.tar", "h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"}
        and stage["h2-p8p-overlay-upload-v1.tar"].stat().st_size == 134656
        and digest(stage["h2-p8p-overlay-upload-v1.tar"]) == "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e"
        and stage["h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"].stat().st_size == 2971
        and digest(stage["h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"]) == "9af4180a714d9dfd24dd6cfe6d3952a73d75c932a3f05f5e3484f79467c94a5b"
    ),
    "preserved_ingress": all(value in flat for value in (
        "one native picker", "exact two-file transfer", "retained-base authentication")),
    "docker_no_install": "existing-Docker requirement" in flat and "Docker installation" in flat,
    "single_process": "exactly one candidate-neutral P=1024 controller process" in flat,
    "automatic_stop": "automatic stop" in flat,
    "first_failure": "First failure is terminal" in flat,
    "p8q_trinary": all(value in text for value in (
        "P8Q_YES_PROPOSAL_READY", "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED")),
    "no_full_run": "No result authorizes P=65,536" in flat,
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
    "authorization_text": "## Exact authorization text" in text and "PROPOSAL_SHA256" in text,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {digest(PROPOSAL)}")
raise SystemExit(0 if passed == len(checks) else 1)
