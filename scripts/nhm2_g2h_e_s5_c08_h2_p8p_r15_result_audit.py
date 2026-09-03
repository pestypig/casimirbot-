#!/usr/bin/env python3
"""Independent audit of the P8P-R15 operation-detail result."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r15-operation-detail-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r15-operation-detail-diagnosis.md"

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
    "packet_identity": digest(PACKET) == "26d4709a924854d6e2c69547c3527c402148ddb331e5ab4ac0fe0b844105ae9e",
    "classification": "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R15 CLOSED" in text,
    "operation_identity": all(x in text for x in ("operation-1788359293191-65a80d866c37d-36470319-82f52727", "4031327796779650194", "1920090043510946854", "`start`")),
    "capacity_error": "ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS" in text and "currently unavailable in the us-east1-c zone" in flat,
    "chronology": all(x in text for x in ("10:28:13 AM", "10:28:14 AM", "100%")),
    "no_scientific_execution": "no SSH, upload, Docker action, build or P=1024 calibration occurred" in flat,
    "no_mutation": "no start, stop, retry, API query, resource change or fallback" in flat,
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"RESULT_SHA256 {digest(RESULT)}")
raise SystemExit(0 if passed == len(checks) else 1)
