#!/usr/bin/env python3
"""Audit the immutable P8P-R21 path-under-specified result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r21-path-under-specified-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r21-local-gcloud-install-authentication.md"

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "1bc96f640d09808bcf204dcd2ea51d4f442517d7f8deb738ec38c959e9407410",
    "classification": "BLOCKED_PREEXECUTION_LOCAL_PATHS_UNDER_SPECIFIED / R21 EXHAUSTED" in text,
    "missing_tool_path": "does not bind either to an exact Windows path" in flat,
    "security_relevance": "newly acquired executable software and persistent OAuth credentials" in flat,
    "first_failure": "first-failure rule therefore consumed R21 before action" in flat,
    "no_download_install": "No archive was downloaded" in flat and "no package was extracted or run" in flat,
    "no_auth": "no browser authentication or credential storage occurred" in flat,
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
