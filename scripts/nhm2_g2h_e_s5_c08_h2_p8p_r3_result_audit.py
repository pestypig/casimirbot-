#!/usr/bin/env python3
"""Independent static audit of the terminal candidate-neutral P8P-R3 result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r3-ssh-fingerprint-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r3-chunked-browser-ingress-successor-proposal.md"
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
expected = {
    entry["name"]: (entry["bytes"], entry["sha256"])
    for entry in manifest["chunks"]
}
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
    "proposal_identity": (
        digest(PROPOSAL)
        == "b85d4db90cb42a232e64d6cc285fcc4da82ad25a04bb84271b5c85c4e2d61e5c"
        and "b85d4db90cb42a232e64d6cc285fcc4da82ad25a04bb84271b5c85c4e2d61e5c" in text
    ),
    "terminal_classification": "BLOCKED_PREEXECUTION_INSTANCE_METADATA_FINGERPRINT_CONFLICT" in text,
    "local_materialization": all(marker in text for marker in (
        "P8P_R3_INGRESS_MATERIALIZED 16/16",
        "P8P_R3_INGRESS_VERIFIED 16/16")),
    "stage_exact_inventory": set(actual) == set(expected) and len(actual) == 16,
    "stage_exact_identities": set(actual) == set(expected) and all(
        path.is_file() and not path.is_symlink()
        and path.stat().st_size == expected[name][0]
        and digest(path) == expected[name][1]
        for name, path in actual.items()
    ),
    "resource_identity": all(value in flat for value in (
        "dark-stratum-455714-h4", "nhm2-h2-p8p-r3-c2d-32-20260901",
        "637527339076077505", "us-east1-d", "c2d-standard-32",
        "debian-12-bookworm-v20260826", "30 GB auto-delete `pd-standard`")),
    "resource_ceilings": "18,000-second aggregate runtime ceiling" in flat and "$9.00 total ceiling" in flat,
    "exact_failure_text": all(value in text for value in (
        "Connection Failed",
        "Supplied fingerprint does not match current metadata fingerprint.")),
    "first_failure_terminal": "First failure was terminal" in flat,
    "no_retry": all(value in flat for value in (
        "Neither action was taken", "no Retry", "grants no R3 retry")),
    "zero_upload": all(value in flat for value in (
        "No file chooser or upload was invoked",
        "no staged byte crossed the cloud boundary")),
    "zero_guest_execution": all(value in flat for value in (
        "no guest command or ledger character was entered",
        "guest ledger was not entered")),
    "zero_docker_build": all(value in flat for value in (
        "`docker.io` was not installed", "offline build")),
    "zero_numerical_process": all(value in flat for value in (
        "sole P=1024 process", "did not run")),
    "stopped_terminal_state": all(value in text for value in (
        "Stopped. This instance is", "stopped", "exact R3 VM")),
    "p8q_stop_only": (
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text
        and "not the P8Q yes/no decision" in flat
    ),
    "metadata_semantics_correct": all(value in flat for value in (
        "optimistic-lock conflict", "hash/version of the metadata contents",
        "not an SSH host-key fingerprint")),
    "successor_narrow": "freshly loaded console-detail and one-attempt browser-SSH metadata transaction" in flat,
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
