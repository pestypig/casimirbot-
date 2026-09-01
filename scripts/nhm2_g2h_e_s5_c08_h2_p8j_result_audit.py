#!/usr/bin/env python3
"""Frozen result-only classifier for a future candidate-neutral P8J record."""

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
SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8j_result_audit.v1"
DECIMAL_PRECISION = 220


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_v3():
    if sha256(V3_PATH) != V3_SHA256:
        raise RuntimeError("frozen v3 decimal reader identity mismatch")
    spec = importlib.util.spec_from_file_location("p8j_frozen_v3", V3_PATH)
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


def divide(left: Interval, right: Interval) -> Interval | None:
    if right.low <= 0:
        return None
    with localcontext() as context:
        context.prec = DECIMAL_PRECISION
        return Interval(left.low / right.high, left.high / right.low)


def strict_gt(left: Interval, right: Interval) -> bool:
    return left.low > right.high


def interval_json(value: Interval | None) -> dict[str, str] | None:
    if value is None:
        return None
    return {"low": str(value.low), "high": str(value.high)}


def classify(threshold: Interval, slot3: Interval, integrated: Interval,
             boundary: Interval, direct: Interval, f_hull: Interval,
             g_hull: Interval) -> tuple[str, dict[str, object]]:
    component_sum = add(integrated, boundary)
    facts: dict[str, object] = {
        "slot3_strictly_exceeds_rail": strict_gt(slot3, threshold),
        "integrated_component_strictly_exceeds_rail": strict_gt(integrated, threshold),
        "boundary_component_strictly_exceeds_rail": strict_gt(boundary, threshold),
        "direct_integrated_sum_strictly_exceeds_rail": strict_gt(direct, threshold),
        "integrated_strictly_dominates_boundary": strict_gt(integrated, boundary),
        "boundary_strictly_dominates_integrated": strict_gt(boundary, integrated),
        "f_hull_strictly_exceeds_gprime_hull": strict_gt(f_hull, g_hull),
        "gprime_hull_strictly_exceeds_f_hull": strict_gt(g_hull, f_hull),
        "component_sum_upper_covers_slot3": component_sum.high >= slot3.high,
        "slot3_to_rail": interval_json(divide(slot3, threshold)),
        "integrated_to_rail": interval_json(divide(integrated, threshold)),
        "boundary_to_rail": interval_json(divide(boundary, threshold)),
        "direct_to_rail": interval_json(divide(direct, threshold)),
        "component_sum": interval_json(component_sum),
    }
    if not facts["slot3_strictly_exceeds_rail"]:
        return "P8J_SLOT3_NO_LONGER_STRICTLY_FAILS_STOP", facts
    if not facts["component_sum_upper_covers_slot3"]:
        return "P8J_COMPONENT_RECONSTRUCTION_INCONSISTENT_STOP", facts
    if (facts["boundary_component_strictly_exceeds_rail"]
            and facts["boundary_strictly_dominates_integrated"]):
        return "P8J_BOUNDARY_COMPONENT_LEAD", facts
    if facts["integrated_strictly_dominates_boundary"]:
        if facts["direct_integrated_sum_strictly_exceeds_rail"]:
            if facts["f_hull_strictly_exceeds_gprime_hull"]:
                return "P8J_DIRECT_INTEGRATION_F_HULL_ASYMMETRY_LEAD", facts
            if facts["gprime_hull_strictly_exceeds_f_hull"]:
                return "P8J_DIRECT_INTEGRATION_GPRIME_HULL_ASYMMETRY_LEAD", facts
            return "P8J_DIRECT_INTEGRATION_DISTRIBUTED_HULL_LEAD", facts
        if facts["integrated_component_strictly_exceeds_rail"]:
            return "P8J_CENTERED_TRANSLATION_OR_ACCUMULATION_LEAD", facts
    return "P8J_DISTRIBUTED_OR_UNSEPARATED_LEAD", facts


def audit(record_path: Path, output: Path) -> dict[str, object]:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["record_regular_non_symlink"] = record_path.is_file() and not record_path.is_symlink()
    try:
        record = json.loads(record_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        record = {}
    checks["schema_exact"] = record.get("schema") == "nhm2.g2h_e_s5.c08_h2_p8j_representative_attribution.v1"
    checks["terminal_success_shape"] = (
        record.get("status") == "PASS" and record.get("phase") == "complete"
        and record.get("panel_count") == 65536 and record.get("thread_count") == 32
        and record.get("target_degree") == 3 and record.get("target_jet") == 9
        and record.get("terms_per_panel") == 4
        and record.get("elementary_terms_observed") == 262144
        and record.get("all_panel_reconstructions_equal") is True
        and record.get("final_reconstruction_equal") is True
        and record.get("all_slot3_reconstructions_equal") is True
        and record.get("parent_unchanged") is True)
    checks["term_counts_exact"] = (
        record.get("slot3_integrated_terms_observed") == 65536 * 1086
        and record.get("slot3_boundary_terms_observed") == 65536 * 22)
    checks["candidate_neutral_locks"] = (
        record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False)

    slots = record.get("slot_radius_sums", [])
    raw = {
        "threshold": record.get("final_threshold"),
        "slot3": slots[3] if isinstance(slots, list) and len(slots) == 4 else None,
        "integrated": record.get("slot3_integrated_component_radius_sum"),
        "boundary": record.get("slot3_boundary_component_radius_sum"),
        "direct": record.get("slot3_direct_integrated_radius_sum"),
        "f_hull": record.get("slot3_f_source_hull_radius_sum"),
        "g_hull": record.get("slot3_gprime_source_hull_radius_sum"),
    }
    parsed = {name: V3.printed_ball(value) for name, value in raw.items()}
    checks["required_positive_balls"] = all(
        value is not None and value.low > 0 for value in parsed.values())
    classification = "P8J_AUDIT_FAIL"
    facts: dict[str, object] = {}
    if checks["required_positive_balls"]:
        classification, facts = classify(**parsed)
    checks["classification_reached"] = classification != "P8J_AUDIT_FAIL"
    checks["slot3_rail_failure_preserved"] = bool(facts.get("slot3_strictly_exceeds_rail"))
    checks["component_reconstruction_consistent"] = bool(
        facts.get("component_sum_upper_covers_slot3")
    )

    passed = sum(checks.values())
    payload = {
        "schema": SCHEMA,
        "audit_status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed, "checks_total": len(checks),
        "checks": checks, "record_sha256": sha256(record_path) if checks["record_regular_non_symlink"] else None,
        "result_classification": classification, "causal_facts": facts,
        "candidate_evaluated": False, "authority": {
            "candidate": False, "proof": False, "geometry_state": False,
            "lane": False, "lamp": False, "physical": False,
            "propulsion": False, "transport": False,
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload


def self_test() -> int:
    b = lambda low, high: Interval(Decimal(low), Decimal(high))
    base = {"threshold": b("10", "10.1"), "slot3": b("12", "12.1")}
    cases = [
        (dict(base, integrated=b("0", "0.1"), boundary=b("12", "12.1"), direct=b("1", "1.1"), f_hull=b("2", "2.1"), g_hull=b("1", "1.1")), "P8J_BOUNDARY_COMPONENT_LEAD"),
        (dict(base, integrated=b("12", "12.1"), boundary=b("0", "0.1"), direct=b("11", "11.1"), f_hull=b("4", "4.1"), g_hull=b("2", "2.1")), "P8J_DIRECT_INTEGRATION_F_HULL_ASYMMETRY_LEAD"),
        (dict(base, integrated=b("12", "12.1"), boundary=b("0", "0.1"), direct=b("11", "11.1"), f_hull=b("2", "2.1"), g_hull=b("4", "4.1")), "P8J_DIRECT_INTEGRATION_GPRIME_HULL_ASYMMETRY_LEAD"),
        (dict(base, integrated=b("12", "12.1"), boundary=b("0", "0.1"), direct=b("11", "11.1"), f_hull=b("2", "3"), g_hull=b("2.5", "3.5")), "P8J_DIRECT_INTEGRATION_DISTRIBUTED_HULL_LEAD"),
        (dict(base, integrated=b("12", "12.1"), boundary=b("0", "0.1"), direct=b("4", "4.1"), f_hull=b("2", "2.1"), g_hull=b("1", "1.1")), "P8J_CENTERED_TRANSLATION_OR_ACCUMULATION_LEAD"),
        (dict(base, integrated=b("6", "6.1"), boundary=b("6", "6.1"), direct=b("4", "4.1"), f_hull=b("2", "2.1"), g_hull=b("1", "1.1")), "P8J_DISTRIBUTED_OR_UNSEPARATED_LEAD"),
    ]
    checks = [classify(**values)[0] == expected for values, expected in cases]
    print(f"{sum(checks)}/{len(checks)} {'PASS' if all(checks) else 'FAIL'}")
    return 0 if all(checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--record", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if args.record is None or args.output is None:
        parser.error("--record and --output are required")
    payload = audit(args.record.resolve(), args.output.resolve())
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['audit_status']}")
    print(payload["result_classification"])
    print(sha256(args.output.resolve()))
    return 0 if payload["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
