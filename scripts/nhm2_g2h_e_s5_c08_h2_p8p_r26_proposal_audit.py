#!/usr/bin/env python3
"""Static audit of the candidate-neutral H2-P8P-R26 proposal."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r26-local-gcloud-successor-proposal.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r26_local_gcloud_controller_v1.ps1"
ARCHIVE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r16-regional-bulk-ingress-v1-20260902/h2-p8p-r16-regional-bulk-upload-v1.tar"
R25_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r25-authentication-result.md"
AUDITOR = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_turnaround_result_audit.py"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
controller = CONTROLLER.read_text(encoding="utf-8")
checks = {
    "required_header": all(item in text for item in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:",
    )),
    "r25_identity": digest(R25_RESULT) == "4458c10c8da75d8cf2adb32c8fe8f6727c67c7482f7b781d93138656cdc68cc6",
    "controller_identity": CONTROLLER.stat().st_size == 13377 and digest(CONTROLLER) == "50c2743a6f2e61fc61a0e9df53b8806db8f1b41a26297cd647f1087517ae1a24",
    "archive_identity": ARCHIVE.stat().st_size == 236640768 and digest(ARCHIVE) == "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5",
    "auditor_present": AUDITOR.is_file(),
    "exact_project_account": "pestypig@gmail.com" in text and "dark-stratum-455714-h4" in text,
    "one_regional_request": "exactly one regional bulk request" in flat and "'compute','instances','bulk','create'" in controller,
    "one_vm": "nhm2-h2-p8p-r26-c2d-32-20260903" in text and "--count=1" in controller and "--min-count=1" in controller,
    "resource_binding": all(value in text for value in ("c2d-standard-32", "ANY_SINGLE_ZONE", "debian-12-bookworm-v20260817", "30 GB `pd-standard`")),
    "zone_allow_set": all(zone in text and zone in controller for zone in ("us-east1-b", "us-east1-c", "us-east1-d")),
    "cost_runtime": "18,000 seconds" in text and "`$9.00`" in text and "$RuntimeCeilingSeconds = 18000" in controller,
    "one_transport": "exactly one SCP" in flat and "one SSH handoff" in flat,
    "scientific_binding": all(value in text for value in (
        "d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6",
        "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718",
        "P=1024", "32 CPUs", "14,400-second",
    )),
    "offline_build": "builds with no pull and no network" in flat,
    "evidence_root_absent": "initially absent local evidence root" in flat and "R26 evidence root already exists" in controller,
    "bounded_cleanup": "exactly one project-wide exact-name discovery query" in flat and "failure-cleanup-discovery.json" in controller,
    "cleanup_zone_guard": "if ($zone -notin @('us-east1-b','us-east1-c','us-east1-d')) { $zone = $null }" in controller,
    "automatic_stop": "stop the exact VM automatically or through the bounded failure cleanup" in flat,
    "first_failure": "First failure is terminal and consumes R26" in flat,
    "no_retry": "No second controller invocation" in flat and "I do not authorize a retry" in flat,
    "candidate_neutral": "Candidate evaluations and positive samples remain zero" in flat,
    "p8q_only": "only supply the frozen P8Q resource-bounded yes/no decision" in flat,
    "authority_locks": "physical, propulsion and transport authority remain false" in flat,
    "no_cloud_action": "NO R26 COMPUTE ENGINE CALL OR RESOURCE ACTION" in text,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
