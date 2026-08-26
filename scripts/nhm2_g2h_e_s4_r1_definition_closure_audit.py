#!/usr/bin/env python3
"""Combined fail-closed closure audit for the S4-R1 definition seal."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SEAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
INDEPENDENT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def counts(report: dict[str, object]) -> tuple[int | None, int | None]:
    for passed_key, total_key in (
        ("checks_passed", "checks_total"),
        ("passed_count", "total_count"),
        ("checksPassed", "checksTotal"),
    ):
        if passed_key in report and total_key in report:
            return int(report[passed_key]), int(report[total_key])
    return None, None


def report_passed(report: dict[str, object]) -> bool:
    if report.get("status") == "PASS":
        return True
    return report.get("passed") is True


def main() -> int:
    seal = json.loads(SEAL.read_text(encoding="utf-8"))
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: object) -> None:
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    r2 = seal["r2_preserved"]
    observed_r2 = sha256(ROOT / r2["path"])
    check("r2_preserved", observed_r2 == r2["sha256"] and r2["mutated"] is False, observed_r2)

    seen_roles: set[str] = set()
    for binding in seal["definition_bindings"]:
        role = binding["role"]
        observed = sha256(ROOT / binding["path"])
        check(f"binding:{role}", role not in seen_roles and observed == binding["sha256"], observed)
        seen_roles.add(role)
    check("binding_role_count", len(seen_roles) == 15, sorted(seen_roles))

    inventory_binding = next(item for item in seal["definition_bindings"] if item["role"] == "inventory")
    inventory = json.loads((ROOT / inventory_binding["path"]).read_text(encoding="utf-8"))
    inventory_counts = inventory["counts"]
    check("inventory_ordinals", [item["ordinal"] for item in inventory["ordered_gaps"]] == list(range(1, 11)), [item["ordinal"] for item in inventory["ordered_gaps"]])
    check("all_drafts_complete", inventory_counts["draft_complete_pending_independent_audit"] == 10 and inventory_counts["partial_definition_with_hard_subdefinitions_unbound"] == 0 and inventory_counts["unbound_finite_products"] == 0, inventory_counts)

    suite_reports: list[dict[str, object]] = []
    for suite in seal["required_fixture_suites"]:
        completed = subprocess.run(
            suite["command"],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            timeout=120,
        )
        parsed: dict[str, object] | None = None
        error = ""
        try:
            parsed = json.loads(completed.stdout)
        except Exception as exc:  # fail closed with bounded diagnostic
            error = type(exc).__name__
        observed_counts = counts(parsed) if parsed is not None else (None, None)
        expected_counts = tuple(suite["expected"])
        passed = (
            completed.returncode == 0
            and parsed is not None
            and report_passed(parsed)
            and observed_counts == expected_counts
        )
        item = {
            "id": suite["id"],
            "pass": passed,
            "returncode": completed.returncode,
            "observed": observed_counts,
            "expected": expected_counts,
            "parse_error": error or None,
            "stdout_sha256": hashlib.sha256(completed.stdout.encode("utf-8")).hexdigest(),
            "stderr_sha256": hashlib.sha256(completed.stderr.encode("utf-8")).hexdigest(),
        }
        suite_reports.append(item)
        check(f"suite:{suite['id']}", passed, item)

    closure = seal["closure_predicates"]
    check("zero_scientific_ingress", closure["candidate_evaluations"] == 0 and closure["positive_parameter_samples"] == 0, closure)
    check("implementation_still_false", closure["producer_source_implemented"] is False and closure["scientific_execution_authorized"] is False and closure["rust_scientific_execution_authorized"] is False, closure)
    check("primary_root_absent", not PRIMARY_ROOT.exists(), str(PRIMARY_ROOT.relative_to(ROOT)))
    check("independent_root_absent", not INDEPENDENT_ROOT.exists(), str(INDEPENDENT_ROOT.relative_to(ROOT)))
    check("seal_authority_false", all(value is False for value in seal["authority"].values()), seal["authority"])

    passed_count = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4_r1.definition_closure_audit.v1",
        "status": "PASS" if passed_count == len(checks) else "FAIL",
        "meaning": "PASS closes fixture/theory definition completeness only; current math/WARP/Casimir evidence remains a separate gate and no producer or candidate ran",
        "seal_raw_sha256": sha256(SEAL),
        "checks_passed": passed_count,
        "checks_total": len(checks),
        "suite_reports": suite_reports,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "implementation_authorized": False,
        "execution_authorized": False,
        "authority_promoted": False,
        "disposition": "RUN_CURRENT_MATH_WARP_CASIMIR_BEFORE_R1_GATE_TRANSITION",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
