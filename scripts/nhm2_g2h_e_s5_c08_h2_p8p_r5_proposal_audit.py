#!/usr/bin/env python3
"""Independent static audit of the candidate-neutral P8P-R5 proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r5-native-file-picker-successor-proposal.md"
R4_PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r4-fresh-metadata-browser-ssh-successor-proposal.md"
R4_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r4-browser-filechooser-preexecution-result.md"
MANIFEST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_base_chunk_manifest_v1.json"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r3-browser-ingress-v1-20260901/chunks"
LEDGER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_browser_guest_sequence_v1.sh"
AUDITOR = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_turnaround_result_audit.py"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = PROPOSAL.read_text(encoding="utf-8")
flat = " ".join(text.split())
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
expected = {entry["name"]: (entry["bytes"], entry["sha256"]) for entry in manifest["chunks"]}
expected["h2-p8p-overlay-upload-v1.tar"] = (
    134656,
    "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e",
)
actual = {path.name: path for path in STAGE.iterdir()} if STAGE.is_dir() else {}

checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "change_classification": all(value in flat for value in (
        "transport procedure and receipt semantics only",
        "Mathematical semantics and runtime authority are unchanged")),
    "r4_proposal_identity": digest(R4_PROPOSAL) == "5202340ab57083b88fa874b9f2c2ec5b4dd5196b2da86716e33f15a9e169055e",
    "r4_result_identity": digest(R4_RESULT) == "a7cefb8050fbab5518915852358813836aa7da58db88565e2f1532ba838a0c8f",
    "manifest_identity": digest(MANIFEST) == "ec1c115461442e1ddba9ccc635aebdd722be5440f23e06c797406ce8cde6b52d",
    "stage_exact_inventory": set(actual) == set(expected) and len(actual) == 16,
    "stage_exact_identities": set(actual) == set(expected) and all(
        path.is_file() and not path.is_symlink()
        and path.stat().st_size == expected[name][0]
        and digest(path) == expected[name][1]
        for name, path in actual.items()),
    "base_overlay_bindings": all(value in text for value in (
        "236,492,800", "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
        "134,656", "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e")),
    "ledger_identity": digest(LEDGER) == "f7112c5a547b48814ee63961cc6b441cd67f147b0bc47feb6ea8f98cddf8ca96",
    "auditor_identity": digest(AUDITOR) == "cc25e6d79ec2d9fafd725285d39d1be5d6c004c2622884e95ed602bdc22411b9",
    "executable_identity": "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718" in text,
    "extension_diagnosis": all(value in flat for value in (
        "hehggadaopoacecdllhhajmbjkdcmajg", "1.26.827.12125_0",
        "newAllowFileAccess=true", "withholding_permissions=false",
        "native-host manifest present")),
    "resource_identity": all(value in flat for value in (
        "dark-stratum-455714-h4", "nhm2-h2-p8p-r3-c2d-32-20260901",
        "637527339076077505", "us-east1-d", "c2d-standard-32",
        "debian-12-bookworm-v20260826", "30 GB `pd-standard`")),
    "ceilings": "18,000 seconds" in flat and "$9.00" in flat and "14,400-second" in flat,
    "one_restart_surface": all(value in flat for value in (
        "exactly one restart", "exactly one new authenticated browser-SSH surface")),
    "remote_absence_guard": "R4_REMOTE_ABSENT_16" in text,
    "native_picker_order": all(value in flat for value in (
        "activate the visible SSH Upload control once",
        "one unambiguous file-open dialog", "exact staging directory",
        "Select all sixteen entries once", "activating `Open` exactly once")),
    "native_picker_fail_closed": all(value in flat for value in (
        "Any absent dialog, ambiguity, extra/missing selection",
        "partial/zero transfer", "second picker or alternate transport")),
    "no_terminal_transport": all(value in flat for value in (
        "No Windows terminal", "Run dialog", "PowerShell", "batch file")),
    "no_browser_setfiles": all(value in flat for value in (
        "browser-client `setFiles`", "drag/drop", "clipboard")),
    "specific_upload_boundary": "outbound upload of the exact sixteen candidate-neutral files" in flat,
    "docker_action_confirmation": "separately required action-time installation confirmation" in flat,
    "one_controller": all(value in flat for value in (
        "exactly one candidate-neutral P=1024 controller process", "invoke the controller exactly once")),
    "p8q_rule": all(value in text for value in (
        "P8Q_YES_PROPOSAL_READY", "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED")),
    "no_full_width": all(value in flat for value in (
        "No result authorizes P=65,536", "P=65,536 execution")),
    "first_failure_terminal": "First failure is terminal" in flat,
    "no_retry_retune": all(value in flat for value in (
        "I do not authorize retrying R4 or R5", "scientific change or retuning")),
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
    "no_execution_authority": "AWAITING SEPARATE BILLABLE-ACTION AUTHORIZATION" in text,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {digest(PROPOSAL)}")
print(f"AUDITOR_SHA256 {digest(Path(__file__))}")
raise SystemExit(0 if passed == len(checks) else 1)
