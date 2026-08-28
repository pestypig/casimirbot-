#!/usr/bin/env python3
"""Independent inert audit of the H2-P7 result-audit definition."""

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
SUBJECT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p7_parent_result_audit.py"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-result-audit-definition-v1-20260828"
AUDIT = OUT / "h2-p7-result-audit-definition-independent-audit.v1.json"
EXPECTED_SUBJECT_SHA256 = "53e2e45cbe678756852f4f8233563772d833becb598175530fbde17c20f43bb0"


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
        node.module or ""
        for node in ast.walk(tree)
        if isinstance(node, ast.ImportFrom)
    }
    checks["no_network_or_cloud_library"] = not imports.intersection(
        {"requests", "urllib", "http", "socket", "google.cloud", "subprocess"}
    )
    checks["exact_proposal_binding_present"] = "3f15f387c95079d2049f346e260cd8b31e51732ea903b06ae11f8feb0eabfdc3" in source
    checks["exact_archive_binding_present"] = "9c2a6af7f470e15329741ed0a0210f1519ce12b8fe8ec808f02001a21a18f1f5" in source
    checks["exact_manifest_binding_present"] = "d20e0f8e550c5a7e71070e2445df05f5e49b15594f4de6cc062e7dabafff9d5f" in source
    checks["exact_binary_binding_present"] = "e6dfc3409a83504143b12cfdf023aa42318d89579d33275fd59643cc69788f56" in source
    checks["resource_and_process_bindings_present"] = all(
        value in source
        for value in (
            "nhm2-h2-p7-parent-c4-16-20260827",
            "c4-standard-16",
            "hyperdisk-balanced",
            "nhm2-h2-p7-parent-process-r1",
        )
    )
    checks["runtime_and_cost_ceilings_present"] = all(
        value in source for value in ("PROCESS_TIMEOUT_SECONDS = 100800", "VM_RUNTIME_CEILING_SECONDS = 108000", "COST_CEILING_USD = 25.0")
    )
    checks["distinct_audit_and_scientific_statuses"] = all(
        value in source for value in ("audit_status", "scientific_h2_pass", "result_classification")
    )
    checks["valid_fail_and_partial_evidence_supported"] = all(
        value in source for value in ("H2_PARENT_FAIL", "H2_PARENT_TIMEOUT_OR_PARTIAL", "AUDIT_FAIL")
    )
    checks["authority_locks_explicit"] = all(
        value in source for value in ("candidate", "proof", "geometry_state", "lane", "lamp", "physical", "propulsion", "transport")
    )
    checks["single_process_no_retry_guards_present"] = all(
        value in source for value in ("one_process_only", "no_retry_or_retune", "additional_uploads")
    )
    checks["capture_hash_replay_present"] = all(
        value in source for value in ("capture-files.sha256", "capture_manifest_replays_safe_unique_files", "capture_sha256")
    )

    self_test = subprocess.run(
        [sys.executable, str(SUBJECT), "--self-test"],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        timeout=30,
    )
    checks["subject_self_test_4_of_4"] = self_test.returncode == 0 and self_test.stdout.strip() == "4/4 PASS" and self_test.stderr == ""

    with tempfile.TemporaryDirectory(prefix="nhm2-h2-p7-empty-") as temp:
        empty = Path(temp) / "empty"
        empty.mkdir()
        output = Path(temp) / "audit.json"
        malformed = subprocess.run(
            [sys.executable, str(SUBJECT), "--capture-dir", str(empty), "--output", str(output)],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
        payload = json.loads(output.read_text(encoding="utf-8")) if output.is_file() else {}
        checks["missing_capture_fails_closed_without_crash"] = (
            malformed.returncode == 1
            and payload.get("audit_status") == "FAIL"
            and payload.get("scientific_h2_pass") is False
        )

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p7_parent_result_audit_definition.independent_audit.v1",
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
