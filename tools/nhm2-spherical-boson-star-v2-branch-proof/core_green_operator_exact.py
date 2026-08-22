"""Exact finite core Green operators for the G2-D point residual.

Program gate: G2 — classical branch proof and terminal state
Workstream: finite proof-center point-solver implementation
Capability or component: exact shifted-Chebyshev J_1/q and J_2/q operators
Current maturity: authority-neutral exact-arithmetic reference implementation
Target maturity: source-disjoint oracle for the directed MPFR point evaluator
Required frozen inputs: G2-D core-tail packing proposal, finite/infinite audit,
    spatial degree 255, and the fixed regular Green realization
Required evidence: exact basis conversion, multiplier chronology, round-trip
    differential identities, bounded ingress, deterministic wire, and audit
Stop/fail criteria: coefficient-order drift, degree above 512, non-rational
    input, conversion disagreement, differential-identity failure, or authority
Explicit non-goals: tail joins, Newton iteration, parameter cells, proof run,
    candidate admission, Theory Graph lamp, or physical authority
Downstream gate unlocked: directed MPFR finite core residual evaluator

This module is a pure exact-arithmetic calculation reference.  It cannot mint
proof evidence or write candidate state.  Fractions are serialized only to
produce a deterministic diagnostic digest for source-disjoint comparison.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
import math
from typing import Final


__all__ = [
    "CoreGreenOperatorError",
    "apply_core_green_operator_exact",
]


MAXIMUM_INPUT_DEGREE: Final[int] = 512
PHYSICAL_CENTER_DEGREE: Final[int] = 255
INPUT_FAMILY_ORDER: Final[tuple[str, ...]] = ("R_H", "R_V1", "R_U")
OPERATOR_FOR_FAMILY: Final[tuple[int, ...]] = (1, 2, 2)
WIRE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/core-green-operator-exact/v1\n"
)
PACKING_PROPOSAL_SHA256: Final[str] = (
    "11eeb471d1b1e966b47b292b7b1ea63ef0d2c0a807e6b4dd23971260897898c5"
)
PACKING_PROPOSAL_SIZE_BYTES: Final[int] = 27_039


class CoreGreenOperatorError(RuntimeError):
    """Typed fail-closed exact-operator error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> None:
    raise CoreGreenOperatorError(code, detail)


def _exact_fraction(value: object) -> Fraction:
    if type(value) is int:
        return Fraction(value)
    if type(value) is Fraction:
        return value
    _fail("coefficient_type_invalid")


def _validate_coefficients(values: object) -> tuple[Fraction, ...]:
    if type(values) is not tuple:
        _fail("coefficient_tuple_required")
    if not 1 <= len(values) <= MAXIMUM_INPUT_DEGREE + 1:
        _fail("coefficient_count_invalid")
    return tuple(_exact_fraction(value) for value in values)


def _shifted_chebyshev_power_column(degree: int) -> tuple[Fraction, ...]:
    if type(degree) is not int or not 0 <= degree <= MAXIMUM_INPUT_DEGREE:
        _fail("basis_degree_invalid")
    if degree == 0:
        return (Fraction(1),)
    return tuple(
        Fraction(
            (-1 if (degree - power) & 1 else 1)
            * (1 << (2 * power))
            * degree
            * math.comb(degree + power, 2 * power),
            degree + power,
        )
        for power in range(degree + 1)
    )


def _power_product(
    left: tuple[Fraction, ...], right: tuple[Fraction, ...]
) -> tuple[Fraction, ...]:
    result = [Fraction(0) for _ in range(len(left) + len(right) - 1)]
    for left_power, left_value in enumerate(left):
        for right_power, right_value in enumerate(right):
            result[left_power + right_power] += left_value * right_value
    return tuple(result)


def _power_subtract(
    left: tuple[Fraction, ...], right: tuple[Fraction, ...]
) -> tuple[Fraction, ...]:
    length = max(len(left), len(right))
    return tuple(
        (left[power] if power < len(left) else Fraction(0))
        - (right[power] if power < len(right) else Fraction(0))
        for power in range(length)
    )


def _chebyshev_product(
    left: tuple[Fraction, ...], right: tuple[Fraction, ...]
) -> tuple[Fraction, ...]:
    result = [Fraction(0) for _ in range(len(left) + len(right) - 1)]
    for left_mode, left_value in enumerate(left):
        for right_mode, right_value in enumerate(right):
            product = left_value * right_value
            if left_mode == 0:
                result[right_mode] += product
            elif right_mode == 0:
                result[left_mode] += product
            else:
                result[left_mode + right_mode] += product / 2
                result[abs(left_mode - right_mode)] += product / 2
    return tuple(result)


def _q_powers_shifted_chebyshev(maximum_power: int) -> tuple[tuple[Fraction, ...], ...]:
    if type(maximum_power) is not int or not 0 <= maximum_power <= MAXIMUM_INPUT_DEGREE:
        _fail("power_degree_invalid")
    powers: list[tuple[Fraction, ...]] = [(Fraction(1),)]
    q_polynomial = (Fraction(1, 2), Fraction(1, 2))
    for _ in range(maximum_power):
        powers.append(_chebyshev_product(powers[-1], q_polynomial))
    return tuple(powers)


def _to_power_basis(values: tuple[Fraction, ...]) -> tuple[Fraction, ...]:
    result = [Fraction(0) for _ in values]
    for mode, coefficient in enumerate(values):
        for power, basis_coefficient in enumerate(
            _shifted_chebyshev_power_column(mode)
        ):
            result[power] += coefficient * basis_coefficient
    return tuple(result)


def _green_multiplier(operator_p: int, power: int) -> Fraction:
    if type(operator_p) is not int or operator_p not in (1, 2):
        _fail("green_operator_p_invalid")
    if type(power) is not int or not 0 <= power <= MAXIMUM_INPUT_DEGREE:
        _fail("green_power_invalid")
    if operator_p == 1:
        return Fraction(1024, (power + 1) ** 2)
    return Fraction(2048, (power + 1) * (2 * power + 3))


def _from_power_basis(values: tuple[Fraction, ...]) -> tuple[Fraction, ...]:
    powers = _q_powers_shifted_chebyshev(len(values) - 1)
    result = [Fraction(0) for _ in values]
    for power, coefficient in enumerate(values):
        for mode, basis_coefficient in enumerate(powers[power]):
            result[mode] += coefficient * basis_coefficient
    return tuple(result)


def _encode_fraction(value: Fraction) -> str:
    return f"{value.numerator}/{value.denominator}"


def _wire_sha256(operator_p: int, values: tuple[Fraction, ...]) -> str:
    payload = json.dumps(
        {
            "coefficients": [_encode_fraction(value) for value in values],
            "operatorP": operator_p,
            "version": "nhm2_spherical_boson_star_v2_core_green_operator_exact/v1",
        },
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")
    return hashlib.sha256(
        WIRE_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()


@dataclass(frozen=True, slots=True)
class _CoreGreenOperatorReceipt:
    operator_p: int
    input_degree: int
    input_coefficients: tuple[Fraction, ...]
    power_coefficients_before_multiplier: tuple[Fraction, ...]
    power_coefficients_after_multiplier: tuple[Fraction, ...]
    output_coefficients: tuple[Fraction, ...]
    input_sha256: str
    output_sha256: str
    exact_arithmetic: bool
    finite_core_green_operator_implemented: bool
    independent_mpfr_replay_complete: bool
    tail_join_implemented: bool
    point_solver_implemented: bool
    proof_execution_authorized: bool
    candidate_executed: bool
    branch_accepted: bool
    theory_graph_authority: bool
    physical_authority: bool
    propulsion_authority: bool
    transport_authority: bool
    blockers: tuple[str, ...]

    def __post_init__(self) -> None:
        if (
            self.exact_arithmetic is not True
            or self.finite_core_green_operator_implemented is not True
        ):
            _fail("receipt_exact_operator_fact_invalid")
        false_fields = (
            "independent_mpfr_replay_complete",
            "tail_join_implemented",
            "point_solver_implemented",
            "proof_execution_authorized",
            "candidate_executed",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        if any(getattr(self, field) is not False for field in false_fields):
            _fail("receipt_authority_promotion_forbidden")


def apply_core_green_operator_exact(
    operator_p: object, coefficients: object
) -> _CoreGreenOperatorReceipt:
    """Apply the frozen exact finite J_p/q map to shifted-Chebyshev data."""

    if type(operator_p) is not int or operator_p not in (1, 2):
        _fail("green_operator_p_invalid")
    source = _validate_coefficients(coefficients)
    power_before = _to_power_basis(source)
    power_after = tuple(
        coefficient * _green_multiplier(operator_p, power)
        for power, coefficient in enumerate(power_before)
    )
    output = _from_power_basis(power_after)
    return _CoreGreenOperatorReceipt(
        operator_p=operator_p,
        input_degree=len(source) - 1,
        input_coefficients=source,
        power_coefficients_before_multiplier=power_before,
        power_coefficients_after_multiplier=power_after,
        output_coefficients=output,
        input_sha256=_wire_sha256(operator_p, source),
        output_sha256=_wire_sha256(operator_p, output),
        exact_arithmetic=True,
        finite_core_green_operator_implemented=True,
        independent_mpfr_replay_complete=False,
        tail_join_implemented=False,
        point_solver_implemented=False,
        proof_execution_authorized=False,
        candidate_executed=False,
        branch_accepted=False,
        theory_graph_authority=False,
        physical_authority=False,
        propulsion_authority=False,
        transport_authority=False,
        blockers=(
            "directed_mpfr_core_green_replay_not_implemented",
            "tail_join_map_not_instantiated",
            "finite_point_newton_solver_not_implemented",
            "proof_runtime_and_preseal_absent",
        ),
    )
