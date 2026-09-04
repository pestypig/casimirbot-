#!/usr/bin/env python3
"""Audit the immutable P8P-R31 capacity-only result."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r31-cloud-fixture-execution-v1-20260904"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r31-capacity-result.md"
OUT = EVIDENCE / "h2-p8p-r31-result-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    result = RESULT.read_text(encoding="utf-8")
    instance = json.loads((EVIDENCE / "instance.pre.json").read_text(encoding="utf-8"))
    disk = json.loads((EVIDENCE / "disk.pre.json").read_text(encoding="utf-8"))
    checks = {
        "required_packet_header": result.startswith("Program gate:") and result.splitlines()[9].startswith("Downstream gate unlocked:"),
        "instance_receipt_identity": sha256(EVIDENCE / "instance.pre.json") == "f60b7fc4aa95cdf60e8d147b1c029d0f2bee9d57c99f06e7d9443e37336ca1c1",
        "disk_receipt_identity": sha256(EVIDENCE / "disk.pre.json") == "2bbe761d8a964b261d3c2f6aa6ca1d54d5bd5571d8fa1419c653985f009686e1",
        "preexecution_receipt_identity": sha256(EVIDENCE / "preexecution.pass.txt") == "66e712e994d7ecf4830acf9155fb28eba14e20803a9f985d1b958b17a14d3168",
        "failure_receipt_identity": sha256(EVIDENCE / "failure.txt") == "ff02f0ecd4a0ecfb0bcb4faff849b6f6c52aec171eb2a12e46a713c4276b3de6",
        "procedure_exit_one": (EVIDENCE / "procedure.exit.txt").read_text(encoding="utf-8") == "1\n",
        "instance_exact_and_stopped": str(instance.get("id")) == "4290604153416687194" and instance.get("status") == "TERMINATED",
        "machine_exact": str(instance.get("machineType", "")).endswith("/machineTypes/c2d-standard-32"),
        "one_attached_disk": len(instance.get("disks", [])) == 1,
        "disk_exact": str(disk.get("id")) == "8031354852430290522" and disk.get("status") == "READY",
        "disk_shape_exact": int(disk.get("sizeGb", 0)) == 30 and str(disk.get("type", "")).endswith("/diskTypes/pd-standard"),
        "google_operation_bound": "operation-1788532682610-65aa937375801-97851995-dccc69f6" in result and "5613652379224729892" in result,
        "capacity_error_bound": "ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS" in result and "stockout" in result and "HTTP 503" in result,
        "no_upload_or_build_claim": "No upload, SSH, Docker daemon" in result and "No upload" in result,
        "no_numerical_or_candidate_claim": "panel\ncalculation" in result and "not a fixture, numerical, scientific,\nor candidate result" in result,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in result,
        "authority_locked": "all authority locks remain false" in result,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r31_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "terminal_classification": "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED",
        "cloud_restart_requests": 1,
        "uploads": 0,
        "fixture_executions": 0,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
        "result_sha256": sha256(RESULT),
    }
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(OUT))
    print(payload["result_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
