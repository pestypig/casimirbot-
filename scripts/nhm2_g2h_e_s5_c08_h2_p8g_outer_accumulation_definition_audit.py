#!/usr/bin/env python3
"""Independent definition audit for the candidate-neutral P8G replay."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8g_outer_accumulation_evidence_audit.py"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8g-outer-accumulation-evidence-replay.md"
RESULT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-stopped-disk-rescue-v1-20260831/p8g-outer-accumulation-evidence-audit.v1.json"
SCRIPT_SHA256 = "fe8f09f84330c51a773a34c042eb9677f7cd794c2ed01dacc9af0e969cb499f6"
RESULT_SHA256 = "c44bd6ed368b93dcd435077be6e98a7d4f33b9630142bad91ac9e3c96996764d"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    spec = importlib.util.spec_from_file_location("p8g_definition_target", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    source = SCRIPT.read_text(encoding="utf-8")
    doc = DOC.read_text(encoding="utf-8")
    result = json.loads(RESULT.read_text(encoding="utf-8"))
    b = lambda low, high: module.Interval(Decimal(low), Decimal(high))
    classification, facts = module.classify(
        b("12", "12.1"), b("9", "9.1"), b("10", "10.1"),
        b("1", "1.01"), b("9.1", "9.2"), b("9.5", "9.6"))
    checks = {
        "script_hash_exact": sha256(SCRIPT) == SCRIPT_SHA256,
        "result_hash_exact": sha256(RESULT) == RESULT_SHA256,
        "frozen_v3_hash_bound": module.V3_SHA256
            == "2b4fe456654b5d46b8d528d90785772f32e4b19a347135b784a7472c2e258a09",
        "authenticated_result_hash_bound": module.AUTHENTICATED_AUDIT_SHA256
            == "afda5b932d27c7d9c8b37a9782cf85be25b9ea22833448f636dabb14b18f4c5c",
        "fixed_decimal_context": module.DECIMAL_PRECISION == 220,
        "synthetic_classification_exact": classification
            == "P8G_OUTER_ACCUMULATION_CAUSAL_BUT_INSUFFICIENT_FOR_RAIL",
        "synthetic_outer_strict": facts["panel_to_final_outer_gap_strictly_positive"] is True,
        "synthetic_rail_insufficient": facts["elementary_sum_strictly_exceeds_width_threshold"] is True,
        "synthetic_slot3_strict": facts["slot3_alone_strictly_exceeds_width_threshold"] is True,
        "result_pass_exact": result.get("audit_status") == "PASS"
            and result.get("checks_passed") == result.get("checks_total") == 13,
        "result_classification_exact": result.get("result_classification")
            == "P8G_OUTER_ACCUMULATION_CAUSAL_BUT_INSUFFICIENT_FOR_RAIL",
        "result_zero_numerical_execution": result.get("numerical_execution_performed") is False,
        "result_zero_candidate": result.get("candidate_evaluated") is False,
        "result_authority_false": all(value is False for value in result.get("authority", {}).values()),
        "doc_program_header": doc.startswith("Program gate:"),
        "doc_hashes_bound": SCRIPT_SHA256 in doc and RESULT_SHA256 in doc,
        "doc_outer_not_sufficient": "cannot make this representative\ncoefficient pass" in doc,
        "doc_next_slot3_exact": "value_jet * second_jet(1,2)" in doc,
        "no_process_execution": "subprocess" not in source and "docker" not in source.lower(),
        "no_cloud_execution": "gcloud" not in source.lower(),
        "no_candidate_promotion": '"candidate": False' in source,
    }
    passed = sum(checks.values())
    report = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8g_outer_accumulation_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
