#!/usr/bin/env python3
"""Independent static audit of the terminal candidate-neutral P8P-R4 result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r4-browser-filechooser-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r4-fresh-metadata-browser-ssh-successor-proposal.md"
MANIFEST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_base_chunk_manifest_v1.json"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r3-browser-ingress-v1-20260901/chunks"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = RESULT.read_text(encoding="utf-8")
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
    "proposal_identity": digest(PROPOSAL) == "5202340ab57083b88fa874b9f2c2ec5b4dd5196b2da86716e33f15a9e169055e",
    "proposal_named": "5202340ab57083b88fa874b9f2c2ec5b4dd5196b2da86716e33f15a9e169055e" in text,
    "terminal_classification": "BLOCKED_PREEXECUTION_BROWSER_FILECHOOSER_UNAVAILABLE / R4 EXHAUSTED" in text,
    "proposal_audit": "20/20" in text,
    "stage_verified": "P8P_R3_INGRESS_VERIFIED 16/16" in text,
    "stage_exact_inventory": set(actual) == set(expected) and len(actual) == 16,
    "stage_exact_identities": set(actual) == set(expected) and all(
        path.is_file() and not path.is_symlink()
        and path.stat().st_size == expected[name][0]
        and digest(path) == expected[name][1]
        for name, path in actual.items()),
    "resource_identity": all(value in flat for value in (
        "dark-stratum-455714-h4", "nhm2-h2-p8p-r3-c2d-32-20260901",
        "637527339076077505", "us-east1-d", "c2d-standard-32",
        "debian-12-bookworm-v20260826", "30 GB `pd-standard`")),
    "resource_ceilings": "18,000-second aggregate restart ceiling" in flat and "$9.00 total ceiling" in flat,
    "one_restart": "one authorized restart succeeded" in flat,
    "fresh_browser_ssh": all(value in flat for value in (
        "freshly reloaded once", "Exactly one new Compute Engine browser-SSH surface",
        "authenticated user `pestypig`")),
    "remote_absence_guard": "R4_REMOTE_ABSENT_16" in text,
    "chooser_failure": all(value in flat for value in (
        "No filechooser event appeared", "produced no chooser")),
    "zero_upload": all(value in flat for value in (
        "No path was selected", "zero bytes crossed the cloud boundary")),
    "zero_guest_execution": "guest ledger was not entered" in flat,
    "zero_docker_build": all(value in flat for value in (
        "`docker.io` was not installed", "offline build")),
    "zero_numerical_process": all(value in flat for value in (
        "sole P=1024 controller process", "did not run")),
    "first_failure_terminal": "first terminal R4 failure" in flat,
    "stopped_terminal_state": "Stopped. This instance is stopped" in text,
    "p8q_stop_only": all(value in flat for value in (
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED", "not the P8Q yes/no decision")),
    "successor_narrow": "separately frozen transport-admission packet" in flat,
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
