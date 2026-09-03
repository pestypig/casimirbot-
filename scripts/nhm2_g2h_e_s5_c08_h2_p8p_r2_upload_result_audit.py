#!/usr/bin/env python3
"""Independent static audit of the terminal P8P-R2 upload result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r2-browser-upload-preexecution-result.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = DOC.read_text(encoding="utf-8")
flat = " ".join(text.split())
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
    "classification": "BLOCKED_PREEXECUTION_BROWSER_UPLOAD_ZERO_ITEMS / R2 EXHAUSTED" in text,
    "proposal_binding": "0068d40da22fa8f3e9b8dc8a2924ae08c18fcf7c0f726bde8a8ab40f9bde483e" in text,
    "ledger_binding": "d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6" in text,
    "resource_identity": all(
        value in text
        for value in (
            "dark-stratum-455714-h4",
            "nhm2-h2-p8p-r2-c2d-32-20260901",
            "6019671172612545475",
            "us-east1-d",
            "c2d-standard-32",
            "debian-12-bookworm-v20260826",
            "30 GB auto-delete `pd-standard`",
        )
    ),
    "base_archive": all(
        value in text
        for value in (
            "236,492,800 bytes",
            "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
        )
    ),
    "zero_transfer": all(
        phrase in text for phrase in ("`Transferred 0 items`", "exact archive `Failed`", "`Retry` action")
    ),
    "no_retry_or_second_upload": all(
        phrase in flat
        for phrase in (
            "No Retry action was taken.",
            "P8P overlay was not selected or transmitted.",
            "No guest command or ledger character was entered.",
        )
    ),
    "zero_execution": all(
        phrase in flat
        for phrase in (
            "Debian `docker.io` was not installed.",
            "controller, sole P=1024 process",
            "P8Q classifier did not run",
        )
    ),
    "stopped": "authenticated instance detail reported `Stopped` in `us-east1-d`" in flat,
    "first_failure_terminal": "R2 is exhausted" in flat and "transfer was not retried" in flat,
    "no_scientific_result": "not a numerical or scientific result" in flat,
    "separate_successor": "must be separately versioned" in flat,
    "authority_locks": all(
        phrase in flat
        for phrase in (
            "Candidate evaluations and positive samples remain zero.",
            "Candidate/scientific roots, tokens and handler linkage remain absent.",
            "physical, propulsion and transport authority remain false",
        )
    ),
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")

passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {sha256(DOC)}")
raise SystemExit(0 if passed == len(checks) else 1)
