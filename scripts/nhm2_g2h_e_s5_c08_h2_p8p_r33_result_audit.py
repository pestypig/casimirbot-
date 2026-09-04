#!/usr/bin/env python3
"""Audit the immutable P8P-R33 local hard-link failure result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r33-local-hardlink-result.md"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r33-local-hardlink-result-v1-20260904/h2-p8p-r33-result-audit.v1.json"
SOURCE = Path(r"C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r16-regional-bulk-ingress-v1-20260902\h2-p8p-r16-regional-bulk-upload-v1.tar")
TARGET = Path(r"C:\NHM2-R33\p8p.tar")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    result = RESULT.read_text(encoding="utf-8")
    checks = {
        "header": result.startswith("Program gate:") and result.splitlines()[9].startswith("Downstream gate unlocked:"),
        "source_exists": SOURCE.is_file(),
        "source_length": SOURCE.stat().st_size == 236_640_768,
        "source_hash": sha256(SOURCE) == "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5",
        "source_path_boundary": len(str(SOURCE)) == 260,
        "target_absent": not TARGET.exists(),
        "failure_preserved": "The system cannot find the path specified." in result,
        "r33_exhausted": "R33 stopped at its first failure" in result,
        "zero_cloud_actions": "R32 VM was not restarted" in result and "no SSH, SCP" in result,
        "zero_scientific_execution": "numerical process" in result and "candidate evaluation" in result,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in result,
        "authority_false": "authority\nremains false" in result,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r33_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "classification": "BLOCKED_LOCAL_PREEXECUTION_LEGACY_MAX_PATH",
        "local_hardlink_attempts": 1,
        "cloud_actions": 0,
        "uploads": 0,
        "fixture_executions": 0,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
        "result_sha256": sha256(RESULT),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(OUT))
    print(payload["result_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
