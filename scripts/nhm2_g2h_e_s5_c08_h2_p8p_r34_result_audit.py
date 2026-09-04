#!/usr/bin/env python3
"""Audit the immutable P8P-R34 extended-path hard-link failure."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r34-extended-path-result.md"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r34-extended-path-result-v1-20260904/h2-p8p-r34-result-audit.v1.json"
SOURCE = Path(r"C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r16-regional-bulk-ingress-v1-20260902\h2-p8p-r16-regional-bulk-upload-v1.tar")
TARGET = Path(r"C:\NHM2-R34\p8p.tar")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    text = RESULT.read_text(encoding="utf-8")
    checks = {
        "header": text.startswith("Program gate:") and text.splitlines()[9].startswith("Downstream gate unlocked:"),
        "source_exists": SOURCE.is_file(),
        "source_bytes": SOURCE.stat().st_size == 236_640_768,
        "source_hash": sha256(SOURCE) == "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5",
        "target_absent": not TARGET.exists(),
        "one_invocation": "spelling exactly once" in text,
        "native_error": "Error 3: The system cannot find the path specified." in text and "process exit 1" in text,
        "r34_exhausted": "R34 stopped at its first failure" in text,
        "zero_cloud": "VM was not restarted" in text and "cloud charge occurred" in text,
        "zero_scientific": "numerical process" in text and "candidate evaluation" in text,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,
        "authority_false": "authority\nremains false" in text,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r34_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "classification": "BLOCKED_LOCAL_PREEXECUTION_EXTENDED_PATH_UNRESOLVED",
        "hardlink_attempts": 1,
        "cloud_actions": 0,
        "uploads": 0,
        "builds": 0,
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
