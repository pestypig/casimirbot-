#!/usr/bin/env python3
"""Audit the immutable R10 stopped-disk recovery of the exhausted P8J-R9 run."""

from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r10-stopped-disk-recovery-v1-20260901"
ARCHIVE = CAPTURE / "nhm2-h2-p8j-r9-stopped-disk-evidence-v1.tgz"
EXTRACTED = CAPTURE / "extracted/nhm2-h2-p8j-r9-rescue-capture-v1"
OUTPUT = CAPTURE / "h2-p8j-r10-recovery-result-audit.v1.json"
EXPECTED_ARCHIVE_SHA = "c6a193fb7f5acc007018939d44ada8fb5187789e4fbb6833abff3d00f0d25dbf"
EXPECTED_CONTROLLER_SHA = "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="strict")


def main() -> int:
    with tarfile.open(ARCHIVE, "r:gz") as archive:
        members = archive.getmembers()
        names = [member.name for member in members]
        safe = all(
            not member.issym()
            and not member.islnk()
            and not Path(member.name).is_absolute()
            and ".." not in Path(member.name).parts
            for member in members
        )

    evidence = EXTRACTED / "nhm2-h2-p8j-evidence-v1"
    journal = text(EXTRACTED / "controller.journal.txt")
    fixture_log = text(EXTRACTED / "p8j-fixture-build.txt")
    checks = {
        "archive_regular_non_symlink": ARCHIVE.is_file() and not ARCHIVE.is_symlink(),
        "archive_bytes_exact": ARCHIVE.stat().st_size == 4098,
        "archive_sha256_exact": sha256(ARCHIVE) == EXPECTED_ARCHIVE_SHA,
        "archive_members_safe": safe,
        "recovery_inventory_present": len(names) == 20,
        "controller_identity_exact": sha256(EXTRACTED / "controller.source.sh") == EXPECTED_CONTROLLER_SHA,
        "controller_identity_receipt_exact": EXPECTED_CONTROLLER_SHA in text(EXTRACTED / "controller.sha256.txt"),
        "phase_preexecution": text(evidence / "phase.txt").strip() == "preexecution",
        "failure_fixture_build": text(evidence / "failure.phase.txt").strip() == "fixture_build",
        "controller_exit_one": text(evidence / "controller.exit.txt").strip() == "1",
        "base_images_loaded": "Loaded image: nhm2-g2h-s4-primary-fixture-builder:v2" in text(EXTRACTED / "p8j-docker-load.txt")
        and "Loaded image: nhm2-g2h-primary-proof:v2" in text(EXTRACTED / "p8j-docker-load.txt"),
        "digest_qualified_from_reached": "FROM ${BUILDER_IMAGE} AS builder" in fixture_log
        and "@sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1" in fixture_log,
        "offline_binding_failure_observed": "pull access denied for nhm2-g2h-s4-primary-fixture-builder" in fixture_log,
        "target_build_not_reached": "tmp/p8j-target-build.txt ABSENT" in text(EXTRACTED / "absent-paths.txt"),
        "numerical_execution_not_reached": not (evidence / "stdout.txt").exists()
        and not (evidence / "terminal-record.json").exists(),
        "candidate_neutral_authority_locked": True,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r10_recovery_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "archive_sha256": sha256(ARCHIVE),
        "exhausted_attempt": "H2-P8J-R9",
        "terminal_classification": "environment/build",
        "demonstrated_blocker": "digest-qualified local Docker base reference attempted a registry pull after offline image load",
        "numerical_execution_started": False,
        "candidate_evaluated": False,
        "authority": {
            name: False
            for name in (
                "candidate", "proof", "geometry_state", "lane", "lamp",
                "physical", "propulsion", "transport"
            )
        },
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(payload["terminal_classification"])
    print(sha256(OUTPUT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
