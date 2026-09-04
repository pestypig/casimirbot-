#!/usr/bin/env python3
"""Audit the immutable P8P-R32 partial-ingress result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
E = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r32-cloud-fixture-execution-v1-20260904"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r32-upload-result.md"
OUT = E / "h2-p8p-r32-result-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    result = RESULT.read_text(encoding="utf-8")
    instance = json.loads((E / "instance.running.json").read_text(encoding="utf-8"))
    failure = (E / "failure.txt").read_text(encoding="utf-8")
    checks = {
        "header": result.startswith("Program gate:") and result.splitlines()[9].startswith("Downstream gate unlocked:"),
        "create_receipt": sha256(E / "create.json") == "a3aa0e6272475f4e3919e4e6ddf7e54c018b280c79f36a3a68f2dbcc24bf56c4",
        "instance_receipt": sha256(E / "instance.running.json") == "14754e53cbdab63c75608c4d6fec841c4a652f5bf50631068cb57e6becc3ebf0",
        "failure_receipt": sha256(E / "failure.txt") == "bec6656723af894fc573b22f4cecc71b67084221ae17098bfe58d428f338befa",
        "stop_receipt": sha256(E / "cleanup-stop.txt") == "d3d985da9a345924fcaa652c6f5419ac64a49ff7c0f50e4462851de663079f36",
        "procedure_exit": (E / "procedure.exit.txt").read_text(encoding="utf-8") == "1\n",
        "instance_identity": str(instance.get("id")) == "1893159507643031574",
        "resource_shape": str(instance.get("machineType", "")).endswith("/machineTypes/e2-standard-4") and len(instance.get("disks", [])) == 1 and int(instance["disks"][0]["diskSizeGb"]) == 30,
        "archive_path_failure": "h2-p8p-r16-regional-bulk-upload-v1.tar: No such file or directory" in failure,
        "two_small_transfers": failure.count("100%") == 2,
        "scp_failed": "gcloud.compute.scp" in failure and "return code [1]" in failure,
        "metadata_update_observed": "Updating project ssh metadata" in failure,
        "no_guest_or_build": "No guest command was submitted" in result and "no image load" in result,
        "no_numerical_or_candidate": "panel calculation" in result and "candidate action occurred" in result,
        "terminated_poststate": "authenticated `TERMINATED`" in result,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in result,
        "authority_false": "all authority remains false" in result,
    }
    failed = [k for k, v in checks.items() if not v]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r32_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()), "checks_total": len(checks),
        "checks": checks, "failed": failed,
        "classification": "BLOCKED_PREEXECUTION_WINDOWS_SPACE_PATH_SCP",
        "vm_creations": 1, "scp_batches": 1, "archive_bytes_transferred": 0,
        "small_files_transferred": 2, "guest_commands": 0, "fixture_executions": 0,
        "numerical_runs": 0, "candidate_evaluated": False, "authority_promoted": False,
        "result_sha256": sha256(RESULT),
    }
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(OUT)); print(payload["result_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())

