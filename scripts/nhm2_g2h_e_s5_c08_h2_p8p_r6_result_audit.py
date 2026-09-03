#!/usr/bin/env python3
"""Independent static audit of the terminal candidate-neutral P8P-R6 result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r6-zone-capacity-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r6-ssh-stability-native-picker-successor-proposal.md"
R5_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r5-ssh-drop-preexecution-result.md"
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

error = (
    "Failed to start nhm2-h2-p8p-r3-c2d-32-20260901: A c2d-standard-32 VM "
    "instance is currently unavailable in the us-east1-d zone. Try requesting "
    "the VM in another zone. For more information, view the troubleshooting documentation."
)

checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "proposal_identity": digest(PROPOSAL) == "5b2304763bd1198fdb71db2d6cdb273a6d2288438b0bcb4bc9a1908be2dc2e2e",
    "r5_result_identity": digest(R5_RESULT) == "f078b95a667a7e54168c5526bf330beef23dd0fb9b2c465542e8e48dd049ef34",
    "proposal_named": "5b2304763bd1198fdb71db2d6cdb273a6d2288438b0bcb4bc9a1908be2dc2e2e" in text,
    "terminal_classification": "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R6 EXHAUSTED" in text,
    "proposal_audit": "24/24" in text,
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
    "resource_ceilings": "18,000-second aggregate ceiling" in flat and "$9.00 total ceiling" in flat,
    "initial_stopped": "Details page showed the exact VM `Stopped`" in flat,
    "charge_confirmed": "operator separately confirmed the final Google charge dialog" in flat,
    "one_start": "authorized `Start` control was submitted once" in flat,
    "exact_capacity_error": error in flat,
    "no_retry": "offered `Retry` control was not selected" in flat,
    "terminal_stopped": "reconfirmed status `Stopped`" in flat,
    "zero_boot_ssh": "VM did not boot" in flat and "No post-start Details reload, new browser-SSH surface" in flat,
    "zero_transport": all(value in flat for value in (
        "remote absence guard", "native file picker", "transferred byte occurred")),
    "zero_guest_execution": "No Docker check or installation" in flat and "P=1024 calibration" in flat,
    "capacity_only": "infrastructure capacity evidence only" in flat,
    "p8q_stop_only": all(value in flat for value in (
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED", "P8Q remains unevaluated")),
    "successor_narrow": "change only the resource-admission method" in flat,
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
