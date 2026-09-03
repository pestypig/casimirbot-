#!/usr/bin/env python3
"""Independent static audit of the candidate-neutral P8P-R7 proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r7-retained-p8j-environment-successor-proposal.md"
R6_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r6-zone-capacity-preexecution-result.md"
R6_AUDITOR = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_r6_result_audit.py"
LEDGER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-cloud-preflight-v1-20260901/h2-p8p-overlay-upload-v1.tar"
MANIFEST = ROOT / "h2-p8p-source-manifest.v1.json"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_turnaround_calibration_cloud_run_v1.sh"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r7-retained-p8j-ingress-v1-20260902"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = PROPOSAL.read_text(encoding="utf-8")
flat = " ".join(text.split())
ledger = LEDGER.read_text(encoding="utf-8")
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
staged = {path.name: path for path in STAGE.iterdir()} if STAGE.is_dir() else {}

checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "r6_result_identity": digest(R6_RESULT) == "6d9dafe5658d6580a604fdc1a1879e7d304256146c7130cf65cdd8833ea7826f",
    "r6_auditor_identity": digest(R6_AUDITOR) == "978ec22741ceaf6e467b38ff5d12f8a3405253998ef5082c6d0b29f7db3e6269",
    "ledger_identity": LEDGER.stat().st_size == 2971 and digest(LEDGER) == "9af4180a714d9dfd24dd6cfe6d3952a73d75c932a3f05f5e3484f79467c94a5b",
    "overlay_identity": OVERLAY.stat().st_size == 134656 and digest(OVERLAY) == "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e",
    "stage_exact_inventory": set(staged) == {
        "h2-p8p-overlay-upload-v1.tar",
        "h2_p8p_r7_retained_p8j_guest_sequence_v1.sh",
    },
    "stage_exact_identities": (
        set(staged) == {
            "h2-p8p-overlay-upload-v1.tar",
            "h2_p8p_r7_retained_p8j_guest_sequence_v1.sh",
        }
        and staged["h2-p8p-overlay-upload-v1.tar"].stat().st_size == 134656
        and digest(staged["h2-p8p-overlay-upload-v1.tar"]) == "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e"
        and staged["h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"].stat().st_size == 2971
        and digest(staged["h2_p8p_r7_retained_p8j_guest_sequence_v1.sh"]) == "9af4180a714d9dfd24dd6cfe6d3952a73d75c932a3f05f5e3484f79467c94a5b"
    ),
    "manifest_identity": MANIFEST.stat().st_size == 2820 and digest(MANIFEST) == "c6ee88481ae7842b176d4c8a2001601c38cc317132c446a086c92b75ddef5aa0",
    "manifest_semantics": (
        manifest["candidate_neutral"] is True
        and manifest["calibration_panel_count"] == 1024
        and manifest["thread_count"] == 32
        and len(manifest["entries"]) == 11
        and not any(manifest["authority"].values())
    ),
    "controller_identity": CONTROLLER.stat().st_size == 4498 and digest(CONTROLLER) == "5af4b629336e166d07a277ae59b0f9776ac9e86b728e762030f27237ed1c8f5b",
    "causal_scope": all(value in flat for value in (
        "failed before allocation", "No guest boot", "avoids another scarce-capacity creation request")),
    "retained_resource": all(value in flat for value in (
        "nhm2-h2-p8j-r9-c2d-32-20260831", "1920090043510946854",
        "us-east1-c", "c2d-standard-32", "debian-12-bookworm-v20260817",
        "30 GB `pd-standard`")),
    "ceilings": "18,000 seconds" in flat and "$9.00" in flat and "14,400-second external timeout" in flat,
    "two_file_ingress": all(value in flat for value in (
        "uploads only the unchanged 134,656-byte P8P overlay and the 2,971-byte R7",
        "exactly two successful transfers", "one native Windows file-open dialog")),
    "base_reuse_guard": all(value in text for value in (
        "236,492,800", "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
        "R7_REMOTE_GUARD_READY")),
    "ssh_stability": "R7_SSH_ROUNDTRIP_READY" in text and "Wait 30 passive seconds" in flat,
    "p8j_isolation": all(value in flat for value in (
        "All P8P work uses new P8P paths", "Retain all P8J evidence and resources",
        "mutation or deletion of any P8J source")),
    "ledger_base_binding": all(value in ledger for value in (
        "BASE_BYTES=236492800", "BASE_SHA=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")),
    "ledger_overlay_binding": all(value in ledger for value in (
        "OVERLAY_BYTES=134656", "OVERLAY_SHA=4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e")),
    "ledger_path_absence": '[[ ! -e "$ROOT" && ! -e "$EVIDENCE" && ! -e "$EXPORT" ]]' in ledger,
    "ledger_process_guard": all(value in ledger for value in (
        "nhm2-h2-p8j-r9.service", "nhm2-h2-p8j-r13.service",
        "pgrep -x mini-boson-star", "docker ps -q")),
    "docker_no_install": "command -v docker" in ledger and "exit 70" in ledger and "apt-get" not in ledger,
    "manifest_validation": all(value in ledger for value in (
        'len(entries) == 11', 'manifest["candidate_neutral"] is True', 'manifest["authority"] == {')),
    "controller_once": ledger.count('sudo bash "$CONTROLLER"') == 1,
    "single_process": "exactly one candidate-neutral P=1024 controller process" in flat,
    "first_failure": "First failure is terminal" in flat,
    "automatic_stop": "shuts the VM down after PASS, FAIL, timeout or partial result" in flat,
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
