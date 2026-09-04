#!/usr/bin/env python3
"""Audit immutable P8P-R23 auth-tab-lost result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r23-auth-tab-lost-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r23-x64-checksum-reuse-authentication.md"
GCLOUD = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd")
CONFIG = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config")

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
expected_config = {"configurations", "logs", ".last_survey_prompt.yaml", "active_config", "default_configs.db", "gce"}
actual_config = {p.name for p in CONFIG.iterdir()} if CONFIG.is_dir() else set()
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "03e46647ca3e05e373bac3d8bc511cb424e13671f6c557500e1c0e1bbd0eacb1",
    "classification": "PARTIAL_EXTRACTION_PASS / BLOCKED_AUTH_TAB_LOST / R23 EXHAUSTED" in text,
    "gcloud_present": GCLOUD.is_file(),
    "extract_version": "Google Cloud SDK `583.0.0`" in flat,
    "one_flow": "Exactly one `gcloud auth login" in flat and "exactly one fresh in-app-browser" in flat,
    "allow_not_clicked": "No `Allow` activation occurred" in flat,
    "process_terminated": "exited nonzero" in flat,
    "config_inventory": actual_config == expected_config,
    "no_credential_files": not (CONFIG / "credentials.db").exists() and not (CONFIG / "access_tokens.db").exists(),
    "zero_resource": "No Compute Engine API call, upload, VM/disk/resource action" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
