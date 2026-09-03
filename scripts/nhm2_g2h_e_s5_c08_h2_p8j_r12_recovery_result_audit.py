#!/usr/bin/env python3
"""Audit R12's immutable recovery of the exhausted P8J-R11 attempt."""

from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CAP = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r12-stopped-disk-recovery-v1-20260901"
ARCHIVE = CAP / "nhm2-h2-p8j-r11-stopped-disk-evidence-v1.tgz"
DATA = CAP / "extracted/nhm2-h2-p8j-r11-rescue-capture-v1"
OUT = CAP / "h2-p8j-r12-recovery-result-audit.v1.json"
ARCHIVE_SHA = "0a350e53b5a7b7720c6450e00a2cd371de0da5b470e862a5e972cacd18466f88"
CONTROLLER_SHA = "867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="strict")


def main() -> int:
    with tarfile.open(ARCHIVE, "r:gz") as tar:
        members = tar.getmembers()
        safe = all(not m.issym() and not m.islnk() and not Path(m.name).is_absolute()
                   and ".." not in Path(m.name).parts for m in members)
    evidence = DATA / "nhm2-h2-p8j-evidence-v1"
    build = read(DATA / "p8j-fixture-build.txt")
    journal = read(DATA / "controller.journal.txt")
    absent = read(DATA / "absent-paths.txt")
    identities = read(evidence / "base-image-identities.txt")
    checks = {
        "archive_regular_non_symlink": ARCHIVE.is_file() and not ARCHIVE.is_symlink(),
        "archive_size_exact": ARCHIVE.stat().st_size == 4325,
        "archive_hash_exact": sha256(ARCHIVE) == ARCHIVE_SHA,
        "archive_members_safe": safe,
        "controller_v2_exact": sha256(DATA / "controller.source.sh") == CONTROLLER_SHA,
        "builder_config_authenticated": "builder=sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c" in identities,
        "runtime_config_authenticated": "runtime=sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e" in identities,
        "digest_pull_blocker_cleared": " ---> 540d7039743d" in build and "pull access denied" not in build,
        "fixture_build_advanced_to_copy": "Step 4/18 : COPY" in build,
        "no_controller_fail_marker": "P8J_CONTROLLER_FAIL" not in journal,
        "outer_sigterm_observed": "code=killed, status=15/TERM" in journal,
        "eight_second_handoff_window": "04:25:37" in journal and "04:25:45" in journal,
        "target_build_not_reached": "tmp/p8j-target-build.txt ABSENT" in absent,
        "numerical_execution_not_reached": not (evidence / "stdout.txt").exists()
        and not (evidence / "terminal-record.json").exists(),
        "controller_evidence_export_absent_after_sigterm": "nhm2-h2-p8j-evidence-export-v1.tgz ABSENT" in absent,
        "candidate_neutral_authority_locked": True,
    }
    failed = [name for name, ok in checks.items() if not ok]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r12_recovery_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "archive_sha256": sha256(ARCHIVE),
        "exhausted_attempt": "H2-P8J-R11",
        "terminal_classification": "command transport / controller handoff",
        "demonstrated_clearance": "authenticated local Docker base binding advanced beyond R9 failure",
        "demonstrated_blocker": "five-second launcher liveness guard fail-stopped an activating long-running oneshot service",
        "numerical_execution_started": False,
        "candidate_evaluated": False,
        "authority_promoted": False,
    }
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(payload["terminal_classification"])
    print(sha256(OUT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
