#!/usr/bin/env python3
"""Static audit of the P8P-R15 exact operation-detail diagnosis."""
from __future__ import annotations
import hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r15-operation-detail-diagnosis.md"
R14_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r14-operation-row-result.md"
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
    "r14_identity": digest(R14_RESULT) == "7ee62c6eac0ac84828f86e38de2e0a96a4e988ed1ab29ec883fe519f12aaeb89",
    "read_only": "FROZEN READ-ONLY DETAIL INSPECTION / ZERO BILLABLE ACTION" in text,
    "exact_row": all(x in text for x in ("10:28:13 AM", "10:28:14 AM", "`DONE`", "`us-east1-c`", "`pestypig@gmail.com`")),
    "one_link_read": "activate exactly once" in flat and "exactly one accessibility read" in flat,
    "fields": "terminal status, error code and error message" in flat,
    "no_actions": all(x in flat for x in ("may not click another control", "refresh", "query an API", "start or stop a resource", "retry", "fallback")),
    "p8q_stop": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
}
for name, passed in checks.items(): print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
