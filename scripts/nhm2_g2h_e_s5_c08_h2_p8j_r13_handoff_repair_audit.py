#!/usr/bin/env python3
"""Audit the candidate-neutral R13 controller-handoff repair."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
R11 = G2H / "h2_p8j_r11_cloudshell_orchestrator_v1.sh"
R13 = G2H / "h2_p8j_r13_cloudshell_orchestrator_v1.sh"
CONTROLLER = G2H / "h2_p8j_cloud_run_v2.sh"
R12_AUDIT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r12-stopped-disk-recovery-v1-20260901/h2-p8j-r12-recovery-result-audit.v1.json"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r13-handoff-repair-v1-20260901"
REPORT = OUT / "h2-p8j-r13-handoff-repair-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    old = R11.read_text(encoding="utf-8")
    new = R13.read_text(encoding="utf-8")
    recovered = json.loads(R12_AUDIT.read_text(encoding="utf-8"))
    checks = {
        "r11_identity_exact": sha256(R11) == "cbb7682ac579585e818e2dbca0cf6ee2e5c2970de0834818d30ef06a5a16340a",
        "r13_identity_exact": sha256(R13) == "12e5119794dc8fe39ce350a812499e800d95ad63d969e0a4c6401e8aba65a0b5",
        "controller_v2_unchanged": sha256(CONTROLLER) == "867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01",
        "r12_audit_pass": recovered.get("status") == "PASS" and recovered.get("checks_passed") == 16,
        "r12_handoff_classification": recovered.get("terminal_classification") == "command transport / controller handoff",
        "old_check_identified": "systemctl is-active --quiet nhm2-h2-p8j-r11.service" in old,
        "active_state_exact": 'ACTIVE_STATE="$(sudo systemctl show nhm2-h2-p8j-r13.service --property=ActiveState --value)"' in new,
        "sub_state_exact": 'SUB_STATE="$(sudo systemctl show nhm2-h2-p8j-r13.service --property=SubState --value)"' in new,
        "main_pid_exact": 'MAIN_PID="$(sudo systemctl show nhm2-h2-p8j-r13.service --property=MainPID --value)"' in new,
        "activating_start_required": '[[ "$ACTIVE_STATE" == activating && "$SUB_STATE" == start ]]' in new,
        "live_process_required": '[[ "$MAIN_PID" =~ ^[1-9][0-9]*$ ]]' in new and 'sudo kill -0 "$MAIN_PID"' in new,
        "single_controller_start": new.count("systemctl start --no-block") == 1,
        "same_archives_and_controller": all(token in new for token in (
            "BASE_SHA=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
            "OVERLAY_SHA=3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7",
            "CONTROLLER_SHA=867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01")),
        "same_resource_bounds": "--machine-type=c2d-standard-32" in new and "--max-run-duration=25h" in new
        and "--boot-disk-size=30GB --boot-disk-type=pd-standard" in new,
        "no_scientific_definition_change": all(token not in new for token in (
            "positive_parameter", "candidate_root", "authority_promoted=true", "retune")),
    }
    failed = [name for name, ok in checks.items() if not ok]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r13_handoff_repair_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "r13_sha256": sha256(R13),
        "repair_scope": "controller handoff liveness check only",
        "scientific_definitions_changed": False,
        "numerical_runs": 0,
        "authority_promoted": False,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(REPORT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
