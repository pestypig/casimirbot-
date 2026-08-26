#!/usr/bin/env python3
"""Closure audit for the sole G2H-E primary invocation and partial result."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-primary-result.v1.json"
RECEIPT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-primary-verification-receipt.v1.json"
RECEIPT_SIDECAR = RECEIPT.with_suffix(".sha256")
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-primary-result.md"
WORK_PROGRAM = ROOT / "docs/research/nhm2-spherical-boson-star-v2-work-program.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_partial_audit() -> dict[str, object]:
    process = subprocess.run(
        [sys.executable, str(ROOT / "scripts/nhm2_g2h_e_primary_partial_audit.py")],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        capture_output=True,
        check=False,
    )
    if process.returncode != 0:
        raise RuntimeError(f"partial audit failed: {process.stdout}{process.stderr}")
    return json.loads(process.stdout.strip().splitlines()[-1])


def trace_records(path: Path) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.lstrip().startswith("{"):
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            records.append(value)
    return records


def main() -> int:
    partial = run_partial_audit()
    result = json.loads(RESULT.read_text(encoding="utf-8"))
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    math_path = ROOT / receipt["math"]["report"]
    math_report = json.loads(math_path.read_text(encoding="utf-8"))
    warp_path = ROOT / receipt["warp"]["report"]
    warp_report = json.loads(warp_path.read_text(encoding="utf-8"))
    trace_path = ROOT / receipt["casimir"]["training_trace_export"]
    selected = [record for record in trace_records(trace_path) if record.get("id") == "2462"]
    selected_record = selected[0] if len(selected) == 1 else {}
    selected_text = json.dumps(selected_record, separators=(",", ":"), ensure_ascii=False)
    sidecar_fields = RECEIPT_SIDECAR.read_text(encoding="ascii").strip().split()
    work_program = WORK_PROGRAM.read_text(encoding="utf-8")
    packet = " ".join(PACKET.read_text(encoding="utf-8").split())
    authority_keys = (
        "candidate_admitted",
        "classical_proof_established",
        "geometry_state_accepted",
        "lane_execution_authorized",
        "diagnostic_lamp",
        "physical_viability",
        "propulsion_authority",
        "transport_authority",
    )
    checks = {
        "partial_result_audit_16_of_16": partial.get("passed") == 16
        and partial.get("total") == 16
        and all(partial.get("checks", {}).values()),
        "verification_receipt_sidecar_exact": sidecar_fields
        == [sha256(RECEIPT), RECEIPT.name],
        "receipt_binds_partial_result": receipt["primary_result_sha256"] == sha256(RESULT)
        and receipt["primary_result_decision"] == result["decision"]
        and receipt["candidate_evaluations"] == 0
        and receipt["mathematical_decision"] is None,
        "math_318_exact": math_path.stat().st_size == receipt["math"]["report_bytes"]
        and sha256(math_path) == receipt["math"]["report_sha256"]
        and math_report["registryCount"] == 318
        and receipt["math"]["validation"] == "PASS",
        "warp_179_exact": warp_path.stat().st_size == receipt["warp"]["report_bytes"]
        and sha256(warp_path) == receipt["warp"]["report_sha256"]
        and warp_report["success"] is True
        and warp_report["numTotalTests"] == 179
        and warp_report["numPassedTests"] == 179
        and warp_report["numFailedTests"] == 0,
        "casimir_2462_exact": len(selected) == 1
        and selected_record.get("pass") is True
        and selected_record.get("certificate", {}).get("status") == "GREEN"
        and selected_record.get("certificate", {}).get("integrityOk") is True
        and selected_record.get("certificate", {}).get("certificateHash")
        == receipt["casimir"]["certificate_hash"]
        and hashlib.sha256(selected_text.encode("utf-8")).hexdigest()
        == receipt["casimir"]["run_record_sha256_without_line_ending"],
        "canonical_gate_advanced_exactly_once": work_program.count(
            "Active program gate:"
        )
        == 1
        and "Active program gate: **G2H-E-R1 — primary pre-math self-identity failure disposition**"
        in work_program
        and "| G2H-E — Tolman-VII proof execution | closed: immutable pre-math partial execution;"
        in work_program
        and "| G2H-E-R1 — Primary pre-math self-identity failure disposition | active:"
        in work_program,
        "packet_does_not_overclaim": "This is not a Tolman-VII mathematical `FAIL`."
        in packet
        and "candidate evaluations: 0" in packet
        and "surface theorem-assumption gate: not reached" in packet
        and "all false" in packet,
        "no_retry_or_independent_execution": result["primary_candidate_path_invocations"] == 1
        and result["immutable_ledger"]["retry_allowed"] is False
        and result["independent_execution_authorized"] is False
        and result["independent_execution_performed"] is False,
        "all_downstream_authority_locked": all(result[key] is False for key in authority_keys)
        and all(receipt[key] is False for key in authority_keys),
    }
    print(
        json.dumps(
            {
                "schema": "nhm2.g2h_e.primary_closure_audit.v1",
                "decision": result["decision"] if all(checks.values()) else "FAIL",
                "passed": sum(checks.values()),
                "total": len(checks),
                "checks": checks,
            },
            sort_keys=True,
        )
    )
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
