#!/usr/bin/env python3
"""Independent audit of the P8P-R16 Cloud Shell surface failure."""
from __future__ import annotations
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r16-cloudshell-surface-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r16-regional-bulk-successor-proposal.md"
ARCHIVE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r16-regional-bulk-ingress-v1-20260902/h2-p8p-r16-regional-bulk-upload-v1.tar"
ORCHESTRATOR = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r16_cloudshell_orchestrator_v1.sh"

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
    "proposal_identity": PROPOSAL.stat().st_size == 9335 and digest(PROPOSAL) == "f306ffb38627d2951dc37bbdfb2b95f5190a39e06d9052d6dfbd55fd59dc5169",
    "archive_identity": ARCHIVE.stat().st_size == 236640768 and digest(ARCHIVE) == "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5",
    "orchestrator_identity": ORCHESTRATOR.stat().st_size == 6874 and digest(ORCHESTRATOR) == "74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938",
    "classification": "BLOCKED_PREEXECUTION_CLOUD_SHELL_SURFACE_NOT_OBSERVED / R16 EXHAUSTED" in text,
    "one_activation": "activated that semantic item exactly once" in flat,
    "passive_observation": "passive waits of 10 and 15 seconds" in flat and "One screenshot" in flat,
    "no_retry": "No second activation, keyboard shortcut, direct Cloud Shell URL" in flat,
    "no_upload": "archive was not uploaded or transmitted" in flat,
    "zero_cloud_action": "No Cloud Shell command, regional bulk request, VM/disk creation" in flat,
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
