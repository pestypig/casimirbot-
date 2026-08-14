"""Static and manifest-gated tests for the independent SI source candidate.

The reference arithmetic below is independently written from the frozen TypeScript
contracts.  It uses only exact integers/Fraction values, rigorous Machin-series pi
bounds, and integer-square-root comparisons.  It never imports or reads another
normalization implementation.
"""

from __future__ import annotations

import ast
import hashlib
import json
import math
import os
import platform
import re
import subprocess
import tempfile
import unittest
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
C_SOURCE = HERE / "si_normalization_native.c"
THIS_TEST = Path(__file__).resolve()
V1_CONTRACT = ROOT / "shared" / "contracts" / (
    "nhm2-spherical-boson-star-v2-si-output-normalization.v1.ts"
)
V2_CONTRACT = ROOT / "shared" / "contracts" / (
    "nhm2-spherical-boson-star-v2-si-output-normalization.v2.ts"
)
CODATA = ROOT / "configs" / "constants" / "codata-2022.v1.json"

V1_RAW_SHA256 = "816bd0c415e0a1a3cc069f26c9ef368ba467abbebafe0b64681eb4e17661865f"
V1_RAW_SIZE = 39984
V1_CANONICAL_SHA256 = "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24"
V1_CANONICAL_SIZE = 23822
V2_RAW_SHA256 = "6d5d539b5c93409b6a0afefe0afdf9c32aa27f98fb1d133efb8c6d19e66a86cc"
V2_RAW_SIZE = 26854
V2_CANONICAL_SHA256 = "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb"
V2_CANONICAL_SIZE = 15246
CODATA_SHA256 = "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61"
CODATA_SIZE = 6180
PRECISION = 256
TRACE_COUNT = 139
MANIFEST_ENV = "NHM2_SI_INDEPENDENT_LINUX_MPFR_MANIFEST_JSON"

# Filled from the independently evaluated reference model and pinned so a later
# edit cannot silently redefine what this test calls a golden.
TRACE_GOLDEN_SHA256 = "20b9bb016b9609f629e6b11e87225fe227a3a48e996b16581efda24f7c2bff72"
ENDPOINT_GOLDEN_SHA256 = "dce8fb7b11ca6aa985ae1c60e8c73cd4e60da1089ebb2a68073de93d0af11b9f"
CENTRAL_GOLDEN_SHA256 = "bca54e3563f440bbf744199bb86443479dadcf8437f2bd11e5f7c958a7b9ca42"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def decimal_fraction(text: str) -> Fraction:
    match = re.fullmatch(r"\+?(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?", text)
    if match is None:
        raise AssertionError(f"invalid frozen decimal: {text!r}")
    whole, fractional, exponent_text = match.groups()
    fractional = fractional or ""
    exponent10 = int(exponent_text or "0") - len(fractional)
    significand = int(whole + fractional)
    if exponent10 >= 0:
        return Fraction(significand * 10**exponent10, 1)
    return Fraction(significand, 10 ** (-exponent10))


def power_two(exponent: int) -> Fraction:
    return Fraction(1 << exponent, 1) if exponent >= 0 else Fraction(1, 1 << (-exponent))


def floor_log2(value: Fraction) -> int:
    if value <= 0:
        raise AssertionError("positive value required")
    exponent = value.numerator.bit_length() - value.denominator.bit_length()
    if value < power_two(exponent):
        exponent -= 1
    if not (power_two(exponent) <= value < power_two(exponent + 1)):
        raise AssertionError("floor_log2 invariant")
    return exponent


def round_fraction(value: Fraction, precision: int, mode: str) -> Fraction:
    if value <= 0:
        raise AssertionError("the frozen normalization graph is strictly positive")
    exponent = floor_log2(value)
    quantum = power_two(exponent - precision + 1)
    quotient = value / quantum
    lower, remainder = divmod(quotient.numerator, quotient.denominator)
    if mode == "RNDD":
        integer = lower
    elif mode == "RNDU":
        integer = lower + (remainder != 0)
    elif mode == "RNDN":
        doubled = remainder * 2
        if doubled < quotient.denominator:
            integer = lower
        elif doubled > quotient.denominator:
            integer = lower + 1
        else:
            integer = lower if lower % 2 == 0 else lower + 1
    else:
        raise AssertionError(mode)
    return Fraction(integer, 1) * quantum


def round_sqrt(value: Fraction, precision: int, mode: str) -> tuple[Fraction, int]:
    if value <= 0:
        raise AssertionError("positive radicand required")
    sqrt_exponent = floor_log2(value) // 2
    quantum = power_two(sqrt_exponent - precision + 1)
    scaled_square = value / (quantum * quantum)
    floor_integer = math.isqrt(scaled_square.numerator // scaled_square.denominator)
    while Fraction((floor_integer + 1) ** 2, 1) <= scaled_square:
        floor_integer += 1
    while Fraction(floor_integer**2, 1) > scaled_square:
        floor_integer -= 1
    exact = Fraction(floor_integer**2, 1) == scaled_square
    if mode == "RNDD" or exact:
        integer = floor_integer
    elif mode == "RNDU":
        integer = floor_integer + 1
    elif mode == "RNDN":
        midpoint_squared = Fraction((2 * floor_integer + 1) ** 2, 4)
        if scaled_square < midpoint_squared:
            integer = floor_integer
        elif scaled_square > midpoint_squared:
            integer = floor_integer + 1
        else:
            integer = floor_integer if floor_integer % 2 == 0 else floor_integer + 1
    else:
        raise AssertionError(mode)
    result = Fraction(integer, 1) * quantum
    comparison = (result * result > value) - (result * result < value)
    return result, comparison


def alternating_atan_bounds(inverse: int, final_index: int) -> tuple[Fraction, Fraction]:
    def partial(last: int) -> Fraction:
        total = Fraction(0, 1)
        for index in range(last + 1):
            term = Fraction(1, (2 * index + 1) * inverse ** (2 * index + 1))
            total = total + term if index % 2 == 0 else total - term
        return total

    a = partial(final_index)
    b = partial(final_index + 1)
    return (a, b) if a < b else (b, a)


def pi_bounds() -> tuple[Fraction, Fraction]:
    # pi = 16 atan(1/5) - 4 atan(1/239).  The alternating remainders make
    # these exact rational lower/upper bounds; their width is far below 2^-320.
    five_lower, five_upper = alternating_atan_bounds(5, 82)
    other_lower, other_upper = alternating_atan_bounds(239, 20)
    lower = 16 * five_lower - 4 * other_upper
    upper = 16 * five_upper - 4 * other_lower
    if not lower < upper or upper - lower >= power_two(-320):
        raise AssertionError("pi bound is not sufficiently sharp")
    return lower, upper


PI_LOWER, PI_UPPER = pi_bounds()


def round_pi(mode: str) -> tuple[Fraction, int]:
    lower_result = round_fraction(PI_LOWER, PRECISION, mode)
    upper_result = round_fraction(PI_UPPER, PRECISION, mode)
    if lower_result != upper_result:
        raise AssertionError("pi bounds do not determine one MPFR256 result")
    result = lower_result
    if result < PI_LOWER:
        ternary = -1
    elif result > PI_UPPER:
        ternary = 1
    else:
        raise AssertionError("irrational pi unexpectedly equals a dyadic candidate")
    return result, ternary


def dyadic(value: Fraction, precision: int, direction: str) -> dict[str, object]:
    sign = (value > 0) - (value < 0)
    if sign == 0:
        return {
            "direction": direction,
            "exponent2": 0,
            "mantissaLowercaseHex": "0",
            "precisionBits": precision,
            "sign": 0,
        }
    magnitude = abs(value)
    exponent2 = floor_log2(magnitude) - precision + 1
    scaled = magnitude / power_two(exponent2)
    if scaled.denominator != 1 or scaled.numerator.bit_length() != precision:
        raise AssertionError((value, precision, exponent2, scaled))
    return {
        "direction": direction,
        "exponent2": exponent2,
        "mantissaLowercaseHex": format(scaled.numerator, "x"),
        "precisionBits": precision,
        "sign": sign,
    }


def f64_bits(value: Fraction) -> int:
    exponent = floor_log2(value)
    if not (-1022 <= exponent <= 1023):
        raise AssertionError("reference outputs must be finite normal binary64")
    mantissa_fraction = value / power_two(exponent - 52)
    if mantissa_fraction.denominator != 1:
        raise AssertionError("value is not binary64 exact")
    mantissa = mantissa_fraction.numerator
    if not (1 << 52 <= mantissa < 1 << 53):
        raise AssertionError("binary64 mantissa invariant")
    return ((exponent + 1023) << 52) | (mantissa - (1 << 52))


@dataclass(frozen=True)
class RefValue:
    value: Fraction
    producer: str


@dataclass(frozen=True)
class RefInterval:
    lower: RefValue
    upper: RefValue


class ReferenceModel:
    def __init__(self) -> None:
        self.specs: list[tuple[str, str, str, str]] = []
        self.trace: list[dict[str, object]] = []
        self.intervals: list[dict[str, object]] = []
        self.central: list[dict[str, object]] = []
        self.exact_endpoint_pairs: list[tuple[str, str]] = []

    def _append(
        self,
        label: str,
        primitive: str,
        rounding: str,
        sources: str,
        result: Fraction,
        ternary: int,
        precision: int = PRECISION,
    ) -> RefValue:
        self.specs.append((label, primitive, rounding, sources))
        if primitive == "mpfr_set_str":
            return_case = "mpfr_set_str_parse_status"
        elif primitive == "mpfr_get_d":
            return_case = "mpfr_get_d_binary64_result"
        else:
            return_case = "ordinary_ternary_returning_mpfr_primitive"
        self.trace.append(
            {
                "canonicalResultDyadic": dyadic(result, precision, rounding),
                "forbiddenFlagsInFrozenOrder": [False, False, False, False, False],
                "label": label,
                "ordinal": len(self.trace) + 1,
                "primitive": primitive,
                "returnCase": return_case,
                "roundingMode": rounding,
                "sources": sources.split(",") if sources else [],
                "ternarySign": ternary,
            }
        )
        return RefValue(result, label)

    def rational_op(
        self,
        label: str,
        primitive: str,
        rounding: str,
        sources: str,
        exact: Fraction,
    ) -> RefValue:
        result = round_fraction(exact, PRECISION, rounding)
        ternary = (result > exact) - (result < exact)
        return self._append(label, primitive, rounding, sources, result, ternary)

    def pi_op(self, label: str, rounding: str) -> RefValue:
        result, ternary = round_pi(rounding)
        return self._append(
            label, "mpfr_const_pi", rounding, "mathematical:pi", result, ternary
        )

    def sqrt_op(self, label: str, rounding: str, source: RefValue) -> RefValue:
        result, ternary = round_sqrt(source.value, PRECISION, rounding)
        return self._append(
            label, "mpfr_sqrt", rounding, source.producer, result, ternary
        )

    def get_d(self, label: str, source: RefValue) -> tuple[dict[str, object], int]:
        result = round_fraction(source.value, 53, "RNDN")
        ternary = (result > source.value) - (result < source.value)
        self._append(label, "mpfr_get_d", "RNDN", source.producer, result, ternary, 53)
        bits = f64_bits(result)
        return dyadic(source.value, PRECISION, "RNDN"), bits

    def interval_dyadic(self, prefix: str, root: str, exponent: int) -> RefInterval:
        mantissa = self.rational_op(
            f"{prefix}_mantissa_set_z", "mpfr_set_z", "RNDN", root, Fraction(1, 1)
        )
        lower = self.rational_op(
            f"{prefix}_lower_mul_2si",
            "mpfr_mul_2si",
            "RNDN",
            mantissa.producer,
            mantissa.value * power_two(exponent),
        )
        upper = self.rational_op(
            f"{prefix}_upper_set", "mpfr_set", "RNDN", lower.producer, lower.value
        )
        self.exact_endpoint_pairs.append((lower.producer, upper.producer))
        return RefInterval(lower, upper)

    def interval_uint(self, prefix: str, integer: int, root: str) -> RefInterval:
        lower = self.rational_op(
            f"{prefix}_lower_set_ui", "mpfr_set_ui", "RNDN", root, Fraction(integer)
        )
        upper = self.rational_op(
            f"{prefix}_upper_set", "mpfr_set", "RNDN", lower.producer, lower.value
        )
        self.exact_endpoint_pairs.append((lower.producer, upper.producer))
        return RefInterval(lower, upper)

    def interval_decimal(self, prefix: str, text: str, root: str) -> RefInterval:
        exact = decimal_fraction(text)
        lower = self.rational_op(
            f"{prefix}_lower_set_str", "mpfr_set_str", "RNDD", root, exact
        )
        upper = self.rational_op(
            f"{prefix}_upper_set_str", "mpfr_set_str", "RNDU", root, exact
        )
        return RefInterval(lower, upper)

    def interval_pi(self, prefix: str) -> RefInterval:
        return RefInterval(
            self.pi_op(f"{prefix}_lower_const_pi", "RNDD"),
            self.pi_op(f"{prefix}_upper_const_pi", "RNDU"),
        )

    def interval_mul(self, prefix: str, a: RefInterval, b: RefInterval) -> RefInterval:
        lower_sources = f"{a.lower.producer},{b.lower.producer}"
        upper_sources = f"{a.upper.producer},{b.upper.producer}"
        return RefInterval(
            self.rational_op(
                f"{prefix}_lower_mul",
                "mpfr_mul",
                "RNDD",
                lower_sources,
                a.lower.value * b.lower.value,
            ),
            self.rational_op(
                f"{prefix}_upper_mul",
                "mpfr_mul",
                "RNDU",
                upper_sources,
                a.upper.value * b.upper.value,
            ),
        )

    def interval_div(self, prefix: str, a: RefInterval, b: RefInterval) -> RefInterval:
        return RefInterval(
            self.rational_op(
                f"{prefix}_lower_div",
                "mpfr_div",
                "RNDD",
                f"{a.lower.producer},{b.upper.producer}",
                a.lower.value / b.upper.value,
            ),
            self.rational_op(
                f"{prefix}_upper_div",
                "mpfr_div",
                "RNDU",
                f"{a.upper.producer},{b.lower.producer}",
                a.upper.value / b.lower.value,
            ),
        )

    def interval_square(self, prefix: str, a: RefInterval) -> RefInterval:
        return RefInterval(
            self.rational_op(
                f"{prefix}_lower_mul",
                "mpfr_mul",
                "RNDD",
                f"{a.lower.producer},{a.lower.producer}",
                a.lower.value * a.lower.value,
            ),
            self.rational_op(
                f"{prefix}_upper_mul",
                "mpfr_mul",
                "RNDU",
                f"{a.upper.producer},{a.upper.producer}",
                a.upper.value * a.upper.value,
            ),
        )

    def interval_sqrt(self, prefix: str, a: RefInterval) -> RefInterval:
        return RefInterval(
            self.sqrt_op(f"{prefix}_lower_sqrt", "RNDD", a.lower),
            self.sqrt_op(f"{prefix}_upper_sqrt", "RNDU", a.upper),
        )

    def symmetric_hull(
        self,
        prefix: str,
        center: RefInterval,
        uncertainty: RefInterval,
        coverage: int,
        root: str,
    ) -> RefInterval:
        k = self.interval_uint(f"{prefix}_k", coverage, root)
        radius_lower = self.rational_op(
            f"{prefix}_radius_lower_mul",
            "mpfr_mul",
            "RNDU",
            f"{k.upper.producer},{uncertainty.upper.producer}",
            k.upper.value * uncertainty.upper.value,
        )
        radius_upper = self.rational_op(
            f"{prefix}_radius_upper_mul",
            "mpfr_mul",
            "RNDU",
            f"{k.upper.producer},{uncertainty.upper.producer}",
            k.upper.value * uncertainty.upper.value,
        )
        return RefInterval(
            self.rational_op(
                f"{prefix}_lower_sub",
                "mpfr_sub",
                "RNDD",
                f"{center.lower.producer},{radius_lower.producer}",
                center.lower.value - radius_lower.value,
            ),
            self.rational_op(
                f"{prefix}_upper_add",
                "mpfr_add",
                "RNDU",
                f"{center.upper.producer},{radius_upper.producer}",
                center.upper.value + radius_upper.value,
            ),
        )

    def central_dyadic(self) -> RefValue:
        mantissa = self.rational_op(
            "c01_g_mantissa_set_z",
            "mpfr_set_z",
            "RNDN",
            "frozen:g_mantissa_1",
            Fraction(1, 1),
        )
        return self.rational_op(
            "c01_gN_mul_2si",
            "mpfr_mul_2si",
            "RNDN",
            mantissa.producer,
            mantissa.value * power_two(-40),
        )

    def central_uint(self, label: str, integer: int, root: str) -> RefValue:
        return self.rational_op(label, "mpfr_set_ui", "RNDN", root, Fraction(integer))

    def central_decimal(self, label: str, text: str, root: str) -> RefValue:
        return self.rational_op(
            label, "mpfr_set_str", "RNDN", root, decimal_fraction(text)
        )

    def central_binary(
        self, label: str, primitive: str, a: RefValue, b: RefValue
    ) -> RefValue:
        if primitive == "mpfr_mul":
            exact = a.value * b.value
        elif primitive == "mpfr_div":
            exact = a.value / b.value
        else:
            raise AssertionError(primitive)
        return self.rational_op(
            label, primitive, "RNDN", f"{a.producer},{b.producer}", exact
        )

    def build(self) -> "ReferenceModel":
        d: dict[str, RefInterval] = {}
        d["g"] = self.interval_dyadic("d01_g", "frozen:g_mantissa_1", -40)
        d["c"] = self.interval_uint("d02_c", 299792458, "frozen:c_299792458")
        d["h"] = self.interval_decimal(
            "d03_h", "6.62607015e-34", "frozen:h_6.62607015e-34"
        )
        d["pi"] = self.interval_pi("d04_pi")
        d["two"] = self.interval_uint("d05_two", 2, "frozen:integer_2")
        d["eight"] = self.interval_uint("d06_eight", 8, "frozen:integer_8")
        d["twoPi"] = self.interval_mul("d07_twoPi", d["two"], d["pi"])
        d["hbar"] = self.interval_div("d08_hbar", d["h"], d["twoPi"])
        d["GCentral"] = self.interval_decimal(
            "d09_GCentral", "6.67430e-11", "frozen:G_6.67430e-11"
        )
        d["GUncertainty"] = self.interval_decimal(
            "d10_GStandardUncertainty", "1.5e-15", "frozen:G_u_1.5e-15"
        )
        d["GOneSigma"] = self.symmetric_hull(
            "d11_GOneSigma",
            d["GCentral"],
            d["GUncertainty"],
            1,
            "frozen:coverage_1",
        )
        d["GAdmissionK2"] = self.symmetric_hull(
            "d12_GAdmissionK2",
            d["GCentral"],
            d["GUncertainty"],
            2,
            "frozen:coverage_2",
        )
        d["eightPi"] = self.interval_mul("d13_eightPi", d["eight"], d["pi"])
        d["c2"] = self.interval_mul("d14_c2", d["c"], d["c"])
        d["c3"] = self.interval_mul("d15_c3", d["c2"], d["c"])
        d["c4"] = self.interval_mul("d16_c4", d["c2"], d["c2"])
        d["c5"] = self.interval_mul("d17_c5", d["c4"], d["c"])
        d["c7"] = self.interval_mul("d18_c7", d["c4"], d["c3"])
        d["gHbar"] = self.interval_mul("d19_gHbar", d["g"], d["hbar"])
        d["gHbarC5"] = self.interval_mul("d20_gHbarC5", d["gHbar"], d["c5"])
        d["eightPiGCentral"] = self.interval_mul(
            "d21_eightPiGCentral", d["eightPi"], d["GCentral"]
        )
        d["muECentralSquared"] = self.interval_div(
            "d22_muECentralSquared", d["gHbarC5"], d["eightPiGCentral"]
        )
        d["muECentral"] = self.interval_sqrt(
            "d23_muECentral", d["muECentralSquared"]
        )
        d["hbarC"] = self.interval_mul("d24_hbarC", d["hbar"], d["c"])
        d["muLCentral"] = self.interval_div(
            "d25_muLCentral", d["muECentral"], d["hbarC"]
        )
        d["muLCentralSquared"] = self.interval_square(
            "d26_muLCentralSquared", d["muLCentral"]
        )
        d["c4MuLCentralSquared"] = self.interval_mul(
            "d27_c4MuLCentralSquared", d["c4"], d["muLCentralSquared"]
        )
        d["stressCentralViaMu"] = self.interval_div(
            "d28_stressScaleCentralViaMu",
            d["c4MuLCentralSquared"],
            d["eightPiGCentral"],
        )
        d["eightPiGCentralSquared"] = self.interval_square(
            "d29_eightPiGCentralSquared", d["eightPiGCentral"]
        )
        d["eightPiGCentralSquaredHbar"] = self.interval_mul(
            "d30_eightPiGCentralSquaredHbar",
            d["eightPiGCentralSquared"],
            d["hbar"],
        )
        d["gC7"] = self.interval_mul("d31_gC7", d["g"], d["c7"])
        d["stressCentral"] = self.interval_div(
            "d32_stressScaleCentral", d["gC7"], d["eightPiGCentralSquaredHbar"]
        )
        d["noiseCentral"] = self.interval_square(
            "d33_noiseScaleCentral", d["stressCentral"]
        )

        def branch(tag: str, start: int, g_interval: RefInterval) -> dict[str, RefInterval]:
            out: dict[str, RefInterval] = {}
            out["eightPiG"] = self.interval_mul(
                f"d{start}_eightPiG{tag}", d["eightPi"], g_interval
            )
            out["muE2"] = self.interval_div(
                f"d{start + 1}_muE{tag}Squared", d["gHbarC5"], out["eightPiG"]
            )
            out["muE"] = self.interval_sqrt(f"d{start + 2}_muE{tag}", out["muE2"])
            out["muL"] = self.interval_div(
                f"d{start + 3}_muL{tag}", out["muE"], d["hbarC"]
            )
            out["eightPiG2"] = self.interval_square(
                f"d{start + 4}_eightPiG{tag}Squared", out["eightPiG"]
            )
            out["eightPiG2Hbar"] = self.interval_mul(
                f"d{start + 5}_eightPiG{tag}SquaredHbar", out["eightPiG2"], d["hbar"]
            )
            out["stress"] = self.interval_div(
                f"d{start + 6}_stressScale{tag}", d["gC7"], out["eightPiG2Hbar"]
            )
            out["noise"] = self.interval_square(
                f"d{start + 7}_noiseScale{tag}", out["stress"]
            )
            return out

        one = branch("OneSigma", 34, d["GOneSigma"])
        k2 = branch("AdmissionK2", 42, d["GAdmissionK2"])

        interval_outputs = [
            ("mu_E_central", d["muECentral"]),
            ("mu_L_central", d["muLCentral"]),
            ("stress_scale_central_via_mu", d["stressCentralViaMu"]),
            ("stress_scale_central_closed", d["stressCentral"]),
            ("noise_scale_central", d["noiseCentral"]),
            ("mu_E_one_sigma", one["muE"]),
            ("mu_L_one_sigma", one["muL"]),
            ("stress_scale_one_sigma", one["stress"]),
            ("noise_scale_one_sigma", one["noise"]),
            ("mu_E_admission_k2", k2["muE"]),
            ("mu_L_admission_k2", k2["muL"]),
            ("stress_scale_admission_k2", k2["stress"]),
            ("noise_scale_admission_k2", k2["noise"]),
        ]
        self.intervals = [
            {
                "id": identity,
                "lower": dyadic(interval.lower.value, PRECISION, "RNDD"),
                "upper": dyadic(interval.upper.value, PRECISION, "RNDU"),
            }
            for identity, interval in interval_outputs
        ]

        c: dict[str, RefValue] = {}
        c["g"] = self.central_dyadic()
        c["c"] = self.central_uint("c02_cN_set_ui", 299792458, "frozen:c_299792458")
        c["h"] = self.central_decimal(
            "c03_hN_set_str", "6.62607015e-34", "frozen:h_6.62607015e-34"
        )
        pi_result, pi_ternary = round_pi("RNDN")
        c["pi"] = self._append(
            "c04_piN_const_pi",
            "mpfr_const_pi",
            "RNDN",
            "mathematical:pi",
            pi_result,
            pi_ternary,
        )
        c["two"] = self.central_uint("c05_twoN_set_ui", 2, "frozen:integer_2")
        c["eight"] = self.central_uint("c06_eightN_set_ui", 8, "frozen:integer_8")
        c["twoPi"] = self.central_binary("c07_twoPiN_mul", "mpfr_mul", c["two"], c["pi"])
        c["hbar"] = self.central_binary("c08_hbarN_div", "mpfr_div", c["h"], c["twoPi"])
        c["G"] = self.central_decimal(
            "c09_GN_set_str", "6.67430e-11", "frozen:G_6.67430e-11"
        )
        c["eightPi"] = self.central_binary(
            "c10_eightPiN_mul", "mpfr_mul", c["eight"], c["pi"]
        )
        c["c2"] = self.central_binary("c11_c2N_mul", "mpfr_mul", c["c"], c["c"])
        c["c3"] = self.central_binary("c12_c3N_mul", "mpfr_mul", c["c2"], c["c"])
        c["c4"] = self.central_binary("c13_c4N_mul", "mpfr_mul", c["c2"], c["c2"])
        c["c5"] = self.central_binary("c14_c5N_mul", "mpfr_mul", c["c4"], c["c"])
        c["c7"] = self.central_binary("c15_c7N_mul", "mpfr_mul", c["c4"], c["c3"])
        c["gHbar"] = self.central_binary("c16_gHbarN_mul", "mpfr_mul", c["g"], c["hbar"])
        c["gHbarC5"] = self.central_binary(
            "c17_gHbarC5N_mul", "mpfr_mul", c["gHbar"], c["c5"]
        )
        c["eightPiG"] = self.central_binary(
            "c18_eightPiGN_mul", "mpfr_mul", c["eightPi"], c["G"]
        )
        c["muE2"] = self.central_binary(
            "c19_muE2N_div", "mpfr_div", c["gHbarC5"], c["eightPiG"]
        )
        c["muE"] = self.sqrt_op("c20_muEN_sqrt", "RNDN", c["muE2"])
        c["hbarC"] = self.central_binary(
            "c21_hbarCN_mul", "mpfr_mul", c["hbar"], c["c"]
        )
        c["muL"] = self.central_binary("c22_muLN_div", "mpfr_div", c["muE"], c["hbarC"])
        c["eightPiG2"] = self.central_binary(
            "c23_eightPiG2N_mul", "mpfr_mul", c["eightPiG"], c["eightPiG"]
        )
        c["eightPiG2Hbar"] = self.central_binary(
            "c24_eightPiG2HbarN_mul", "mpfr_mul", c["eightPiG2"], c["hbar"]
        )
        c["gC7"] = self.central_binary("c25_gC7N_mul", "mpfr_mul", c["g"], c["c7"])
        c["stress"] = self.central_binary(
            "c26_stressScaleN_div", "mpfr_div", c["gC7"], c["eightPiG2Hbar"]
        )
        c["noise"] = self.central_binary(
            "c27_noiseScaleN_mul", "mpfr_mul", c["stress"], c["stress"]
        )

        central_sources = [
            ("mu_E_central", "o01_mu_E_central_get_d", c["muE"]),
            ("mu_L_central", "o02_mu_L_central_get_d", c["muL"]),
            (
                "stress_scale_central_closed",
                "o03_stress_scale_central_closed_get_d",
                c["stress"],
            ),
            ("noise_scale_central", "o04_noise_scale_central_get_d", c["noise"]),
        ]
        self.central = []
        for identity, label, source in central_sources:
            source_dyadic, bits = self.get_d(label, source)
            self.central.append(
                {
                    "dyadic": source_dyadic,
                    "f64leHex": bits.to_bytes(8, "little").hex(),
                    "id": identity,
                }
            )

        if len(self.specs) != TRACE_COUNT or len(self.trace) != TRACE_COUNT:
            raise AssertionError((len(self.specs), len(self.trace)))
        if len(self.intervals) != 13 or len(self.central) != 4:
            raise AssertionError("receipt count invariant")
        return self


def extract_c_trace_specs(source: str) -> list[tuple[str, str, str, str]]:
    pattern = re.compile(
        r'TS\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]*)"\),'
    )
    return [tuple(match.groups()) for match in pattern.finditer(source)]


def validate_source_topology(specs: list[tuple[str, str, str, str]]) -> None:
    prior: set[str] = set()
    roots = {
        "frozen:g_mantissa_1",
        "frozen:c_299792458",
        "frozen:h_6.62607015e-34",
        "frozen:integer_2",
        "frozen:integer_8",
        "frozen:G_6.67430e-11",
        "frozen:G_u_1.5e-15",
        "frozen:coverage_1",
        "frozen:coverage_2",
        "mathematical:pi",
    }
    for label, _primitive, _rounding, source_text in specs:
        if label in prior:
            raise AssertionError(f"duplicate trace label: {label}")
        for source in source_text.split(",") if source_text else []:
            if source not in roots and source not in prior:
                raise AssertionError(f"non-causal source {source!r} for {label!r}")
        prior.add(label)


def c_function_body(source: str, name: str) -> str:
    start = source.index(f"static bool {name}(")
    opening = source.index("{", start)
    depth = 0
    for index in range(opening, len(source)):
        if source[index] == "{":
            depth += 1
        elif source[index] == "}":
            depth -= 1
            if depth == 0:
                return source[opening : index + 1]
    raise AssertionError(f"unterminated C function {name}")


def validate_exact_endpoint_guard(source: str) -> None:
    guard = c_function_body(source, "require_exact_endpoint_pair")
    required_guard = re.compile(
        r"if\s*\(\s*!mpfr_equal_p\(interval->lower\.value,\s*"
        r"interval->upper\.value\)\s*\)\s*\{\s*"
        r'return set_error\(run,\s*"E_EXACT_ENDPOINT_MISMATCH"\);\s*\}',
        re.DOTALL,
    )
    if required_guard.search(guard) is None:
        raise AssertionError("exact endpoint equality is not fail-closed")
    for function_name in ("interval_dyadic", "interval_uint"):
        body = c_function_body(source, function_name)
        set_position = body.index("!call_set(run, &out->upper, &out->lower)")
        guard_position = body.index("!require_exact_endpoint_pair(run, out)")
        validate_position = body.rindex("validate_interval(run, out)")
        if not set_position < guard_position < validate_position:
            raise AssertionError(f"exact endpoint guard chronology drift: {function_name}")


class IndependentSourceCandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.c_bytes = C_SOURCE.read_bytes()
        cls.c_text = cls.c_bytes.decode("ascii")
        cls.test_bytes = THIS_TEST.read_bytes()
        cls.test_text = cls.test_bytes.decode("utf-8")
        cls.model = ReferenceModel().build()

    def test_frozen_input_raw_and_semantic_pins(self) -> None:
        v1 = V1_CONTRACT.read_bytes()
        v2 = V2_CONTRACT.read_bytes()
        codata = CODATA.read_bytes()
        self.assertEqual((len(v1), sha256_bytes(v1)), (V1_RAW_SIZE, V1_RAW_SHA256))
        self.assertEqual((len(v2), sha256_bytes(v2)), (V2_RAW_SIZE, V2_RAW_SHA256))
        self.assertEqual((len(codata), sha256_bytes(codata)), (CODATA_SIZE, CODATA_SHA256))

        v1_text = v1.decode("utf-8")
        v2_text = v2.decode("utf-8")
        self.assertIn(V1_CANONICAL_SHA256, v1_text)
        self.assertIn("23_822", v1_text)
        self.assertIn(V2_CANONICAL_SHA256, v2_text)
        self.assertIn("15_246", v2_text)
        self.assertIn(V1_CANONICAL_SHA256, v2_text)
        self.assertIn("23_822", v2_text)
        self.assertIn(CODATA_SHA256, v1_text)
        self.assertIn(CODATA_SHA256, v2_text)
        self.assertIn('mpfrVersion: "4.2.2"', v2_text)
        self.assertIn('gmpVersion: "6.3.0"', v2_text)

        for pin in (
            V1_CANONICAL_SHA256,
            V2_CANONICAL_SHA256,
            V2_RAW_SHA256,
            CODATA_SHA256,
        ):
            self.assertIn(pin, self.c_text)
        for number in ("23822", "15246", "26854", "6180"):
            self.assertIn(number, self.c_text)

    def test_no_forbidden_lane_path_or_import(self) -> None:
        forbidden_lane = "nhm2-spherical-boson-star-v2-" + "primary"
        for text in (self.c_text.lower(), self.test_text.lower()):
            self.assertNotIn(forbidden_lane, text)

        include_tokens = re.findall(r"^\s*#include\s+([^\s]+)", self.c_text, re.MULTILINE)
        self.assertEqual(
            set(include_tokens),
            {
                "<float.h>",
                "<gmp.h>",
                "<math.h>",
                "<mpfr.h>",
                "<stdarg.h>",
                "<stdbool.h>",
                "<stdint.h>",
                "<stdio.h>",
                "<string.h>",
            },
        )
        self.assertFalse(any(token.startswith('"') for token in include_tokens))

        tree = ast.parse(self.test_text)
        allowed_modules = {
            "__future__",
            "ast",
            "hashlib",
            "json",
            "math",
            "os",
            "platform",
            "re",
            "subprocess",
            "tempfile",
            "unittest",
            "dataclasses",
            "fractions",
            "pathlib",
        }
        imported: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                imported.add((node.module or "").split(".")[0])
        self.assertLessEqual(imported, allowed_modules)
        for forbidden in ("ctypes", "cffi", "mpmath", "numpy", "scipy", "decimal"):
            self.assertNotIn(forbidden, imported)

    def test_exact_static_operation_chronology_and_topology(self) -> None:
        c_specs = extract_c_trace_specs(self.c_text)
        self.assertEqual(len(c_specs), TRACE_COUNT)
        self.assertEqual(c_specs, self.model.specs)
        validate_source_topology(c_specs)
        self.assertEqual(len({entry[0] for entry in c_specs}), TRACE_COUNT)
        self.assertEqual(sum(label.startswith("d") for label, *_ in c_specs), 107)
        self.assertEqual(sum(label.startswith("c") for label, *_ in c_specs), 28)
        self.assertEqual(sum(label.startswith("o") for label, *_ in c_specs), 4)
        self.assertEqual(
            self.model.exact_endpoint_pairs,
            [
                ("d01_g_lower_mul_2si", "d01_g_upper_set"),
                ("d02_c_lower_set_ui", "d02_c_upper_set"),
                ("d05_two_lower_set_ui", "d05_two_upper_set"),
                ("d06_eight_lower_set_ui", "d06_eight_upper_set"),
                ("d11_GOneSigma_k_lower_set_ui", "d11_GOneSigma_k_upper_set"),
                ("d12_GAdmissionK2_k_lower_set_ui", "d12_GAdmissionK2_k_upper_set"),
            ],
        )
        execute_directed = c_function_body(self.c_text, "execute_graphs").split(
            "if (mpfr_cmp", 1
        )[0]
        exact_constructor_calls = re.findall(
            r"!interval_(dyadic|uint|symmetric_hull)\(run,&d\[(\d+)\]",
            execute_directed,
        )
        self.assertEqual(
            exact_constructor_calls,
            [
                ("dyadic", "0"),
                ("uint", "1"),
                ("uint", "4"),
                ("uint", "5"),
                ("symmetric_hull", "10"),
                ("symmetric_hull", "11"),
            ],
        )
        self.assertEqual(
            c_function_body(self.c_text, "interval_symmetric_hull").count(
                "interval_uint(run, k"
            ),
            1,
        )
        validate_exact_endpoint_guard(self.c_text)
        hostile_guard = self.c_text.replace(
            "if (!mpfr_equal_p(interval->lower.value, interval->upper.value))",
            "if (mpfr_equal_p(interval->lower.value, interval->upper.value))",
            1,
        )
        self.assertNotEqual(hostile_guard, self.c_text)
        with self.assertRaisesRegex(AssertionError, "not fail-closed"):
            validate_exact_endpoint_guard(hostile_guard)
        hostile_order = self.c_text.replace(
            "!require_exact_endpoint_pair(run, out)) return false;",
            "true) return false;",
            1,
        )
        self.assertNotEqual(hostile_order, self.c_text)
        with self.assertRaises((AssertionError, ValueError)):
            validate_exact_endpoint_guard(hostile_order)

        required_runtime_binders = (
            'strcmp(spec->primitive, primitive)',
            'strcmp(spec->rounding, rounding)',
            'strcmp(spec->sources, sources)',
            'run->trace_count != TRACE_COUNT',
            'inexact != (ternary != 0)',
            'parse_status != 0',
            'inexact ||',
            'mpfr_clear_flags();',
            'capture_forbidden(flags)',
        )
        for binder in required_runtime_binders:
            self.assertIn(binder, self.c_text)

        direct_calls = {
            "mpfr_set_z",
            "mpfr_mul_2si",
            "mpfr_set_ui",
            "mpfr_set",
            "mpfr_set_str",
            "mpfr_const_pi",
            "mpfr_mul",
            "mpfr_div",
            "mpfr_sub",
            "mpfr_add",
            "mpfr_sqrt",
            "mpfr_get_d",
            "mpfr_equal_p",
        }
        for primitive in direct_calls:
            self.assertRegex(self.c_text, rf"\b{primitive}\s*\(")
        for forbidden_wrapper in (
            "boost::",
            "mpmath",
            "long double",
            "__float128",
            "fesetround",
            "system(",
            "popen(",
            "getenv(",
        ):
            self.assertNotIn(forbidden_wrapper, self.c_text)

    def test_hash_gate_context_cleanup_and_one_shot_protocol_are_static(self) -> None:
        main_text = self.c_text[self.c_text.index("int main(") :]
        self.assertLess(main_text.index("digest_matches_hex"), main_text.index("mpfr_get_version"))
        self.assertLess(main_text.index("digest_matches_hex"), main_text.index("mpfr_set_emin"))
        self.assertLess(main_text.index("mpfr_set_emax"), main_text.index("execute_graphs"))
        self.assertLess(main_text.index("binary64_layout_ok"), main_text.index("execute_graphs"))
        self.assertLess(main_text.index("build_receipt"), main_text.index("clear_values_reverse"))
        self.assertLess(main_text.index("clear_values_reverse"), main_text.rindex("mpfr_set_emin"))
        self.assertLess(main_text.rindex("mpfr_set_emax"), main_text.index("fwrite(receipt"))
        self.assertIn("while (run->registry_count > 0u)", self.c_text)
        self.assertIn("run->registry[--run->registry_count]", self.c_text)
        self.assertEqual(main_text.count("fwrite(receipt"), 1)
        self.assertEqual(len(re.findall(r"fwrite\([^;]*stdout\)", main_text)), 1)
        self.assertEqual(main_text.count("fflush(stdout)"), 1)
        self.assertEqual(main_text.count("ferror(stdout)"), 1)
        self.assertLess(main_text.index("fwrite(receipt"), main_text.index("fflush(stdout)"))
        self.assertLess(main_text.index("fflush(stdout)"), main_text.index("ferror(stdout)"))
        self.assertIn("input_length!=REQUIRED_STDIN_BYTES", main_text)
        self.assertIn("RECEIPT_CAPACITY 262145u", self.c_text)
        self.assertIn("argc!=2", main_text)
        self.assertIn("source_candidate_only", self.c_text)
        self.assertIn("DBL_MIN_EXP!=-1021", self.c_text)
        for ieee_probe in (
            "0x3ff0000000000000",
            "0x3ff8000000000000",
            "0xbff0000000000000",
            "0x0000000000000000",
            "0x8000000000000000",
            "0x0010000000000000",
            "0x7ff0000000000000",
        ):
            self.assertIn(ieee_probe, self.c_text)
        self.assertIn(
            r'\"agreement\":null,\"authority\":false,\"implementationBound\":false,'
            r'\"lamps\":null,\"persisted\":false,\"physical\":false,\"readiness\":false,'
            r'\"runtimeBound\":false',
            self.c_text,
        )

    def test_independent_exact_reference_golden_seals(self) -> None:
        trace_hash = sha256_bytes(canonical_bytes(self.model.trace))
        endpoint_hash = sha256_bytes(canonical_bytes(self.model.intervals))
        central_hash = sha256_bytes(canonical_bytes(self.model.central))
        self.assertEqual(trace_hash, TRACE_GOLDEN_SHA256)
        self.assertEqual(endpoint_hash, ENDPOINT_GOLDEN_SHA256)
        self.assertEqual(central_hash, CENTRAL_GOLDEN_SHA256)
        self.assertEqual(len(self.model.trace), 139)
        self.assertEqual(len(self.model.intervals) * 2, 26)
        self.assertEqual(len(self.model.central), 4)

    def test_native_integration_requires_explicit_independent_linux_manifest(self) -> None:
        manifest_wire = os.environ.get(MANIFEST_ENV)
        if manifest_wire is None:
            self.skipTest("SKIP_NATIVE_INDEPENDENT_LINUX_MANIFEST_ABSENT")
        if platform.system() != "Linux":
            self.skipTest("SKIP_NATIVE_INDEPENDENT_LINUX_HOST_REQUIRED")
        try:
            manifest = json.loads(manifest_wire)
        except json.JSONDecodeError as error:
            self.fail(f"MANIFEST_JSON_INVALID:{error.msg}")
        required_keys = {
            "architecture",
            "compilerPath",
            "compilerSha256",
            "gmpVersion",
            "includeDirectories",
            "libraryDirectories",
            "manifestId",
            "mpfrVersion",
            "platform",
        }
        self.assertIs(type(manifest), dict)
        self.assertEqual(set(manifest), required_keys)
        self.assertEqual(
            manifest["manifestId"], "nhm2_si_independent_linux_mpfr_manifest/v1"
        )
        self.assertEqual(manifest["platform"], "linux")
        self.assertIs(type(manifest["architecture"]), str)
        self.assertTrue(manifest["architecture"])
        self.assertEqual(manifest["mpfrVersion"], "4.2.2")
        self.assertEqual(manifest["gmpVersion"], "6.3.0")

        compiler = Path(manifest["compilerPath"])
        self.assertTrue(compiler.is_absolute() and compiler.is_file())
        self.assertEqual(sha256_bytes(compiler.read_bytes()), manifest["compilerSha256"])
        include_directories = [Path(item) for item in manifest["includeDirectories"]]
        library_directories = [Path(item) for item in manifest["libraryDirectories"]]
        self.assertTrue(all(path.is_absolute() and path.is_dir() for path in include_directories))
        self.assertTrue(all(path.is_absolute() and path.is_dir() for path in library_directories))

        with tempfile.TemporaryDirectory(prefix="nhm2_si_independent_") as temporary:
            executable = Path(temporary) / "si_normalization_native"
            command = [
                str(compiler),
                "-std=c11",
                "-O2",
                "-fno-fast-math",
                "-Wall",
                "-Wextra",
                "-Werror",
                *(f"-I{path}" for path in include_directories),
                str(C_SOURCE),
                *(f"-L{path}" for path in library_directories),
                *(f"-Wl,-rpath,{path}" for path in library_directories),
                "-lmpfr",
                "-lgmp",
                "-o",
                str(executable),
            ]
            compile_result = subprocess.run(
                command, capture_output=True, check=False, timeout=60
            )
            self.assertEqual(
                compile_result.returncode,
                0,
                compile_result.stderr.decode("ascii", errors="replace"),
            )
            codata = CODATA.read_bytes()
            argv = "--emit-nhm2-spherical-boson-star-v2-si-normalization-receipt-v2"
            result = subprocess.run(
                [str(executable), argv],
                input=codata,
                capture_output=True,
                check=False,
                timeout=30,
                env={"LC_ALL": "C"},
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stderr, b"")
            self.assertLessEqual(len(result.stdout), 262144)
            self.assertNotIn(b"\n", result.stdout)
            receipt = json.loads(result.stdout)
            self.assertEqual(result.stdout, canonical_bytes(receipt))
            self.assertEqual(receipt["artifactStatus"], "source_candidate_only")
            self.assertIs(receipt["sourceCandidateOnly"], True)
            self.assertEqual(receipt["trace"], self.model.trace)
            self.assertEqual(receipt["traceCount"], 139)
            self.assertEqual(receipt["intervals"], self.model.intervals)
            self.assertEqual(receipt["centralRepresentatives"], self.model.central)
            self.assertEqual(
                receipt["claims"],
                {
                    "agreement": None,
                    "authority": False,
                    "implementationBound": False,
                    "lamps": None,
                    "persisted": False,
                    "physical": False,
                    "readiness": False,
                    "runtimeBound": False,
                },
            )

            for bad_argv, bad_input, expected_code in (
                ("--wrong", codata, b"E_ARGV\n"),
                (argv, codata[:-1], b"E_STDIN_SIZE\n"),
                (argv, bytes([codata[0] ^ 1]) + codata[1:], b"E_STDIN_SHA256\n"),
            ):
                negative = subprocess.run(
                    [str(executable), bad_argv],
                    input=bad_input,
                    capture_output=True,
                    check=False,
                    timeout=30,
                    env={"LC_ALL": "C"},
                )
                self.assertNotEqual(negative.returncode, 0)
                self.assertEqual(negative.stdout, b"")
                self.assertEqual(negative.stderr, expected_code)


if __name__ == "__main__":
    unittest.main(verbosity=2)
