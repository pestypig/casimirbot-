#!/usr/bin/env python3
"""Independent inert audit of the H2-P8C terminal-result audit definition."""

from __future__ import annotations

import ast
import hashlib
import json
import subprocess
import sys
import tempfile
from collections import OrderedDict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SUBJECT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8c_result_audit.py"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-result-audit-definition-v1-20260829"
AUDIT = OUT / "h2-p8c-result-audit-definition-independent-audit.v1.json"
EXPECTED_SUBJECT_SHA256 = "e733350cdb6fa8ccd8c17eee8b7a73cae84820fd6e81564b7ef937cd8935a227"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["subject_exists"] = SUBJECT.is_file()
    checks["subject_hash_exact"] = checks["subject_exists"] and sha256(SUBJECT) == EXPECTED_SUBJECT_SHA256
    source = SUBJECT.read_text(encoding="utf-8") if SUBJECT.is_file() else ""
    try:
        tree = ast.parse(source)
        parsed = True
    except SyntaxError:
        tree = ast.Module(body=[], type_ignores=[])
        parsed = False
    checks["python_ast_parses"] = parsed
    imports = {
        node.names[0].name
        for node in ast.walk(tree)
        if isinstance(node, ast.Import) and node.names
    } | {
        node.module or "" for node in ast.walk(tree) if isinstance(node, ast.ImportFrom)
    }
    checks["no_network_cloud_or_process_library"] = not imports.intersection(
        {"requests", "urllib", "http", "socket", "google.cloud", "subprocess"}
    )
    checks["exact_proposal_binding_present"] = "7e8f28d755b5dea7cc212c4d0fda263a84374215680b0a94a179fbb2fbca2ace" in source
    checks["exact_correction_binding_present"] = "aade7e5d8d384500503b4ecd1b2f04f4afcf95bccffd735da309363d01d6c32b" in source
    checks["exact_archive_binding_present"] = "f0a0fabf608949d6755465ddc8f35075631818f383d6ba5eb78ab297152d3c4c" in source
    checks["exact_manifest_binding_present"] = "78fdff467f3ededee3a18be0d6c2f94176a90b65b9e94da140f701f95d2fd868" in source
    checks["exact_binary_binding_present"] = "7e7d78393f933ac103208476f6e8c5beefb5de66b58d93a6b2a080bdf80deb25" in source
    checks["resource_and_process_bindings_present"] = all(
        value in source for value in (
            "nhm2-h2-p8c-diagnostic-c4-16-20260828", "c4-standard-16",
            "hyperdisk-balanced", "nhm2-h2-p8c-diagnostic-process",
        )
    )
    checks["runtime_and_cost_ceilings_present"] = all(
        value in source for value in (
            "PROCESS_TIMEOUT_SECONDS = 50400", "VM_RUNTIME_CEILING_SECONDS = 54000",
            "COST_CEILING_USD = 13.0", "DIAGNOSTIC_MAXIMUM_BYTES = 65536",
        )
    )
    checks["distinct_audit_and_diagnostic_statuses"] = all(
        value in source for value in ("audit_status", "diagnostic_h2_pass", "result_classification")
    )
    checks["valid_fail_and_partial_evidence_supported"] = all(
        value in source for value in (
            "P8C_DIAGNOSTIC_NUMERICAL_FAIL", "P8C_DIAGNOSTIC_TIMEOUT_OR_PARTIAL", "AUDIT_FAIL",
        )
    )
    checks["driver_schema_and_phase_bound"] = all(
        value in source for value in (
            "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_run.v1", "h2_extend",
            "diagnostic_serialized", "terminal_record_ok",
        )
    )
    checks["authority_locks_explicit"] = all(
        value in source for value in (
            "candidate", "proof", "geometry_state", "lane", "lamp",
            "physical", "propulsion", "transport",
        )
    )
    checks["single_process_no_retry_guards_present"] = all(
        value in source for value in ("one_process_only", "no_retry_or_retune", "additional_uploads")
    )
    checks["capture_hash_replay_present"] = all(
        value in source for value in (
            "capture-files.sha256", "capture_manifest_replays_safe_unique_files", "capture_sha256",
        )
    )

    self_test = subprocess.run(
        [sys.executable, str(SUBJECT), "--self-test"], cwd=ROOT, check=False,
        capture_output=True, text=True, timeout=30,
    )
    checks["subject_self_test_4_of_4"] = (
        self_test.returncode == 0 and self_test.stdout.strip() == "4/4 PASS" and self_test.stderr == ""
    )
    with tempfile.TemporaryDirectory(prefix="nhm2-h2-p8c-empty-") as temp:
        empty = Path(temp) / "empty"
        empty.mkdir()
        output = Path(temp) / "audit.json"
        malformed = subprocess.run(
            [sys.executable, str(SUBJECT), "--capture-dir", str(empty), "--output", str(output)],
            cwd=ROOT, check=False, capture_output=True, text=True, timeout=30,
        )
        payload = json.loads(output.read_text(encoding="utf-8")) if output.is_file() else {}
        checks["missing_capture_fails_closed_without_crash"] = (
            malformed.returncode == 1
            and payload.get("audit_status") == "FAIL"
            and payload.get("diagnostic_h2_pass") is False
        )

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8c_result_audit_definition.independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "subject_sha256": sha256(SUBJECT) if SUBJECT.is_file() else None,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "cloud_actions": 0,
        "authority_promoted": False,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha256(AUDIT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
