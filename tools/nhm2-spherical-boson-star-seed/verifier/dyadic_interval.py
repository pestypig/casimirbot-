"""Exact parser for the verifier's canonical directed MPFR endpoint ABI."""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from typing import Final


ENDPOINT_KEYS: Final[frozenset[str]] = frozenset(
    {"direction", "exponent2", "mantissaLowercaseHex", "precisionBits", "sign"}
)
MIN_EXPONENT2: Final[int] = -1_048_576
MAX_EXPONENT2: Final[int] = 1_048_576
PRECISION_BITS: Final[int] = 256


class DirectedIntervalError(ValueError):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class DirectedEndpoint:
    direction: str
    exponent2: int
    mantissa_lowercase_hex: str
    precision_bits: int
    sign: str

    @property
    def exact_value(self) -> Fraction:
        if self.sign == "zero":
            return Fraction(0)
        magnitude = int(self.mantissa_lowercase_hex, 16)
        numerator = magnitude if self.sign == "plus" else -magnitude
        if self.exponent2 >= 0:
            return Fraction(numerator << self.exponent2)
        return Fraction(numerator, 1 << -self.exponent2)


@dataclass(frozen=True, slots=True)
class DirectedInterval:
    lower: DirectedEndpoint
    upper: DirectedEndpoint

    def __post_init__(self) -> None:
        if self.lower.direction != "RNDD" or self.upper.direction != "RNDU":
            raise DirectedIntervalError(
                "interval_direction_invalid",
                f"{self.lower.direction}/{self.upper.direction}",
            )
        if self.lower.exact_value > self.upper.exact_value:
            raise DirectedIntervalError("interval_order_invalid", "lower_above_upper")


def parse_directed_endpoint(value: object) -> DirectedEndpoint:
    if type(value) is not dict:
        raise DirectedIntervalError("endpoint_object_type_invalid", type(value).__name__)
    if frozenset(value.keys()) != ENDPOINT_KEYS or any(type(key) is not str for key in value):
        raise DirectedIntervalError("endpoint_exact_keys_invalid", repr(tuple(value.keys())))

    direction = value["direction"]
    exponent2 = value["exponent2"]
    mantissa = value["mantissaLowercaseHex"]
    precision = value["precisionBits"]
    sign = value["sign"]
    if type(direction) is not str or direction not in ("RNDD", "RNDU"):
        raise DirectedIntervalError("endpoint_direction_invalid", repr(direction))
    if (
        type(exponent2) is not int
        or exponent2 < MIN_EXPONENT2
        or exponent2 > MAX_EXPONENT2
    ):
        raise DirectedIntervalError("endpoint_exponent_invalid", repr(exponent2))
    if type(precision) is not int or precision != PRECISION_BITS:
        raise DirectedIntervalError("endpoint_precision_invalid", repr(precision))
    if type(sign) is not str or sign not in ("minus", "plus", "zero"):
        raise DirectedIntervalError("endpoint_sign_invalid", repr(sign))
    if type(mantissa) is not str:
        raise DirectedIntervalError("endpoint_mantissa_type_invalid", type(mantissa).__name__)

    if sign == "zero":
        if mantissa != "0" or exponent2 != 0:
            raise DirectedIntervalError(
                "endpoint_zero_normalization_invalid", f"{mantissa}/{exponent2}"
            )
    else:
        if (
            len(mantissa) < 1
            or len(mantissa) > 64
            or mantissa[0] == "0"
            or any(character not in "0123456789abcdef" for character in mantissa)
            or int(mantissa[-1], 16) % 2 == 0
        ):
            raise DirectedIntervalError("endpoint_mantissa_normalization_invalid", mantissa)

    return DirectedEndpoint(
        direction=direction,
        exponent2=exponent2,
        mantissa_lowercase_hex=mantissa,
        precision_bits=precision,
        sign=sign,
    )


def parse_directed_interval(value: object) -> DirectedInterval:
    # A TypeScript readonly tuple is serialized as a canonical JSON array and
    # json.loads materializes that exact wire form as a built-in list.
    if type(value) is not list or len(value) != 2:
        raise DirectedIntervalError(
            "interval_exact_two_element_json_array_invalid", type(value).__name__
        )
    return DirectedInterval(
        lower=parse_directed_endpoint(value[0]),
        upper=parse_directed_endpoint(value[1]),
    )


AUTHORITY_LOCKS: Final[tuple[bool, ...]] = (False,) * 8
if any(AUTHORITY_LOCKS):
    raise RuntimeError("spherical_seed_verifier_dyadic_interval_authority_invariant")
