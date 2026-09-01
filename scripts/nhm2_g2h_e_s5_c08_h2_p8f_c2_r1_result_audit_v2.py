#!/usr/bin/env python3
"""C2-R1 result audit with FLINT arb_get_str decimal-rounding semantics.

The frozen v1 reader omitted arb_get_str's documented one-ulp midpoint
conversion uncertainty.  This additive wrapper changes only that parser rule.
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit.py"
BASE_SHA256 = "c0b0196d7879f1e156cea6abeae6d5f216ac3f01e6f365affc81a459da8ee4b6"
AUDIT_SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8f_c2_r1_result_audit.v2"


def load_base():
    spec = importlib.util.spec_from_file_location("c2r1_result_audit_v1_frozen", BASE_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    if module.sha256(BASE_PATH) != BASE_SHA256:
        raise RuntimeError("frozen v1 reader identity mismatch")
    return module


BASE = load_base()


def printed_ball(value: object):
    """Parse arb_get_str default output, including its one-midpoint-ulp error."""
    if not isinstance(value, str):
        return None
    match = BASE.BALL.fullmatch(value)
    if not match:
        return None
    try:
        midpoint = Decimal(match.group(1))
        radius = Decimal(match.group(2))
    except InvalidOperation:
        return None
    if not midpoint.is_finite() or not radius.is_finite() or radius < 0:
        return None
    midpoint_ulp = Decimal(1).scaleb(midpoint.as_tuple().exponent)
    total_radius = radius + midpoint_ulp
    return BASE.Interval(midpoint - total_radius, midpoint + total_radius)


def self_test() -> int:
    parsed = printed_ball("[1.025 +/- 2e-6]")
    checks = [
        parsed == BASE.Interval(Decimal("1.023998"), Decimal("1.026002")),
        printed_ball("[1.0e-54 +/- 3e-134]") == BASE.Interval(
            Decimal("1.0e-54") - Decimal("1.0000000000000000000000000000000000000000000000000000000000000000000000000000003e-55"),
            Decimal("1.0e-54") + Decimal("1.0000000000000000000000000000000000000000000000000000000000000000000000000000003e-55")),
        printed_ball("1.0") is None,
        printed_ball("[1 +/- -1]") is None,
    ]
    # The second fixture above intentionally has only two midpoint digits: its
    # documented decimal conversion allowance is one ulp = 1e-55.
    BASE.ball = printed_ball
    BASE.AUDIT_SCHEMA = AUDIT_SCHEMA
    checks.extend([
        BASE.divide(printed_ball("[12.0 +/- 0]"), printed_ball("[10.0 +/- 0]")) is not None,
        BASE.classify(printed_ball("[12.0 +/- 0]"), printed_ball("[10.0 +/- 0]"),
                      printed_ball("[1.0 +/- 0]"), printed_ball("[9.0 +/- 0]"),
                      [printed_ball("[1.0 +/- 0]"), printed_ball("[2.0 +/- 0]"),
                       printed_ball("[3.0 +/- 0]"), printed_ball("[4.0 +/- 0]")])[0]
        == "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD",
    ])
    print(f"{sum(checks)}/{len(checks)} {'PASS' if all(checks) else 'FAIL'}")
    return 0 if all(checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--capture-dir", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if args.capture_dir is None or args.output is None:
        parser.error("--capture-dir and --output are required")
    BASE.ball = printed_ball
    BASE.AUDIT_SCHEMA = AUDIT_SCHEMA
    result = BASE.audit(args.capture_dir.resolve(), args.output.resolve())
    print(f"{result['checks_passed']}/{result['checks_total']} {result['audit_status']}")
    print(result["result_classification"])
    print(BASE.sha256(args.output.resolve()))
    return 0 if result["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
