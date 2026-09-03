#!/usr/bin/env python3
"""Independent audit of the P8P-R14 exact operation-row result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r14-operation-row-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r14-delayed-operation-render-diagnosis.md"

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

text = RESULT.read_text(encoding="utf-8")
flat = " ".join(text.split())
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "packet_identity": digest(PACKET) == "07e4233d09b7f74347d0fb3062d8c1a02165919e4c17b238ee175122d24f7041",
    "classification": "EXACT_START_OPERATION_DONE / SUCCESS_UNPROVEN / R14 CLOSED" in text,
    "exact_row": all(x in text for x in ("`start`", "`nhm2-h2-p8j-r9-c2d-32-20260831`", "`pestypig@gmail.com`", "10:28:13 AM", "10:28:14 AM", "`DONE`")),
    "success_unproven": "no success flag, error code or error message" in flat and "cannot be treated as successful VM start" in flat,
    "no_action": "No link, filter, refresh, API, start, stop or other control was activated" in flat,
    "zero_downstream": "No SSH, upload, Docker action, build or calculation occurred" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "successor_narrow": "read-only activation of this exact operation-detail link" in flat,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
