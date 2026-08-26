#!/usr/bin/env python3
"""Fail closed if the S5 dispatch matrix hides missing scientific producers."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-scientific-dispatch-matrix.v1.json"
matrix = json.loads(path.read_text(encoding="utf-8"))
checks: list[dict[str, object]] = []


def check(name: str, passed: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(passed), "detail": detail})


duties = matrix["duties"]
expected_ids = [f"R2-C{i:02d}" for i in range(1, 16)] + [f"R2-Q{i:02d}" for i in range(1, 7)]
check("exact_duty_inventory", [item["id"] for item in duties] == expected_ids, [item["id"] for item in duties])
allowed = set(matrix["maturity_grammar"])
check("maturity_grammar", all(item["status"] in allowed for item in duties), sorted({item["status"] for item in duties}))
check("deferred_only_pair_duties", {item["id"] for item in duties if item["status"] == "deferred_independent"} == {"R2-C15", "R2-Q06"}, [item["id"] for item in duties if item["status"] == "deferred_independent"])

actual = {key: sum(item["status"] == key for item in duties) for key in allowed}
counts = matrix["counts"]
check("counts", actual["complete_unexecuted"] == counts["complete_unexecuted"] and actual["partial"] == counts["partial"] and actual["missing"] == counts["missing"] and actual["deferred_independent"] == counts["deferred_independent"] and counts["primary_eligible_total"] == 19, {"actual": actual, "declared": counts})
check("no_false_completion", counts["complete_unexecuted"] == 0
    and matrix["infrastructure"]["scientific_dispatcher"] == "partial"
    and matrix["infrastructure"]["fixed_duty_scheduler"] == "complete_unexecuted"
    and matrix["infrastructure"]["candidate_ingress"] == "partial", matrix["infrastructure"])
check("all_missing_explicit", all(bool(item.get("missing")) for item in duties), "all duties carry missing/deferred evidence")
check("zero_execution", not any(matrix["execution_boundary"].values()), matrix["execution_boundary"])
check("authority_false", not any(matrix["authority"].values()), matrix["authority"])

passed = sum(item["pass"] for item in checks)
report = {
    "schema": "nhm2.g2h_e_s5.scientific_dispatch_matrix_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "primary_eligible_complete": counts["complete_unexecuted"],
    "primary_eligible_total": counts["primary_eligible_total"],
    "candidate_evaluations": 0,
    "candidate_roots_created": False,
    "authorization_created": False,
    "authority_promoted": False,
    "checks": checks,
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if passed == len(checks) else 1)
