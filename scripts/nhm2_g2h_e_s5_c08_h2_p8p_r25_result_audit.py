#!/usr/bin/env python3
"""Independent local-state audit of the P8P-R25 authentication result."""
from __future__ import annotations

import hashlib
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r25-authentication-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r25-confirmation-stable-authentication.md"
GCLOUD = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd")
CONFIG = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def gcloud(*args: str) -> str:
    env = os.environ.copy()
    env["CLOUDSDK_CONFIG"] = str(CONFIG)
    env["CLOUDSDK_CORE_DISABLE_USAGE_REPORTING"] = "true"
    completed = subprocess.run(
        [str(GCLOUD), *args],
        check=True,
        capture_output=True,
        text=True,
        env=env,
        timeout=120,
    )
    return completed.stdout.strip()


text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
account = gcloud("auth", "list", "--filter=status:ACTIVE", "--format=value(account)")
project = gcloud("config", "get-value", "core/project")
checks = {
    "required_header": all(
        item in text
        for item in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        )
    ),
    "proposal_identity": digest(PROPOSAL) == "f0e11be050d6a210714dbe050752ed1039f3b85dd8ca3803cdc74fcf0d677709",
    "pass_status": "PASS / DEDICATED GCLOUD AUTHENTICATED / R25 EXHAUSTED" in text,
    "one_process": "Exactly one Google Cloud SDK 583.0.0 authentication process" in flat,
    "one_transaction": "Exactly one initial in-app-browser OAuth tab" in flat,
    "consent_once": "consent action had completed once" in flat and "no second `Allow` action" in flat,
    "code_only": "Only the generated authorization code was returned" in flat,
    "account": account == "pestypig@gmail.com",
    "project": project == "dark-stratum-455714-h4",
    "credentials_present": (CONFIG / "credentials.db").is_file(),
    "tokens_present": (CONFIG / "access_tokens.db").is_file(),
    "no_compute": "No Compute Engine API or cloud-resource query/action" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat
    and "physical, propulsion and transport authority remain false" in flat,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
