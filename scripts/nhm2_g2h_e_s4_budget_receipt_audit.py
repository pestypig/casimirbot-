#!/usr/bin/env python3
"""Independent fail-closed audit of the G2H-E-S4 C04 evidence receipt."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-budget-runtime-verification-receipt.v3.json"
SIDECAR = RECEIPT.with_suffix(".sha256")
RUNTIME_AUDIT = ROOT / "scripts/nhm2_g2h_e_s4_fixture_runtime_audit.py"
COMPLETION_AUDIT = ROOT / "scripts/nhm2_g2h_e_s4_producer_completion_audit.py"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


receipt_bytes = RECEIPT.read_bytes()
receipt = json.loads(receipt_bytes)
expected_sidecar = SIDECAR.read_text(encoding="ascii").split()[0]
check("receipt_sidecar", digest(RECEIPT) == expected_sidecar, expected_sidecar)
check(
    "receipt_status",
    receipt.get("status") == "PASS_COMMON_C04_FIXED_BUDGET_TERMINAL_EXHAUSTION_SCIENTIFIC_PRODUCERS_INCOMPLETE",
    receipt.get("status"),
)

binding_paths = {
    "fixture_build_manifest": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-fixture-build-bindings.v1.json",
    "completion_matrix": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json",
    "runtime_audit": RUNTIME_AUDIT,
    "completion_audit": COMPLETION_AUDIT,
    "canonical_work_program": ROOT / "docs/research/nhm2-spherical-boson-star-v2-work-program.md",
    "active_packet": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-mini-boson-star-proof-implementation-preexecution.md",
}
for name, path in binding_paths.items():
    bound = receipt["bindings"][name]
    observed = {"bytes": path.stat().st_size, "raw_sha256": digest(path)}
    check(f"binding_{name}", observed == bound, observed)

source_paths = {
    "primary_budget_source": ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_budget_primary.cpp",
    "primary_budget_header": ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_budget_primary.hpp",
    "independent_budget_source": ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_budget_independent.rs",
}
check("primary_budget_source", digest(source_paths["primary_budget_source"]) == receipt["primary"]["budget_source_sha256"], digest(source_paths["primary_budget_source"]))
check("primary_budget_header", digest(source_paths["primary_budget_header"]) == receipt["primary"]["budget_header_sha256"], digest(source_paths["primary_budget_header"]))
check("independent_budget_source", digest(source_paths["independent_budget_source"]) == receipt["independent"]["budget_source_sha256"], digest(source_paths["independent_budget_source"]))

runtime = json.loads(subprocess.run([sys.executable, str(RUNTIME_AUDIT)], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
check("runtime_audit_pass", runtime.get("status") == "PASS" and runtime.get("checks_passed") == 62 == runtime.get("checks_total"), {"status": runtime.get("status"), "checks": [runtime.get("checks_passed"), runtime.get("checks_total")]})
check("runtime_budget_counts", next(c for c in runtime["checks"] if c["name"] == "primary_budget_table_exact")["detail"] == {"expected_count": 29, "observed_count": 29} and next(c for c in runtime["checks"] if c["name"] == "independent_budget_table_exact")["detail"] == {"expected_count": 32, "observed_count": 32}, [receipt["primary"]["budget_counters_observed"], receipt["independent"]["budget_counters_observed"]])

completion = json.loads(subprocess.run([sys.executable, str(COMPLETION_AUDIT)], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
check("completion_audit_pass", completion.get("status") == "PASS" and completion.get("checks_passed") == 8 == completion.get("checks_total"), {"status": completion.get("status"), "checks": [completion.get("checks_passed"), completion.get("checks_total")]})
check("common_roles_complete", completion.get("common_roles_complete") == 4 and completion.get("disposition") == "P01 then R01 arithmetic kernels", {"common": completion.get("common_roles_complete"), "next": completion.get("disposition")})

check("candidate_roots_absent", not PRIMARY_ROOT.exists() and not INDEPENDENT_ROOT.exists(), [PRIMARY_ROOT.exists(), INDEPENDENT_ROOT.exists()])
authority_values = list(receipt["authority"].values())
check("authority_locked", authority_values and not any(authority_values), receipt["authority"])
check("no_execution_or_ingress", runtime.get("candidate_evaluations") == 0 and runtime.get("positive_parameter_samples") == 0 and runtime.get("scientific_builder_executed") is False and runtime.get("execution_authorized") is False, {key: runtime.get(key) for key in ("candidate_evaluations", "positive_parameter_samples", "scientific_builder_executed", "execution_authorized")})

passed = sum(1 for item in checks if item["pass"])
report = {
    "schema": "nhm2.g2h_e_s4.budget_receipt_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "S4_implementation_closure": False,
    "next_role": "P01 then R01 arithmetic kernels",
    "candidate_evaluations": 0,
    "candidate_roots_created": False,
    "execution_authorized": False,
    "authority_promoted": False,
}
print(json.dumps(report, separators=(",", ":"), sort_keys=True))
raise SystemExit(0 if report["status"] == "PASS" else 1)
