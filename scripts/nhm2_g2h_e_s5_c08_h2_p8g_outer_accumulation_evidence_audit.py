#!/usr/bin/env python3
"""Candidate-neutral P8G replay of persisted outer-accumulation evidence.

This audit consumes only the authenticated C2-R1 result artifact.  It does not
run the numerical executable.  All comparisons use closed Decimal intervals
with the frozen Arb decimal-ingress rule inherited from the v3 result auditor.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from collections import OrderedDict
from decimal import Decimal, localcontext
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
V3_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit_v3.py"
V3_SHA256 = "2b4fe456654b5d46b8d528d90785772f32e4b19a347135b784a7472c2e258a09"
AUTHENTICATED_AUDIT_SHA256 = "afda5b932d27c7d9c8b37a9782cf85be25b9ea22833448f636dabb14b18f4c5c"
AUTHENTICATED_CLASSIFICATION = "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD"
SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8g_outer_accumulation_evidence_audit.v1"
DECIMAL_PRECISION = 220


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_v3():
    if sha256(V3_PATH) != V3_SHA256:
        raise RuntimeError("frozen v3 result-auditor identity mismatch")
    spec = importlib.util.spec_from_file_location("p8g_frozen_c2r1_v3", V3_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V3 = load_v3()
Interval = V3.BASE.Interval


def add(left: Interval, right: Interval) -> Interval:
    with localcontext() as context:
        context.prec = DECIMAL_PRECISION
        return Interval(left.low + right.low, left.high + right.high)


def subtract(left: Interval, right: Interval) -> Interval:
    with localcontext() as context:
        context.prec = DECIMAL_PRECISION
        return Interval(left.low - right.high, left.high - right.low)


def divide(left: Interval, right: Interval) -> Interval | None:
    if right.low <= 0:
        return None
    with localcontext() as context:
        context.prec = DECIMAL_PRECISION
        return Interval(left.low / right.high, left.high / right.low)


def interval_json(value: Interval) -> dict[str, str]:
    return {"low": str(value.low), "high": str(value.high)}


def classify(final: Interval, threshold: Interval, elementary: Interval,
             boundary: Interval, nonboundary: Interval, slot3: Interval
             ) -> tuple[str, dict[str, object]]:
    panel_sum = add(boundary, nonboundary)
    inner_gap = subtract(panel_sum, elementary)
    outer_gap = subtract(final, panel_sum)
    total_gap = subtract(final, elementary)
    recomposed_gap = add(inner_gap, outer_gap)
    outer_fraction = divide(outer_gap, total_gap)
    elementary_to_threshold = divide(elementary, threshold)
    slot3_to_threshold = divide(slot3, threshold)
    facts: dict[str, object] = {
        "elementary_to_panel_assembly_gap_strictly_positive": inner_gap.low > 0,
        "panel_to_final_outer_gap_strictly_positive": outer_gap.low > 0,
        "outer_gap_strictly_dominates_inner_gap": outer_gap.low > inner_gap.high,
        "elementary_sum_strictly_exceeds_width_threshold": (
            elementary.low > threshold.high),
        "eliminating_all_outer_gap_can_cross_width_rail": (
            elementary.high <= threshold.low),
        "slot3_alone_strictly_exceeds_width_threshold": (
            slot3.low > threshold.high),
        "gap_decomposition_overlaps_total": recomposed_gap.overlaps(total_gap),
        "panel_radius_sum": interval_json(panel_sum),
        "within_panel_assembly_gap": interval_json(inner_gap),
        "outer_ordinal_accumulation_gap": interval_json(outer_gap),
        "total_final_minus_elementary_gap": interval_json(total_gap),
        "outer_fraction_of_total_gap": (
            interval_json(outer_fraction) if outer_fraction is not None else None),
        "elementary_to_threshold_ratio": (
            interval_json(elementary_to_threshold)
            if elementary_to_threshold is not None else None),
        "slot3_to_threshold_ratio": (
            interval_json(slot3_to_threshold)
            if slot3_to_threshold is not None else None),
    }
    if not facts["gap_decomposition_overlaps_total"]:
        return "P8G_INCONSISTENT_PERSISTED_DECOMPOSITION_STOP", facts
    if (facts["panel_to_final_outer_gap_strictly_positive"]
            and facts["outer_gap_strictly_dominates_inner_gap"]):
        if facts["elementary_sum_strictly_exceeds_width_threshold"]:
            return "P8G_OUTER_ACCUMULATION_CAUSAL_BUT_INSUFFICIENT_FOR_RAIL", facts
        return "P8G_OUTER_ORDINAL_ACCUMULATION_DOMINANT_AND_RAIL_RELEVANT", facts
    if facts["elementary_to_panel_assembly_gap_strictly_positive"]:
        return "P8G_WITHIN_PANEL_ASSEMBLY_DOMINANT_OR_MIXED", facts
    return "P8G_PERSISTED_AGGREGATES_INSUFFICIENT_FOR_STRICT_SEPARATION", facts


def audit(authenticated_audit: Path, output: Path) -> dict[str, object]:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["authenticated_audit_regular_non_symlink"] = (
        authenticated_audit.is_file() and not authenticated_audit.is_symlink())
    checks["authenticated_audit_hash_exact"] = (
        checks["authenticated_audit_regular_non_symlink"]
        and sha256(authenticated_audit) == AUTHENTICATED_AUDIT_SHA256)
    try:
        source = json.loads(authenticated_audit.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        source = {}
    checks["authenticated_audit_pass_exact"] = (
        source.get("audit_status") == "PASS"
        and source.get("checks_passed") == source.get("checks_total") == 22
        and source.get("result_classification") == AUTHENTICATED_CLASSIFICATION)
    record = source.get("terminal_record", {})
    checks["candidate_neutral_terminal_invariants"] = (
        isinstance(record, dict)
        and record.get("status") == "PASS"
        and record.get("panel_count") == 65536
        and record.get("target_degree") == 3
        and record.get("target_jet") == 9
        and record.get("terms_per_panel") == 4
        and record.get("elementary_terms_observed") == 262144
        and record.get("all_panel_reconstructions_equal") is True
        and record.get("final_reconstruction_equal") is True
        and record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False)

    names = ("final_radius", "final_threshold", "total_elementary_radius_sum",
             "boundary_panel_radius", "nonboundary_panel_radius_sum")
    parsed = {name: V3.printed_ball(record.get(name)) for name in names}
    slots = record.get("slot_radius_sums", [])
    slot3 = V3.printed_ball(slots[3]) if isinstance(slots, list) and len(slots) == 4 else None
    checks["required_arb_balls_parse_positive"] = all(
        value is not None and value.low > 0
        for value in [*parsed.values(), slot3])
    classification = "P8G_AUDIT_FAIL"
    facts: dict[str, object] = {}
    if checks["required_arb_balls_parse_positive"]:
        classification, facts = classify(
            parsed["final_radius"], parsed["final_threshold"],
            parsed["total_elementary_radius_sum"],
            parsed["boundary_panel_radius"],
            parsed["nonboundary_panel_radius_sum"], slot3)
    checks["gap_decomposition_closes"] = bool(
        facts.get("gap_decomposition_overlaps_total"))
    checks["outer_gap_strictly_positive"] = bool(
        facts.get("panel_to_final_outer_gap_strictly_positive"))
    checks["outer_gap_strictly_dominant"] = bool(
        facts.get("outer_gap_strictly_dominates_inner_gap"))
    checks["elementary_sum_still_strictly_fails_rail"] = bool(
        facts.get("elementary_sum_strictly_exceeds_width_threshold"))
    checks["outer_elimination_alone_cannot_cross_rail"] = (
        facts.get("eliminating_all_outer_gap_can_cross_width_rail") is False)
    checks["slot3_alone_still_strictly_fails_rail"] = bool(
        facts.get("slot3_alone_strictly_exceeds_width_threshold"))
    checks["classification_exact"] = (
        classification
        == "P8G_OUTER_ACCUMULATION_CAUSAL_BUT_INSUFFICIENT_FOR_RAIL")
    checks["all_authority_locks_false"] = all(
        value is False for value in source.get("authority", {}).values())

    passed = sum(checks.values())
    result = {
        "schema": SCHEMA,
        "audit_status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "source_audit_sha256": (
            sha256(authenticated_audit)
            if checks["authenticated_audit_regular_non_symlink"] else None),
        "result_classification": classification,
        "causal_facts": facts,
        "candidate_evaluated": False,
        "numerical_execution_performed": False,
        "authority": {
            "candidate": False, "proof": False, "geometry_state": False,
            "lane": False, "lamp": False, "physical": False,
            "propulsion": False, "transport": False,
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n",
                      encoding="utf-8")
    return result


def self_test() -> int:
    b = lambda low, high: Interval(Decimal(low), Decimal(high))
    outer, outer_facts = classify(b("12", "12.1"), b("9", "9.1"),
                                  b("10", "10.1"), b("1", "1.01"),
                                  b("9.1", "9.2"), b("9.5", "9.6"))
    rail_relevant, _ = classify(b("12", "12.1"), b("11", "11.1"),
                                b("10", "10.1"), b("1", "1.01"),
                                b("9.1", "9.2"), b("9.5", "9.6"))
    inner, _ = classify(b("12", "12.1"), b("13", "13.1"),
                        b("10", "10.1"), b("1", "1.01"),
                        b("10.5", "10.6"), b("9.5", "9.6"))
    insufficient, _ = classify(b("10", "10.1"), b("11", "11.1"),
                               b("10", "10.1"), b("1", "1.01"),
                               b("8.9", "9"), b("9.5", "9.6"))
    checks = [
        outer == "P8G_OUTER_ACCUMULATION_CAUSAL_BUT_INSUFFICIENT_FOR_RAIL",
        outer_facts["outer_gap_strictly_dominates_inner_gap"] is True,
        outer_facts["slot3_alone_strictly_exceeds_width_threshold"] is True,
        rail_relevant
        == "P8G_OUTER_ORDINAL_ACCUMULATION_DOMINANT_AND_RAIL_RELEVANT",
        inner == "P8G_WITHIN_PANEL_ASSEMBLY_DOMINANT_OR_MIXED",
        insufficient == "P8G_PERSISTED_AGGREGATES_INSUFFICIENT_FOR_STRICT_SEPARATION",
    ]
    print(f"{sum(checks)}/{len(checks)} {'PASS' if all(checks) else 'FAIL'}")
    return 0 if all(checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--authenticated-audit", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if args.authenticated_audit is None or args.output is None:
        parser.error("--authenticated-audit and --output are required")
    result = audit(args.authenticated_audit.resolve(), args.output.resolve())
    print(f"{result['checks_passed']}/{result['checks_total']} {result['audit_status']}")
    print(result["result_classification"])
    print(sha256(args.output.resolve()))
    return 0 if result["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
