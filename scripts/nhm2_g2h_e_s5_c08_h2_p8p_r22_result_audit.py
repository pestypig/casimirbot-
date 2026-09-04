#!/usr/bin/env python3
"""Audit the immutable P8P-R22 checksum-misbinding result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r22-checksum-misbinding-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r22-exact-path-local-gcloud-install-authentication.md"
ARCHIVE = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip")

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "689f654dde9b6afde5ddbf07cb118ebe9ef153be0070f1e68830a498c0a4c4b9",
    "classification": "BLOCKED_PREEXECUTION_FROZEN_CHECKSUM_BOUND_TO_X86 / R22 EXHAUSTED" in text,
    "archive_present": ARCHIVE.is_file(),
    "archive_size": ARCHIVE.stat().st_size == 101597540,
    "archive_hash": digest(ARCHIVE) == "25fe2511abdf05d514bbb67859475e7e76acc1f36c0bcac37232e1e34892d768",
    "zip_signature": ARCHIVE.read_bytes()[:4] == b"PK\x03\x04",
    "row_correction": "platform-row checksum misbinding" in flat,
    "official_source": "docs.cloud.google.com/sdk/docs/downloads-versioned-archives" in text,
    "no_extract_auth": "No extraction, executable launch, browser authentication or credential storage occurred" in flat,
    "zero_resource": "No Compute Engine API call, upload, VM/disk/resource action" in flat,
    "no_retry": "no retry, second download, deletion or fallback occurred" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
