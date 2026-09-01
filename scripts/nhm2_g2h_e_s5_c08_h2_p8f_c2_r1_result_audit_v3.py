#!/usr/bin/env python3
"""C2-R1 audit with one-ulp Arb ingress at a fixed 220-digit context."""

from __future__ import annotations

import argparse
import importlib.util
import sys
from decimal import Decimal, InvalidOperation, localcontext
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
V2_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit_v2.py"
V2_SHA256 = "33e660490990ba3c94c4d260d427552c5d0b4385751b52e7bd0f2222ebaec2b4"
AUDIT_SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8f_c2_r1_result_audit.v3"
DECIMAL_PRECISION = 220


def load_v2():
    spec = importlib.util.spec_from_file_location("c2r1_result_audit_v2_frozen", V2_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    if module.BASE.sha256(V2_PATH) != V2_SHA256:
        raise RuntimeError("frozen v2 reader identity mismatch")
    return module


V2 = load_v2()
BASE = V2.BASE


def printed_ball(value: object):
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
    with localcontext() as context:
        context.prec = DECIMAL_PRECISION
        midpoint_ulp = Decimal(1).scaleb(midpoint.as_tuple().exponent)
        total_radius = radius + midpoint_ulp
        return BASE.Interval(midpoint - total_radius, midpoint + total_radius)


def self_test() -> int:
    long_midpoint = "1." + "1234567890" * 8
    parsed = printed_ball(f"[{long_midpoint} +/- 2e-90]")
    expected_midpoint = Decimal(long_midpoint)
    expected_radius = Decimal("1e-80") + Decimal("2e-90")
    with localcontext() as context:
        context.prec = DECIMAL_PRECISION
        expected = BASE.Interval(expected_midpoint - expected_radius,
                                 expected_midpoint + expected_radius)
    checks = [
        parsed == expected,
        printed_ball("[1.025 +/- 2e-6]") == BASE.Interval(Decimal("1.023998"), Decimal("1.026002")),
        printed_ball("1.0") is None,
        printed_ball("[1 +/- -1]") is None,
    ]
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
