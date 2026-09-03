#!/usr/bin/env python3
"""Independent static audit of the candidate-neutral P8P-R4 successor."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r4-fresh-metadata-browser-ssh-successor-proposal.md"
R3 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r3-ssh-fingerprint-preexecution-result.md"
MANIFEST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_base_chunk_manifest_v1.json"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r3-browser-ingress-v1-20260901/chunks"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = DOC.read_text(encoding="utf-8")
flat = " ".join(text.split())
r3 = R3.read_text(encoding="utf-8")
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
expected = {entry["name"]: (entry["bytes"], entry["sha256"]) for entry in manifest["chunks"]}
expected["h2-p8p-overlay-upload-v1.tar"] = (134656, "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e")
actual = {path.name: path for path in STAGE.iterdir()} if STAGE.is_dir() else {}

checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "r3_terminal_bound": (
        "Supplied fingerprint does not match current metadata fingerprint" in r3
        and "Supplied fingerprint does not match current metadata fingerprint" in text
        and "BLOCKED_PREEXECUTION_INSTANCE_METADATA_FINGERPRINT_CONFLICT" in r3
        and "R3 exhausted" in text
    ),
    "metadata_semantics": all(value in flat for value in (
        "optimistic-", "locking conflict", "stale metadata-content fingerprint",
        "not an SSH host-key fingerprint", "412 conditionNotMet")),
    "official_references": all(value in text for value in (
        "troubleshooting/troubleshooting-vm-update",
        "reference/rest/v1/instances/setMetadata")),
    "refresh_only_change": all(value in flat for value in (
        "first console resolution is to refresh", "one explicit reload",
        "one new authenticated Compute Engine browser-SSH surface")),
    "no_manual_trust_mutation": all(value in flat for value in (
        "does not edit or delete metadata, SSH keys, `known_hosts`, IAM or firewall state",
        "no other metadata mutation is permitted")),
    "proposal_binding": "b85d4db90cb42a232e64d6cc285fcc4da82ad25a04bb84271b5c85c4e2d61e5c" in text,
    "manifest_binding": digest(MANIFEST) == "ec1c115461442e1ddba9ccc635aebdd722be5440f23e06c797406ce8cde6b52d" and digest(MANIFEST) in text,
    "stage_exact_inventory": set(actual) == set(expected) and len(actual) == 16,
    "stage_exact_identities": set(actual) == set(expected) and all(
        path.is_file() and not path.is_symlink()
        and path.stat().st_size == expected[name][0]
        and digest(path) == expected[name][1]
        for name, path in actual.items()),
    "archive_identities": all(value in text for value in (
        "236,492,800", "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
        "134,656", "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e")),
    "ledger_binary_auditor": all(value in text for value in (
        "f7112c5a547b48814ee63961cc6b441cd67f147b0bc47feb6ea8f98cddf8ca96",
        "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718",
        "cc25e6d79ec2d9fafd725285d39d1be5d6c004c2622884e95ed602bdc22411b9")),
    "scientific_unchanged": all(value in flat for value in (
        "No candidate-dependent byte", "observer semantics", "reduction order",
        "acceptance rule changes")),
    "exact_existing_resource": all(value in flat for value in (
        "nhm2-h2-p8p-r3-c2d-32-20260901", "637527339076077505",
        "us-east1-d", "c2d-standard-32", "debian-12-bookworm-v20260826",
        "retained 30 GB `pd-standard`")),
    "ceilings": all(value in flat for value in (
        "18,000 seconds", "$9.00", "14,400-second external timeout")),
    "one_restart_connection_batch_process": all(value in flat for value in (
        "exactly one restart", "one new authenticated", "one batch",
        "invoke the controller exactly once")),
    "first_failure_terminal": all(value in flat for value in (
        "First failure is terminal", "Do not press Retry or Troubleshoot",
        "do not open a second SSH surface")),
    "automatic_stop": "Automatically stop the VM after any outcome" in flat,
    "p8q_trinary": all(value in flat for value in (
        "P8Q_YES_PROPOSAL_READY", "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED", "No result authorizes P=65,536")),
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {digest(DOC)}")
raise SystemExit(0 if passed == len(checks) else 1)
