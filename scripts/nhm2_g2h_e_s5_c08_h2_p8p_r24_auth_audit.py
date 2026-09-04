#!/usr/bin/env python3
"""Static audit of candidate-neutral P8P-R24 auth-only handoff."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r24-auth-only-handoff.md"
R23 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r23-auth-tab-lost-result.md"
GCLOUD = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd")
CONFIG = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config")

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
expected_config = {"configurations", "logs", ".last_survey_prompt.yaml", "active_config", "default_configs.db", "gce"}
actual_config = {p.name for p in CONFIG.iterdir()} if CONFIG.is_dir() else set()
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r23_identity": digest(R23) == "842a8e4d6aad3e28bd618e829b969a0cd05d274ff22d85101cf9f848406c5a4a",
    "gcloud_present": GCLOUD.is_file(),
    "config_inventory": actual_config == expected_config,
    "credentials_absent": not (CONFIG / "credentials.db").exists() and not (CONFIG / "access_tokens.db").exists(),
    "one_auth": "start exactly one `gcloud auth login" in flat,
    "one_tab": "exactly one fresh in-app-browser tab" in flat,
    "exact_account": "pestypig@gmail.com" in text,
    "scope_observation": "App Engine, Cloud data, Cloud SQL and Compute Engine scopes" in flat,
    "handoff": "mark that exact tab for cross-turn handoff" in flat,
    "action_confirmation": "mandatory action-time user confirmation" in flat,
    "one_allow": "activate `Allow` exactly once" in flat,
    "code_only": "send only that code to the one waiting gcloud process" in flat,
    "dedicated_project": "dark-stratum-455714-h4" in text,
    "zero_compute_api": "Do not invoke a Compute Engine API" in flat,
    "first_failure": "First failure is terminal and consumes R24" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
