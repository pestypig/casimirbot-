#!/usr/bin/env python3
"""Independent audit of the P8P-R17 standalone consent result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r17-standalone-cloudshell-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r17-standalone-cloudshell-preflight.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "9d9f6f588cb4cfe89f2fd635eedbf1bfa0a78e64bbca4dc382d3549ab3c10c75",
    "classification": "BLOCKED_CLOUD_SHELL_EXPLICIT_CONSENT_REQUIRED / R17 EXHAUSTED" in text,
    "exact_surface": "https://shell.cloud.google.com/?show=terminal" in text and "one passive 20-second wait" in flat,
    "exact_dialog": "`Authorize Cloud Shell`" in text and "`Authorize` and `Reject`" in text,
    "no_consent": "did not activate either control" in flat and "No Cloud Shell credential permission was granted" in flat,
    "no_command_upload": "did not enter its read-only health command" in flat and "upload a file" in flat,
    "zero_resource": "No Compute Engine API request, regional bulk request, VM/disk creation" in flat,
    "no_science": "Docker action, build, systemd service or numerical process occurred" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
