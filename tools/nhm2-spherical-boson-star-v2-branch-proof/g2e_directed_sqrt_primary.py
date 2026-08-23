#!/usr/bin/env python3
"""Candidate-neutral CPython directed square root with exact postconditions."""

from __future__ import annotations

import argparse
from decimal import Context, Decimal, ROUND_CEILING, ROUND_FLOOR
from fractions import Fraction
import json
from pathlib import Path
from typing import Final


SCHEMA: Final[str] = "nhm2.g2e.directed-sqrt.primary-result.v1"
MAX_ADJUSTMENTS: Final[int] = 8


def decimal_fraction(value: Decimal) -> Fraction:
    if not value.is_finite():
        raise ValueError("finite_decimal_required")
    sign, digits, exponent = value.as_tuple()
    coefficient = 0
    for digit in digits:
        coefficient = coefficient * 10 + digit
    if sign:
        coefficient = -coefficient
    if exponent >= 0:
        return Fraction(coefficient * (10 ** exponent), 1)
    return Fraction(coefficient, 10 ** (-exponent))


def _context(precision: int, rounding: str) -> Context:
    return Context(prec=precision, rounding=rounding, Emin=-999999, Emax=999999)


def directed_sqrt(value: Decimal, precision: int) -> tuple[Decimal, Decimal]:
    if not value.is_finite() or value < 0:
        raise ValueError("nonnegative_finite_radicand_required")
    if precision < 8:
        raise ValueError("precision_too_small")
    if value == 0:
        return Decimal(0), Decimal(0)
    exact_value = decimal_fraction(value)
    guard = _context(precision + 32, ROUND_FLOOR).sqrt(value)
    down = _context(precision, ROUND_FLOOR)
    up = _context(precision, ROUND_CEILING)
    lower = down.plus(guard)
    upper = up.plus(guard)

    for _ in range(MAX_ADJUSTMENTS):
        if decimal_fraction(lower) ** 2 <= exact_value:
            break
        lower = down.next_minus(lower)
    else:
        raise ArithmeticError("lower_adjustment_limit")
    for _ in range(MAX_ADJUSTMENTS):
        candidate = down.next_plus(lower)
        if decimal_fraction(candidate) ** 2 > exact_value:
            break
        lower = candidate
    else:
        raise ArithmeticError("lower_tightening_limit")

    for _ in range(MAX_ADJUSTMENTS):
        if decimal_fraction(upper) ** 2 >= exact_value:
            break
        upper = up.next_plus(upper)
    else:
        raise ArithmeticError("upper_adjustment_limit")
    for _ in range(MAX_ADJUSTMENTS):
        candidate = up.next_minus(upper)
        if decimal_fraction(candidate) ** 2 < exact_value:
            break
        upper = candidate
    else:
        raise ArithmeticError("upper_tightening_limit")

    if lower > upper:
        raise ArithmeticError("directed_order_failure")
    return lower, upper


def result(value: Decimal, precision: int) -> dict[str, object]:
    lower, upper = directed_sqrt(value, precision)
    exact = decimal_fraction(value)
    lower_square = decimal_fraction(lower) ** 2
    upper_square = decimal_fraction(upper) ** 2
    lower_next = _context(precision, ROUND_FLOOR).next_plus(lower)
    upper_previous = _context(precision, ROUND_CEILING).next_minus(upper)
    is_exact = lower == upper and lower_square == exact
    return {
        "exact": is_exact,
        "input": str(value),
        "lower": str(lower),
        "lowerPostcondition": lower_square <= exact,
        "lowerTight": is_exact or decimal_fraction(lower_next) ** 2 > exact,
        "upper": str(upper),
        "upperPostcondition": upper_square >= exact,
        "upperTight": is_exact or decimal_fraction(upper_previous) ** 2 < exact,
    }


def run_manifest(path: Path) -> dict[str, object]:
    manifest = json.loads(path.read_text("ascii"))
    if manifest.get("schema") != "nhm2.g2e.generic-interval-provenance-contract.v1":
        raise ValueError("manifest_schema_mismatch")
    if manifest.get("candidateNeutral") is not True:
        raise ValueError("candidate_neutrality_missing")
    precision = manifest["directedSqrtContract"]["precisionDigits"]
    outputs: list[dict[str, object]] = []
    for vector in manifest["vectors"]:
        if "input" in vector:
            item = result(Decimal(vector["input"]), precision)
            item["id"] = vector["id"]
        else:
            lower = result(Decimal(vector["inputLower"]), precision)
            upper = result(Decimal(vector["inputUpper"]), precision)
            item = {"id": vector["id"], "intervalLower": lower["lower"],
                    "intervalUpper": upper["upper"], "lowerPostcondition": True,
                    "upperPostcondition": True, "lowerTight": lower["lowerTight"],
                    "upperTight": upper["upperTight"]}
        outputs.append(item)
    return {"candidateEvaluated": False, "schema": SCHEMA, "status": "PASS",
            "vectors": outputs}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(run_manifest(args.manifest), ensure_ascii=True, allow_nan=False,
                     sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
