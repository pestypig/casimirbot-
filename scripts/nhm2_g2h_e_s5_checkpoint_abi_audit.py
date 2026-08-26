#!/usr/bin/env python3
"""Candidate-neutral exact audit for the G2H-E-S5 checkpoint ABI."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs" / "research"
ABI_PATH = DOC / "nhm2-spherical-boson-star-v2-g2h-e-s5-checkpoint-abi.v1.json"
checks: list[dict[str, object]] = []


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(name: str, passed: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(passed), "detail": detail})


abi = json.loads(ABI_PATH.read_text(encoding="utf-8"))
expected_frozen = {
    "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.md": "f2fec60d0211e8762bee1a1b282dfdf3e38c8ebdbdb220ec068a8b02f2ba6cb2",
    "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.json": "7f7b7ac889de82d52a2b6fc667e4b458d42ac833f350c91c5c48890266310d03",
    "nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json": "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json": "728d8c9a807d27356a6d9f33e897feb73331abb12e6a76435dbce099d9c025ca",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json": "2989373624362e7f591ca0f00b76d1b01e2aa861f01eaf53f9b62c666f2862fc",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-final-closure-receipt.v1.json": "539a4ac5f8ea605abbf05e34802fc4f407e106b3d6555c1928389eefc58ca191",
    "nhm2-spherical-boson-star-v2-g2h-e-s4-future-primary-execution-proposal.v1.json": "a95a63df5d2e1f3a755876d0d3f976b55a6a897cbaa86aa9a2b252115a68f4d9",
}
for name, expected in expected_frozen.items():
    actual = digest(DOC / name)
    check(f"frozen_{name}", actual == expected, actual)

check("schema", abi["schema"] == "nhm2.g2h_e_s5.primary_checkpoint_abi.v1", abi["schema"])
check("identity", abi["identity"]["exact_source_coordinate"] == "6/5" and abi["identity"]["working_precision_bits"] == 512, abi["identity"])
check("zero_ingress", abi["identity"]["candidate_evaluations_at_seal"] == 0 and abi["identity"]["positive_parameter_samples_at_seal"] == 0, abi["identity"])

expected_order = [
    "runtime_identity", "self_executable_identity", "checkpoint_ABI_identity",
    "frozen_scientific_input_identities", "build_binding_identity", "exact_argv",
    "environment_allowlist", "authorization_record_and_token",
    "both_candidate_roots_absent", "all_fixed_ledger_paths_absent",
    "exclusive_invocation_persistence", "selected_member_ingress",
    "ordered_scientific_dispatch",
]
check("preflight_order", abi["preflight_order"] == expected_order, abi["preflight_order"])
check("failure_precedence", list(abi["failure_precedence"]) == ["64", "65", "66", "67", "68", "69"], abi["failure_precedence"])

self_test = abi["command_grammar"]["self_test"]
execution = abi["command_grammar"]["scientific_execution_template"]
check("distinct_exact_commands", self_test[1] == "--preflight-self-test" and execution[1] == "--execute-once" and self_test != execution, {"self_test": self_test, "execution": execution})
proposal_path = abi["paths"]["execution_proposal"]
proposal_positions = [index for index, value in enumerate(execution) if value == "--proposal"]
check(
    "proposal_path_bound",
    proposal_positions == [10] and execution[11] == proposal_path,
    {"path": proposal_path, "positions": proposal_positions},
)
check("self_test_science_locked", abi["command_grammar"]["self_test_may_dispatch_science"] is False, abi["command_grammar"])

expected_env = {
    "PATH", "HOSTNAME", "HOME", "LC_ALL", "LANG", "TZ", "OMP_NUM_THREADS",
    "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "GPG_KEY", "PYTHON_VERSION",
    "PYTHON_SHA256", "NHM2_EXECUTION_TOKEN", "all_other_environment_keys",
}
check("environment_key_inventory", set(abi["environment_allowlist"]) == expected_env, sorted(abi["environment_allowlist"]))

auth = abi["authorization_record_grammar"]
check("authorization_absent", auth["authorization_record_created_in_S5"] is False and auth["token_created_in_S5"] is False, auth)
check("authorization_bounded", auth["maximum_bytes"] == 4096 and auth["symlink"] == "reject" and auth["missing_or_duplicate_line"] == "reject", auth)

paths = abi["paths"]
primary_root = ROOT / paths["primary_output_root"]
independent_root = ROOT / paths["independent_output_root"]
authorization = ROOT / paths["authorization"]
ledgers = [ROOT / paths[key] for key in ("invocation", "stdout", "stderr", "result")]
check("candidate_roots_absent", not primary_root.exists() and not independent_root.exists(), [primary_root.exists(), independent_root.exists()])
check("authorization_and_ledgers_absent", not authorization.exists() and not any(path.exists() for path in ledgers), {"authorization": authorization.exists(), "ledgers": [path.exists() for path in ledgers]})

check("record_irreversibility", all(abi["record_rules"][key] is False for key in ("retry", "retune", "deletion", "alternate_root")), abi["record_rules"])
check("self_test_candidate_neutral", abi["self_test_boundary"]["candidate_evaluations"] == 0 and abi["self_test_boundary"]["positive_parameter_samples"] == 0 and abi["self_test_boundary"]["candidate_roots_created"] is False, abi["self_test_boundary"])
check("authority_false", not any(abi["authority"].values()), abi["authority"])

passed = sum(1 for item in checks if item["pass"])
report = {
    "schema": "nhm2.g2h_e_s5.checkpoint_abi_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "authorization_created": False,
    "authority_promoted": False,
    "checks": checks,
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if passed == len(checks) else 1)
