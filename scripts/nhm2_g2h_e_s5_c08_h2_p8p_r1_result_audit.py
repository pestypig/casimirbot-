#!/usr/bin/env python3
"""Independent static audit of the terminal P8P-R1 cloud preexecution result."""

from __future__ import annotations

import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r1-cloud-preexecution-result.md"


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
    "classification": "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R1 EXHAUSTED" in text,
    "authorization_binding": "5f4639fda116ca8acd8fa21a181eb69a215b1ca0a9b1cce73a57988c7180a937" in text,
    "resource_identity": all(
        value in text
        for value in (
            "dark-stratum-455714-h4",
            "nhm2-h2-p8p-c1-c2d-32-20260901",
            "us-east1-c",
            "c2d-standard-32",
            "projects/debian-cloud/global/images/debian-12-bookworm-v20260826",
            "30 GB `pd-standard`",
        )
    ),
    "operation_identity": all(
        value in text
        for value in (
            "operation-1788296530716-65a723b7767d6-6f9d761f-35c67f68",
            "5705384745999434684",
            "6565254825204417468",
        )
    ),
    "chronology": all(
        value in text
        for value in (
            "2026-09-01T17:02:11-04:00",
            "2026-09-01T17:02:18-04:00",
            "terminal progress `100%`",
        )
    ),
    "provider_failure": all(
        value in text
        for value in (
            "ZONE_RESOURCE_POOL_EXHAUSTED",
            "currently unavailable in the us-east1-c zone",
        )
    ),
    "zero_execution": all(
        phrase in flat
        for phrase in (
            "Neither authorized archive was uploaded.",
            "Docker was not installed.",
            "controller, sole P=1024 process",
            "P8Q classifier did not run",
        )
    ),
    "first_failure_terminal": "R1 is exhausted by its first-failure rule" in flat,
    "separate_successor": "separately versioned, frozen and authorized" in flat,
    "authority_locks": all(
        phrase in flat
        for phrase in (
            "Candidate evaluations and positive samples remain zero.",
            "Candidate/scientific roots and handler linkage remain absent.",
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
