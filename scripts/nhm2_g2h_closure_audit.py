#!/usr/bin/env python3
"""Final independent closure audit for G2H implementation/preexecution."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORK_PROGRAM = ROOT / "docs/research/nhm2-spherical-boson-star-v2-work-program.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-result.md"
RECEIPT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-verification-receipt.v1.json"
RECEIPT_SIDECAR = RECEIPT.with_suffix(".sha256")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sidecar_exact(path: Path, sidecar: Path) -> bool:
    fields = sidecar.read_text(encoding="ascii").strip().split()
    return len(fields) == 2 and fields[0] == sha256(path) and fields[1] == path.name


def run_json_audit(script: str) -> dict[str, object]:
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / script)],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"subaudit failed: {script}: {result.stdout}{result.stderr}")
    return json.loads(result.stdout.strip().splitlines()[-1])


def main() -> int:
    build = run_json_audit("nhm2_g2h_proof_build_audit.py")
    fixture = run_json_audit("nhm2_g2h_r2_fixture_audit.py")
    proposal = run_json_audit("nhm2_g2h_e_proposal_audit.py")
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    math_report_path = ROOT / receipt["math"]["report"]
    math_report = json.loads(math_report_path.read_text(encoding="utf-8"))
    warp_report_path = ROOT / receipt["warp"]["report"]
    warp_report = json.loads(warp_report_path.read_text(encoding="utf-8"))
    trace_path = ROOT / receipt["casimir"]["training_trace_export"]
    trace_records: list[dict[str, object]] = []
    for line in trace_path.read_text(encoding="utf-8").splitlines():
        if not line.lstrip().startswith("{"):
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            trace_records.append(value)
    run_records = [record for record in trace_records if record.get("id") == "2461"]
    run_record = run_records[0] if len(run_records) == 1 else {}
    run_record_text = json.dumps(run_record, separators=(",", ":"), ensure_ascii=False)
    work_program = WORK_PROGRAM.read_text(encoding="utf-8")
    result_packet = RESULT.read_text(encoding="utf-8")
    normalized_result = " ".join(result_packet.split())
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
    candidate_roots = (
        ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v1",
        ROOT / "artifacts/research/nhm2/g2h/tolman-vii-independent-v1",
    )
    authorization_records = (
        ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt",
        ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt",
    )
    checks = {
        "proof_build_audit_26_of_26": build.get("passed") == 26
        and build.get("total") == 26
        and all(build.get("checks", {}).values()),
        "fixture_receipt_audit_13_of_13": len(fixture.get("checks", {})) == 13
        and all(fixture.get("checks", {}).values()),
        "inert_proposal_audit_14_of_14": proposal.get("passed") == 14
        and proposal.get("total") == 14
        and all(proposal.get("checks", {}).values()),
        "verification_receipt_sidecar_exact": sidecar_exact(RECEIPT, RECEIPT_SIDECAR),
        "math_receipt_exact": math_report_path.stat().st_size
        == receipt["math"]["report_bytes"]
        and sha256(math_report_path) == receipt["math"]["report_sha256"]
        and math_report["registryCount"] == 318
        and receipt["math"]["validation"] == "PASS",
        "warp_receipt_exact": warp_report_path.stat().st_size
        == receipt["warp"]["report_bytes"]
        and sha256(warp_report_path) == receipt["warp"]["report_sha256"]
        and warp_report["success"] is True
        and warp_report["numTotalTests"] == 179
        and warp_report["numPassedTests"] == 179
        and warp_report["numFailedTests"] == 0,
        "casimir_run_2461_exact": len(run_records) == 1
        and run_record.get("pass") is True
        and run_record.get("certificate", {}).get("status") == "GREEN"
        and run_record.get("certificate", {}).get("integrityOk") is True
        and run_record.get("certificate", {}).get("certificateHash")
        == receipt["casimir"]["certificate_hash"]
        and hashlib.sha256(run_record_text.encode("utf-8")).hexdigest()
        == receipt["casimir"]["run_record_sha256_without_line_ending"],
        "candidate_roots_absent": all(not path.exists() for path in candidate_roots),
        "authorization_records_absent": all(
            not path.exists() for path in authorization_records
        ),
        "zero_execution_and_authority": receipt["candidate_execution_performed"] is False
        and receipt["candidate_evaluations"] == 0
        and all(receipt[key] is False for key in authority_keys),
        "work_program_single_active_gate": work_program.count("Active program gate:") == 1
        and "Active program gate: **G2H-E — Tolman-VII proof execution authorization decision**"
        in work_program
        and "| G2H — Tolman-VII proof implementation/preexecution | closed:"
        in work_program
        and "| G2H-E — Tolman-VII proof execution | active:" in work_program,
        "result_packet_claim_boundary": result_packet.startswith("Program gate:")
        and "PASS_IMPLEMENTATION_PREEXECUTION_ONLY" in result_packet
        and "does not authorize G2H-E" in normalized_result
        and "all remain false" in normalized_result,
    }
    print(
        json.dumps(
            {
                "schema": "nhm2.g2h.closure_audit.v1",
                "decision": "PASS_IMPLEMENTATION_PREEXECUTION_ONLY"
                if all(checks.values())
                else "FAIL",
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
