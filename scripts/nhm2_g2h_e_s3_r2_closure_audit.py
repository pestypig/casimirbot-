#!/usr/bin/env python3
"""Closure audit for G2H-E-S3-R2.

The audit is read-only and performs no candidate implementation or evaluation.
"""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research"
PROTOCOL = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.md"
PROTOCOL_SUM = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.sha256"
MATRIX = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.json"
MATRIX_SUM = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.sha256"
CONTRACT = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json"
CONTRACT_SUM = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.sha256"
RESULT = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-result.md"
R1 = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r1-regularity-disposition.v1.json"
R1_SUM = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-r1-regularity-disposition.v1.sha256"
TOLMAN = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-primary-result.v1.json"
TOLMAN_SUM = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s3-primary-result.v1.sha256"
EXPECTED_PROTOCOL = "f2fec60d0211e8762bee1a1b282dfdf3e38c8ebdbdb220ec068a8b02f2ba6cb2"
EXPECTED_MATRIX = "7f7b7ac889de82d52a2b6fc667e4b458d42ac833f350c91c5c48890266310d03"
EXPECTED_CONTRACT = "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a"
EXPECTED_R1 = "e86dcd1060c9e753c5fef3a8d4bfb21d974244b7fd108d6b669765389902ec0a"
EXPECTED_TOLMAN = "4248b29a38588dc6c1b1a0c283bb78399eabd3d815376d0ddad3fd7e481392d7"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sidecar(path: Path) -> str:
    return path.read_text(encoding="ascii").split()[0]


def run_json(script: str) -> tuple[bool, dict[str, object]]:
    proc = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / script)],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    try:
        payload = json.loads(proc.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        payload = {"stdout": proc.stdout, "stderr": proc.stderr}
    return proc.returncode == 0, payload


def main() -> int:
    matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    result_text = RESULT.read_text(encoding="utf-8")
    primary_ok, primary = run_json("nhm2_g2h_e_s3_r2_select.py")
    replay_ok, replay = run_json("nhm2_g2h_e_s3_r2_independent_replay.py")
    future = contract["preexecution_boundaries"]
    primary_root = ROOT / str(future["future_primary_root"])
    independent_root = ROOT / str(future["future_independent_root"])
    authority = contract["authority"]
    expected_false = [key for key in authority if key != "replacement_selected_for_future_proof"]
    header_labels = [
        "Program gate:", "Workstream:", "Capability or component:", "Current maturity:",
        "Target maturity:", "Required frozen inputs:", "Required evidence:",
        "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:",
    ]
    checks = {
        "protocol_hash": digest(PROTOCOL) == sidecar(PROTOCOL_SUM) == EXPECTED_PROTOCOL,
        "matrix_hash": digest(MATRIX) == sidecar(MATRIX_SUM) == EXPECTED_MATRIX,
        "contract_hash": digest(CONTRACT) == sidecar(CONTRACT_SUM) == EXPECTED_CONTRACT,
        "r1_hash_preserved": digest(R1) == sidecar(R1_SUM) == EXPECTED_R1,
        "tolman_result_hash_preserved": digest(TOLMAN) == sidecar(TOLMAN_SUM) == EXPECTED_TOLMAN,
        "primary_selector_pass": primary_ok and all(primary.get("checks", {}).values()),
        "independent_replay_pass": replay_ok and all(replay.get("checks", {}).values()),
        "selectors_agree": primary.get("decision") == replay.get("decision") == matrix["expected_decision"],
        "winner_identity_bound": contract["scientific_identity"] == matrix["expected_decision"]["scientific_identity"],
        "winner_family_bound": contract["family_identity"] == matrix["expected_decision"]["selected_id"],
        "rank_bound": contract["selection_binding"]["rank"] == matrix["expected_decision"]["rank"],
        "matrix_binding": contract["selection_binding"]["matrix_sha256"] == EXPECTED_MATRIX,
        "exact_member": contract["frozen_member"]["source_coordinate_exact_ingress"] == "6/5",
        "no_finite_interface": contract["boundary_and_global_conditions"]["finite_interfaces"] == "none",
        "global_domain": "asymptotically flat end" in contract["boundary_and_global_conditions"]["global_domain"],
        "classical_duty_count": len(contract["ordered_classical_proof_duties"]) == 15,
        "quantum_duty_count": len(contract["ordered_quantum_proof_duties"]) == 6,
        "grids_exact": contract["proof_grids_and_partitions"]["full_solve_grids"] == [64, 96, 128, 256],
        "fixed_precision": contract["proof_arithmetic"]["working_precision_bits"] == 512,
        "runtime_disjoint": "no shared" in contract["future_implementations"]["disjointness"],
        "primary_not_implemented": contract["future_implementations"]["primary"]["status"] == "not_implemented_not_authorized",
        "rust_not_implemented": contract["future_implementations"]["independent"]["status"] == "not_implemented_not_authorized",
        "future_primary_root_absent": not primary_root.exists(),
        "future_independent_root_absent": not independent_root.exists(),
        "r2_execution_forbidden": future["r2_may_execute_candidate"] is False,
        "r2_authorization_forbidden": future["r2_may_authorize_primary"] is False and future["r2_may_authorize_independent"] is False,
        "historical_count_preserved": matrix["historical_tolman_candidate_evaluations"] == 1,
        "new_evaluations_zero": matrix["r2_candidate_evaluations"] == 0,
        "selection_only_true": authority["replacement_selected_for_future_proof"] is True,
        "all_scientific_authority_locked": all(authority[key] is False for key in expected_false),
        "result_header_exact": result_text.splitlines()[:10] == [line for line in result_text.splitlines()[:10] if any(line.startswith(label) for label in header_labels)] and len(result_text.splitlines()[:10]) == 10,
        "result_contract_hash": EXPECTED_CONTRACT in result_text,
        "result_caveat": "definition selection" in result_text and "not a passing scientific result" in result_text,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s3_r2.closure_audit.v1",
        "verdict": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "failed": failed,
        "checks": checks,
        "decision": matrix["expected_decision"],
        "authority": authority,
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
