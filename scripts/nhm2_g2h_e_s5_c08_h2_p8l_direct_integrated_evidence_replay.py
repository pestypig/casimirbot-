#!/usr/bin/env python3
"""Evidence-only localization of the authenticated P8J direct slot-3 excess."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from decimal import Decimal, localcontext
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
P8K_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8k_result_audit.py"
P8K_SHA256 = "280d84af2da4b377ada04fa6b46f8b2628f4f368af709c3a0214e7c85cf2fe90"
RECORD_SHA256 = "565c44ef3231c2e301fea01e789928fc7dcfb9b4cbb886579f075fea0dcee5e2"
P8K_RECEIPT_SHA256 = "a14cbb66b41c30cc2fa597c4c790c3bcdace40f546438fb6b6d271aa68af4fc1"
SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8l_direct_integrated_evidence_replay.v1"
DECIMAL_PRECISION = 220


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_p8k():
    if sha256(P8K_PATH) != P8K_SHA256:
        raise RuntimeError("P8K corrected-auditor identity mismatch")
    spec = importlib.util.spec_from_file_location("p8l_bound_p8k", P8K_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


P8K = load_p8k()
Interval = P8K.Interval


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


def interval_json(value: Interval | None) -> dict[str, str] | None:
    if value is None:
        return None
    return {"low": str(value.low), "high": str(value.high)}


def strict_positive(value: Interval) -> bool:
    return value.low > 0


def strict_less(left: Interval, right: Interval) -> bool:
    return left.high < right.low


def classify(direct_excess: Interval, source_hull_sum: Interval,
             translation_gap: Interval, boundary: Interval) -> str:
    if not strict_positive(direct_excess):
        return "P8L_DIRECT_TERM_SUM_NO_LONGER_STRICTLY_FAILS_STOP"
    if boundary.low < 0 or boundary.high > 0:
        return "P8L_BOUNDARY_NOT_EXACT_ZERO_STOP"
    if not strict_less(source_hull_sum, direct_excess):
        return "P8L_SOURCE_HULL_SCALE_UNRESOLVED_LEAD"
    if not strict_less(translation_gap, direct_excess):
        return "P8L_TRANSLATION_SCALE_UNRESOLVED_LEAD"
    return "P8L_DIRECT_POLYNOMIAL_MOMENT_TERM_RADIUS_ACCUMULATION_LEAD"


def replay(record_path: Path, p8k_receipt_path: Path,
           output_path: Path) -> dict[str, object]:
    record = json.loads(record_path.read_text(encoding="utf-8"))
    p8k_receipt = json.loads(p8k_receipt_path.read_text(encoding="utf-8"))
    slots_raw = record.get("slot_radius_sums", [])
    values = {
        "final": P8K.printed_nonnegative_ball(record.get("final_radius")),
        "threshold": P8K.printed_nonnegative_ball(record.get("final_threshold")),
        "slot3": P8K.printed_nonnegative_ball(
            slots_raw[3] if isinstance(slots_raw, list) and len(slots_raw) == 4 else None
        ),
        "integrated": P8K.printed_nonnegative_ball(
            record.get("slot3_integrated_component_radius_sum")
        ),
        "boundary": P8K.printed_nonnegative_ball(
            record.get("slot3_boundary_component_radius_sum")
        ),
        "direct": P8K.printed_nonnegative_ball(
            record.get("slot3_direct_integrated_radius_sum")
        ),
        "f_hull": P8K.printed_nonnegative_ball(
            record.get("slot3_f_source_hull_radius_sum")
        ),
        "g_hull": P8K.printed_nonnegative_ball(
            record.get("slot3_gprime_source_hull_radius_sum")
        ),
    }
    if isinstance(slots_raw, list) and len(slots_raw) == 4:
        slots = [P8K.printed_nonnegative_ball(value) for value in slots_raw]
    else:
        slots = []
    parse_ok = all(value is not None for value in values.values()) and all(
        value is not None for value in slots
    ) and len(slots) == 4

    zero = Interval(Decimal(0), Decimal(0))
    if parse_ok:
        final_excess = subtract(values["final"], values["threshold"])
        slot3_excess = subtract(values["slot3"], values["threshold"])
        integrated_excess = subtract(values["integrated"], values["threshold"])
        direct_excess = subtract(values["direct"], values["threshold"])
        source_hull_sum = add(values["f_hull"], values["g_hull"])
        translation_gap = subtract(values["integrated"], values["direct"])
        non_slot3_sum = zero
        for value in slots[:3]:
            non_slot3_sum = add(non_slot3_sum, value)
        classification = classify(
            direct_excess, source_hull_sum, translation_gap, values["boundary"]
        )
    else:
        final_excess = slot3_excess = integrated_excess = direct_excess = zero
        source_hull_sum = translation_gap = non_slot3_sum = zero
        classification = "P8L_EVIDENCE_PARSE_FAIL"

    checks = {
        "record_regular_non_symlink": record_path.is_file() and not record_path.is_symlink(),
        "record_hash_exact": sha256(record_path) == RECORD_SHA256,
        "p8k_receipt_regular_non_symlink": p8k_receipt_path.is_file()
        and not p8k_receipt_path.is_symlink(),
        "p8k_receipt_hash_exact": sha256(p8k_receipt_path) == P8K_RECEIPT_SHA256,
        "p8k_replay_pass": p8k_receipt.get("audit_status") == "PASS"
        and p8k_receipt.get("checks_passed") == p8k_receipt.get("checks_total") == 11,
        "p8k_classification_bound": p8k_receipt.get("result_classification")
        == "P8K_DIRECT_INTEGRATION_GPRIME_HULL_ASYMMETRY_LEAD",
        "all_required_intervals_parse": parse_ok,
        "direct_sum_strictly_exceeds_threshold": strict_positive(direct_excess),
        "slot3_strictly_exceeds_threshold": strict_positive(slot3_excess),
        "integrated_strictly_exceeds_threshold": strict_positive(integrated_excess),
        "boundary_component_exact_zero": values.get("boundary") == zero,
        "combined_source_hull_scale_below_direct_excess": strict_less(
            source_hull_sum, direct_excess
        ),
        "translation_gap_scale_below_direct_excess": strict_less(
            translation_gap, direct_excess
        ),
        "gprime_hull_strictly_exceeds_f_hull": (
            values["g_hull"].low > values["f_hull"].high if parse_ok else False
        ),
        "direct_accumulation_classification_reached": classification
        == "P8L_DIRECT_POLYNOMIAL_MOMENT_TERM_RADIUS_ACCUMULATION_LEAD",
        "candidate_neutral_locks": record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": SCHEMA,
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "record_sha256": sha256(record_path),
        "p8k_receipt_sha256": sha256(p8k_receipt_path),
        "classification": classification,
        "intervals": {
            "final_excess": interval_json(final_excess),
            "slot3_excess": interval_json(slot3_excess),
            "integrated_excess": interval_json(integrated_excess),
            "direct_excess": interval_json(direct_excess),
            "combined_source_hull_scale": interval_json(source_hull_sum),
            "translation_gap_scale": interval_json(translation_gap),
            "non_slot3_radius_sum": interval_json(non_slot3_sum),
            "direct_excess_over_final_excess": interval_json(
                divide(direct_excess, final_excess)
            ),
            "combined_source_hull_over_direct_excess": interval_json(
                divide(source_hull_sum, direct_excess)
            ),
            "translation_gap_over_direct_excess": interval_json(
                divide(translation_gap, direct_excess)
            ),
            "gprime_hull_over_direct_excess": interval_json(
                divide(values["g_hull"], direct_excess) if parse_ok else None
            ),
        },
        "inference_boundary": (
            "The existing aggregate evidence excludes boundary propagation, the combined "
            "source-hull diagnostic scale, and the integrated-minus-direct translation gap "
            "as individually sufficient explanations of the strict direct excess. It does not "
            "yet separate coefficient-ball width, prepared-moment width, product rounding, "
            "global-degree translation weights, or absolute term-radius accumulation inside "
            "the direct sum."
        ),
        "next_gate_decision": (
            "freeze a candidate-neutral direct-term attribution surface by global t degree "
            "and radius origin (f coefficient, gprime coefficient, prepared moment, product "
            "rounding, translation weight, accumulation), require exact ordinary/observed "
            "Arb equality and manufactured deterministic replay, and do not authorize another "
            "representative run until that fixture closes"
        ),
        "candidate_evaluated": False,
        "authority": {
            name: False
            for name in (
                "candidate", "proof", "geometry_state", "lane", "lamp",
                "physical", "propulsion", "transport"
            )
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload


def self_test() -> int:
    b = lambda low, high: Interval(Decimal(low), Decimal(high))
    cases = [
        (b("2", "2.1"), b("0.1", "0.2"), b("0.01", "0.02"), b("0", "0"),
         "P8L_DIRECT_POLYNOMIAL_MOMENT_TERM_RADIUS_ACCUMULATION_LEAD"),
        (b("-0.1", "0.1"), b("0.01", "0.02"), b("0.01", "0.02"), b("0", "0"),
         "P8L_DIRECT_TERM_SUM_NO_LONGER_STRICTLY_FAILS_STOP"),
        (b("2", "2.1"), b("3", "3.1"), b("0.01", "0.02"), b("0", "0"),
         "P8L_SOURCE_HULL_SCALE_UNRESOLVED_LEAD"),
        (b("2", "2.1"), b("0.1", "0.2"), b("3", "3.1"), b("0", "0"),
         "P8L_TRANSLATION_SCALE_UNRESOLVED_LEAD"),
        (b("2", "2.1"), b("0.1", "0.2"), b("0.01", "0.02"), b("0", "0.1"),
         "P8L_BOUNDARY_NOT_EXACT_ZERO_STOP"),
    ]
    checks = [classify(*values[:-1]) == values[-1] for values in cases]
    checks.extend([
        strict_less(b("0.1", "0.2"), b("1", "1.1")),
        not strict_less(b("1", "1.2"), b("1.1", "1.3")),
        interval_json(divide(b("1", "1"), b("2", "2")))
        == {"low": "0.5", "high": "0.5"},
    ])
    print(f"{sum(checks)}/{len(checks)} {'PASS' if all(checks) else 'FAIL'}")
    return 0 if all(checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--record", type=Path)
    parser.add_argument("--p8k-receipt", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if args.record is None or args.p8k_receipt is None or args.output is None:
        parser.error("--record, --p8k-receipt and --output are required")
    payload = replay(
        args.record.resolve(), args.p8k_receipt.resolve(), args.output.resolve()
    )
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(payload["classification"])
    print(sha256(args.output.resolve()))
    return 0 if payload["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
