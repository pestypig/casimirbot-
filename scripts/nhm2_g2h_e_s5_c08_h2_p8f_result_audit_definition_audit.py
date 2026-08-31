#!/usr/bin/env python3
"""Independent static audit of the frozen H2-P8F result-audit definition."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from collections import OrderedDict
from pathlib import Path


EXPECTED_AUDITOR_SHA = "1c42d80d856af8b19cd2baeb7250928de0cf331848ceadf84bf34ea083f58517"
EXPECTED_AUDITOR_BYTES = 16401
FIELDS = (
    "Program gate:", "Workstream:", "Capability or component:",
    "Current maturity:", "Target maturity:", "Required frozen inputs:",
    "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
    "Downstream gate unlocked:",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    repo = args.repo.resolve()
    auditor = repo / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_result_audit.py"
    packet = repo / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-result-audit-definition.md"
    evidence = repo / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-local-representative-run-v1-20260830"
    source = auditor.read_text(encoding="utf-8") if auditor.is_file() else ""
    doc = packet.read_text(encoding="utf-8") if packet.is_file() else ""
    try:
        tree = ast.parse(source)
        ast_ok = True
    except SyntaxError:
        tree = ast.parse("pass")
        ast_ok = False
    imports = {
        node.names[0].name for node in ast.walk(tree)
        if isinstance(node, ast.Import) and node.names
    } | {
        node.module or "" for node in ast.walk(tree)
        if isinstance(node, ast.ImportFrom)
    }
    calls = {
        node.func.id for node in ast.walk(tree)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
    }
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["auditor_exists"] = auditor.is_file()
    checks["packet_exists"] = packet.is_file()
    checks["auditor_identity_exact"] = auditor.is_file() and sha256(auditor) == EXPECTED_AUDITOR_SHA
    checks["auditor_bytes_exact"] = auditor.is_file() and auditor.stat().st_size == EXPECTED_AUDITOR_BYTES
    checks["auditor_python_ast_valid"] = ast_ok
    checks["packet_has_exact_leading_fields"] = doc.splitlines()[:10] and all(
        doc.splitlines()[index].startswith(field) for index, field in enumerate(FIELDS)
    )
    checks["no_process_or_network_import"] = not ({"subprocess", "socket", "requests", "urllib"} & imports)
    checks["no_process_spawn_calls"] = not ({"system", "popen", "exec", "eval"} & calls)
    checks["exact_terminal_inventory_frozen"] = "exact_terminal_file_inventory" in source and "REQUIRED_FILES" in source
    checks["exact_container_bound"] = "8cacecb98e7855f05af70d2d89c15f20f3df8fb865a69255ad1aab76d1252ec1" in source
    checks["exact_image_bound"] = "ec6ab2ada583d575fd2faedbef0ec6bdb865c44014d3eb3660a8b5c537c2defd" in source
    checks["exact_executable_bound"] = "12aa0158d56340a7fb7a545c4d2a5bc918c76148ba37548de2988cb968790d20" in source
    checks["timeout_exact"] = "TIMEOUT_SECONDS = 43_200" in source
    checks["representative_target_exact"] = all(token in source for token in (
        'record.get("panel_count") == 65_536', 'record.get("thread_count") == 16',
        'record.get("target_degree") == 3', 'record.get("target_jet") == 9',
        'record.get("terms_per_panel") == 4',
        'record.get("elementary_terms_observed") == 262_144',
    ))
    checks["reconstruction_required"] = "reconstruction_and_parent_invariants" in source
    checks["authority_locks_required"] = "authority_locks_false_when_present" in source
    checks["width_failure_reproduction_required"] = "representative_width_failure_reproduced" in source
    checks["zero_width_decision_required"] = "one_candidate_only_no_width_decision" in source
    checks["ratio_replay_required"] = "reported_ratios_replay" in source
    checks["slot_sum_replay_required"] = "slot_sum_replays_elementary_total" in source
    checks["decision_order_outer_first"] = source.find("final_radius > elementary") < source.find("boundary > nonboundary")
    checks["decision_order_boundary_second"] = source.find("boundary > nonboundary") < source.find("len(maxima) == 1")
    checks["all_four_classifications_named"] = all(name in source for name in (
        "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD",
        "P8G_BOUNDARY_CONTRIBUTION_ENCLOSURE_LEAD",
        "P8G_NONBOUNDARY_SLOT_", "P8G_DISTRIBUTED_NONBOUNDARY_ENCLOSURE_LEAD",
    ))
    checks["timeout_selects_no_causal_lead"] = "P8F_TIMEOUT_PARTIAL_NO_CAUSAL_SELECTION" in source
    checks["execution_fail_selects_no_causal_lead"] = "P8F_EXECUTION_FAIL_NO_CAUSAL_SELECTION" in source
    checks["audit_fail_selects_nothing"] = 'classification, facts = "AUDIT_FAIL", {}' in source
    checks["candidate_authority_false_in_receipt"] = '"candidate_evaluated": False' in source
    checks["physical_authority_false_in_receipt"] = '"physical", "propulsion", "transport"' in source
    checks["packet_forbids_live_control"] = "cannot inspect the\nrunning container, invoke Docker" in doc
    checks["packet_forbids_second_run"] = "second P8F run" in doc
    checks["live_terminal_evidence_not_yet_complete"] = evidence.is_dir() and not (evidence / "finish.utc.txt").exists()
    passed = sum(checks.values())
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_result_audit_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "auditor_sha256": sha256(auditor) if auditor.is_file() else None,
        "packet_sha256": sha256(packet) if packet.is_file() else None,
        "live_result_read": False,
        "candidate_evaluated": False,
        "authority": {name: False for name in (
            "candidate", "proof", "geometry_state", "lane", "lamp",
            "physical", "propulsion", "transport",
        )},
    }
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{passed}/{len(checks)} {payload['status']}")
    print(sha256(output))
    return 0 if payload["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
