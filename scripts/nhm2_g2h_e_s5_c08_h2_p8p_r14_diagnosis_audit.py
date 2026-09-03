#!/usr/bin/env python3
"""Static audit of the P8P-R14 delayed operation-render diagnosis."""

from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r14-delayed-operation-render-diagnosis.md"
R13_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r13-operation-list-diagnosis-result.md"

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r13_identity": digest(R13_RESULT) == "1beb8f8aecf24c604537c4501d5202e334cb0c9568b17536372f64632e53cd04",
    "read_only": "FROZEN READ-ONLY DELAYED RENDER / ZERO BILLABLE ACTION" in text,
    "one_wait_read": "30 seconds" in flat and "exactly one accessibility read" in flat,
    "exact_resource": all(x in text for x in ("1920090043510946854", "us-east1-c", "dark-stratum-455714-h4")),
    "no_actions": all(x in flat for x in ("may not refresh, click, type, filter, sort, navigate", "query an API", "start or stop any resource", "perform a second read", "use a fallback")),
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
