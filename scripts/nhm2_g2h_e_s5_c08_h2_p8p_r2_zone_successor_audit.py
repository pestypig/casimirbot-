#!/usr/bin/env python3
"""Independent static audit of the candidate-neutral P8P-R2 successor."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r2-zone-capacity-successor-proposal.md"
R1 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r1-cloud-preexecution-result.md"
ORIGINAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-turnaround-cloud-execution-proposal.md"
AMENDMENT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-browser-ssh-transport-amendment.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = DOC.read_text(encoding="utf-8")
r1 = R1.read_text(encoding="utf-8")
original = ORIGINAL.read_text(encoding="utf-8")
amendment = AMENDMENT.read_text(encoding="utf-8")
flat = " ".join(text.split())
r1_flat = " ".join(r1.split())
original_flat = " ".join(original.split())
amendment_flat = " ".join(amendment.split())

unchanged = (
    "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
    "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e",
    "c6ee88481ae7842b176d4c8a2001601c38cc317132c446a086c92b75ddef5aa0",
    "5af4b629336e166d07a277ae59b0f9776ac9e86b728e762030f27237ed1c8f5b",
    "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718",
    "cc25e6d79ec2d9fafd725285d39d1be5d6c004c2622884e95ed602bdc22411b9",
)

checks = {
    "required_header": all(
        label in text
        for label in (
            "Program gate:",
            "Workstream:",
            "Capability or component:",
            "Current maturity:",
            "Target maturity:",
            "Required frozen inputs:",
            "Required evidence:",
            "Stop/fail criteria:",
            "Explicit non-goals:",
            "Downstream gate unlocked:",
        )
    ),
    "status_inert": "NO R2 RESOURCE OR PROCESS CREATED" in text,
    "r1_failure_bound": all(
        value in r1_flat and value in flat
        for value in ("ZONE_RESOURCE_POOL_EXHAUSTED", "us-east1-c")
    ) and all(value in r1_flat for value in ("2026-09-01T17:02:11-04:00", "2026-09-01T17:02:18-04:00"))
    and "after seven seconds" in flat,
    "two_changes_only": all(
        phrase in flat
        for phrase in (
            "R2 changes only:",
            "nhm2-h2-p8p-r2-c2d-32-20260901",
            "zone from exhausted `us-east1-c`",
            "`us-east1-d`",
        )
    ),
    "resource_exact": all(
        value in flat
        for value in (
            "dark-stratum-455714-h4",
            "on-demand `c2d-standard-32`",
            "projects/debian-cloud/global/images/debian-12-bookworm-v20260826",
            "exactly 30 GB `pd-standard`",
            "18,000 seconds",
            "$9.00",
            "14,400 seconds",
        )
    ),
    "archive_identities": all(value in flat and value in original_flat for value in unchanged[:2]),
    "manifest_controller_binary_auditor": all(value in flat for value in unchanged[2:]),
    "browser_transport_preserved": "authenticated Compute Engine SSH-in-browser" in flat and "guest username `pestypig`" in flat,
    "exactly_two_uploads": all(
        value in flat
        for value in (
            "Upload exactly these two local regular files",
            "h2-p8f-c2-r1-cloud-upload-v1.tar",
            "h2-p8p-overlay-upload-v1.tar",
            "No other upload is permitted.",
        )
    ),
    "absence_guards": all(
        value in flat
        for value in (
            "/home/pestypig/nhm2-h2-p8p-source-v1",
            "/home/pestypig/nhm2-h2-p8p-evidence-v1",
            "/home/pestypig/nhm2-h2-p8p-evidence-export-v1.tgz",
        )
    ),
    "docker_narrow": "Install only Debian `docker.io` if Docker is absent" in flat,
    "one_process": "exactly one candidate-neutral P=1024 process" in flat,
    "receipt_scope": all(
        value in flat
        for value in (
            "phase-specific selector/observer/total timing",
            "64-line progress stream",
            "all 514 degree buckets",
            "six aggregate totals",
            "P8I equality",
            "chronology and neutrality locks",
        )
    ),
    "p8q_trinary": all(
        value in flat
        for value in (
            "P8Q_YES_PROPOSAL_READY",
            "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
            "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED",
        )
    ),
    "serial_only": "only through stopped-VM serial output" in flat,
    "first_failure": "First failure is terminal" in flat,
    "no_retry_or_fallback": all(
        phrase in flat
        for phrase in (
            "no second zone, retry, fallback",
            "No second zone, regional allocator, alternate family",
            "I do not authorize retry, fallback, a second zone or creation attempt",
        )
    ),
    "scientific_unchanged": all(
        phrase in flat
        for phrase in (
            "not a numerical retry, mathematical retune or scientific change",
            "No outcome authorizes P=65,536",
            "No frozen-candidate evaluation",
        )
    ),
    "authority_locks": "physical, propulsion and transport authority remain false" in flat,
    "predecessor_browser_contract": all(value in amendment_flat for value in unchanged[:2] + unchanged[3:]),
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")

passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {sha256(DOC)}")
raise SystemExit(0 if passed == len(checks) else 1)
