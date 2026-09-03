#!/usr/bin/env python3
"""Independent static audit for the P8P browser result and R1 image correction."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "research"
ORIGINAL = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-turnaround-cloud-execution-proposal.md"
AMENDMENT = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-browser-ssh-transport-amendment.md"
RESULT = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-browser-ssh-preexecution-result.md"
CORRECTION = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r1-browser-image-binding-correction.md"
PROGRAM = DOCS / "nhm2-spherical-boson-star-v2-work-program.md"
P8P = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-observer-progress-turnaround-calibration.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()

    original = ORIGINAL.read_text(encoding="utf-8")
    amendment = AMENDMENT.read_text(encoding="utf-8")
    result = RESULT.read_text(encoding="utf-8")
    correction = CORRECTION.read_text(encoding="utf-8")
    result_flat = " ".join(result.split())
    correction_flat = " ".join(correction.split())
    program = PROGRAM.read_text(encoding="utf-8")
    p8p = P8P.read_text(encoding="utf-8")

    old_image = "projects/debian-cloud/global/images/debian-12-bookworm-v20260817"
    new_image = "projects/debian-cloud/global/images/debian-12-bookworm-v20260826"
    original_sha = "2b533a983120cd23e6b7bf3b4fbc5f3546e69000c67a91ee4033f98a2b14be80"
    amendment_sha = "373cc75ffba5f944feda351b2e91f99d792edbced0f2e52ed555de63adddb682"

    checks = [
        ("original_sha", sha256(ORIGINAL) == original_sha),
        ("amendment_sha", sha256(AMENDMENT) == amendment_sha),
        ("result_header", result.startswith("Program gate:")),
        ("correction_header", correction.startswith("Program gate:")),
        ("result_terminal_status", "BLOCKED_PREEXECUTION_EXACT_IMAGE_UNAVAILABLE_IN_BROWSER_UI" in result),
        ("result_old_image", old_image in result),
        ("result_no_match", 'No matches for "20260817"' in result),
        ("result_zero_vm", "No VM or disk was created" in result),
        ("result_zero_upload", "Neither archive was uploaded" in result),
        ("result_zero_docker", "Docker was not installed" in result_flat),
        ("result_zero_controller", "controller and calibration executable were not invoked" in result_flat),
        ("result_zero_p8q", "P8Q was not evaluated" in result),
        ("result_authority_false", "authority remain false" in result),
        ("correction_old_image", old_image in correction),
        ("correction_new_image", correction.count(new_image) >= 2),
        ("correction_original_sha", original_sha in correction),
        ("correction_amendment_sha", amendment_sha in correction),
        ("correction_machine", "`c2d-standard-32`" in correction),
        ("correction_disk", "30 GB `pd-standard`" in correction_flat),
        ("correction_runtime", "18,000-second aggregate runtime" in correction),
        ("correction_cost", "$9.00 ceiling" in correction),
        ("correction_one_process", "one P=1024 process" in correction),
        ("correction_timeout", "14,400-second external timeout" in correction),
        ("correction_offline", "build remains offline" in correction),
        ("correction_no_semantics", "does not change container base images, source bytes, mathematics" in correction_flat),
        ("correction_requires_authorization", "requires separate\n+authorization" not in correction and "Exact authorization text" in correction),
        ("program_result_link", RESULT.name in program),
        ("program_correction_link", CORRECTION.name in program),
        ("p8p_result_link", RESULT.name in p8p),
        ("p8p_correction_link", CORRECTION.name in p8p),
        ("original_unchanged_image", old_image in original),
        ("amendment_unchanged_image", old_image in amendment),
    ]

    failed = [name for name, ok in checks if not ok]
    receipt = {
        "schema": "nhm2.h2.p8p.r1.image_binding_audit.v1",
        "verdict": "PASS" if not failed else "FAIL",
        "passed": len(checks) - len(failed),
        "total": len(checks),
        "failed": failed,
        "inputs": {
            "original_sha256": sha256(ORIGINAL),
            "amendment_sha256": sha256(AMENDMENT),
            "result_sha256": sha256(RESULT),
            "correction_sha256": sha256(CORRECTION),
            "program_sha256": sha256(PROGRAM),
            "p8p_sha256": sha256(P8P),
        },
        "authority_promotion": False,
        "cloud_resource_created": False,
        "numerical_process_executed": False,
    }
    rendered = json.dumps(receipt, indent=2, sort_keys=True) + "\n"
    print(rendered, end="")
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(rendered, encoding="utf-8", newline="\n")
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
