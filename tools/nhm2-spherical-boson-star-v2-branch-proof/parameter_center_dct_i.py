"""Calculation-only directed DCT-I for G2-D parameter centers.

Program gate: G2 — classical branch proof and terminal state
Workstream: exact proof-definition implementation
Capability or component: 33-node algebraic-cosine DCT-I calculation
Current maturity: authority-neutral calculation kernel; no point-solve issuer
Target maturity: audited transform used by an authenticated serial cell producer
Required frozen inputs: the final branch policy, DCT-I definition, and sealed
    tail-source assembler input v1
Required evidence: algebraic cosine enclosure, exact normalization and order,
    canonical coefficients, runtime binding, residual proof, and persistence
Stop/fail criteria: definition drift, invalid node shape/order, MPFR flag,
    cosine identity failure, nonfinite interval, or authority promotion
Explicit non-goals: point solves, residual inference, sealed tail-input output,
    proof execution, candidate admission, lamp, or physical authority
Downstream gate unlocked: authenticated 1,024-cell parameter-center producer

Only a zero-argument blocked observation is public.  The private marker-gated
seam exists solely for deterministic focused tests.  It cannot admit physical
node observations or emit a valid tail-source assembler input.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from fractions import Fraction
from typing import Callable, Final, Iterator, NoReturn

import gmpy2


__all__ = [
    "ParameterCenterDctIError",
    "observe_parameter_center_dct_i",
]


PARAMETER_DEGREE: Final[int] = 32
NODE_COUNT: Final[int] = 33
CELL_COUNT: Final[int] = 1024
COORDINATE_ORDER: Final[tuple[str, ...]] = ("nu", "m", "c")
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

DCT_DEFINITION_SHA256: Final[str] = (
    "815042f1dc64dee69c0a76507239a81466e0f81aa68130c54703909369c6d21b"
)
DCT_DEFINITION_SIZE_BYTES: Final[int] = 8_119
PACKING_PROPOSAL_SHA256: Final[str] = (
    "11eeb471d1b1e966b47b292b7b1ea63ef0d2c0a807e6b4dd23971260897898c5"
)
PACKING_PROPOSAL_SIZE_BYTES: Final[int] = 27_039
TAIL_INPUT_SOURCE_SHA256: Final[str] = (
    "823f6f845a12fa98bda3baed1d7c6aee5ced6a51a7d5527308b350ff5eb2ee33"
)
TAIL_INPUT_SOURCE_SIZE_BYTES: Final[int] = 24_176
TAIL_INPUT_SEMANTIC_SHA256: Final[str] = (
    "c90de09dacfb6ed7507dcc1a56f19b28a7bc4dcac4996c9da7066a47e178f9e7"
)
TAIL_INPUT_CANONICAL_SIZE_BYTES: Final[int] = 10_136

_TEST_MARKER: Final = object()


class ParameterCenterDctIError(RuntimeError):
    """Typed fail-closed calculation error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise ParameterCenterDctIError(code, detail)


def _context_template(rounding: int) -> gmpy2.context:
    context = gmpy2.get_context().copy()
    context.precision = MPFR_PRECISION_BITS
    context.round = rounding
    context.emin = MPFR_EMIN
    context.emax = MPFR_EMAX
    context.subnormalize = False
    context.trap_underflow = False
    context.trap_overflow = False
    context.trap_inexact = False
    context.trap_invalid = False
    context.trap_erange = False
    context.trap_divzero = False
    context.allow_complex = False
    context.rational_division = False
    context.allow_release_gil = False
    context.clear_flags()
    return context


@contextmanager
def _rounded(rounding: int, operation: str) -> Iterator[gmpy2.context]:
    with gmpy2.context(_context_template(rounding)):
        context = gmpy2.get_context()
        context.clear_flags()
        yield context
        forbidden = tuple(
            name
            for name in ("invalid", "divzero", "overflow", "underflow", "erange")
            if bool(getattr(context, name))
        )
        if forbidden:
            _fail("mpfr_forbidden_flag", operation + ":" + ",".join(forbidden))


def _directed(
    rounding: int, operation: str, function: Callable[[], object]
) -> gmpy2.mpfr:
    with _rounded(rounding, operation):
        value = gmpy2.mpfr(function())
    if not gmpy2.is_finite(value):
        _fail("mpfr_endpoint_invalid", operation)
    return gmpy2.mpfr(0) if gmpy2.is_zero(value) else value


def _mpq(value: Fraction | int) -> gmpy2.mpq:
    rational = value if type(value) is Fraction else Fraction(value)
    return gmpy2.mpq(rational.numerator, rational.denominator)


def _encode(value: gmpy2.mpfr, direction: str) -> str:
    numerator, denominator = value.as_integer_ratio()
    numerator = int(numerator)
    denominator = int(denominator)
    if numerator == 0:
        return f"0:0:0:256:{direction}"
    sign = -1 if numerator < 0 else 1
    mantissa = abs(numerator)
    exponent = -(denominator.bit_length() - 1)
    while mantissa & 1 == 0:
        mantissa >>= 1
        exponent += 1
    return f"{sign}:{mantissa:x}:{exponent}:256:{direction}"


@dataclass(frozen=True, slots=True)
class _Interval:
    lower: gmpy2.mpfr
    upper: gmpy2.mpfr

    def __post_init__(self) -> None:
        if gmpy2.is_zero(self.lower):
            object.__setattr__(self, "lower", gmpy2.mpfr(0))
        if gmpy2.is_zero(self.upper):
            object.__setattr__(self, "upper", gmpy2.mpfr(0))
        if (
            not gmpy2.is_finite(self.lower)
            or not gmpy2.is_finite(self.upper)
            or self.lower > self.upper
        ):
            _fail("interval_invalid")

    @staticmethod
    def exact(value: Fraction | int) -> _Interval:
        if type(value) not in (int, Fraction):
            _fail("exact_scalar_type_invalid")
        rational = _mpq(value)
        return _Interval(
            _directed(gmpy2.RoundDown, "set_exact.L", lambda: rational),
            _directed(gmpy2.RoundUp, "set_exact.U", lambda: rational),
        )

    def encoded(self) -> tuple[str, str]:
        return (_encode(self.lower, "L"), _encode(self.upper, "U"))

    def contains(self, value: Fraction | int) -> bool:
        exact = _mpq(value)
        return self.lower <= exact <= self.upper


_ZERO: Final = _Interval.exact(0)
_ONE: Final = _Interval.exact(1)
_TWO: Final = _Interval.exact(2)
_ONE_SIXTEENTH: Final = _Interval.exact(Fraction(1, 16))


def _i_add(left: _Interval, right: _Interval) -> _Interval:
    return _Interval(
        _directed(gmpy2.RoundDown, "add.L", lambda: left.lower + right.lower),
        _directed(gmpy2.RoundUp, "add.U", lambda: left.upper + right.upper),
    )


def _i_neg(value: _Interval) -> _Interval:
    return _Interval(
        _directed(gmpy2.RoundDown, "neg.L", lambda: -value.upper),
        _directed(gmpy2.RoundUp, "neg.U", lambda: -value.lower),
    )


def _i_sub(left: _Interval, right: _Interval) -> _Interval:
    return _i_add(left, _i_neg(right))


def _i_mul(left: _Interval, right: _Interval) -> _Interval:
    lower = tuple(
        _directed(gmpy2.RoundDown, "mul.L", lambda a=a, b=b: a * b)
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    upper = tuple(
        _directed(gmpy2.RoundUp, "mul.U", lambda a=a, b=b: a * b)
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    return _Interval(min(lower), max(upper))


def _i_divide_by_two(value: _Interval) -> _Interval:
    return _Interval(
        _directed(gmpy2.RoundDown, "div_two.L", lambda: value.lower / 2),
        _directed(gmpy2.RoundUp, "div_two.U", lambda: value.upper / 2),
    )


def _i_sqrt(value: _Interval) -> _Interval:
    if value.lower < 0:
        _fail("sqrt_domain_invalid")
    return _Interval(
        _directed(gmpy2.RoundDown, "sqrt.L", lambda: gmpy2.sqrt(value.lower)),
        _directed(gmpy2.RoundUp, "sqrt.U", lambda: gmpy2.sqrt(value.upper)),
    )


def _cosine_table() -> tuple[_Interval, ...]:
    half_angle = _ZERO
    for _ in range(4):
        half_angle = _i_sqrt(_i_divide_by_two(_i_add(_ONE, half_angle)))
    values = [_ONE, half_angle]
    for _ in range(1, PARAMETER_DEGREE):
        values.append(_i_sub(_i_mul(_i_mul(_TWO, values[1]), values[-1]), values[-2]))
    result = tuple(values)
    if len(result) != NODE_COUNT:
        _fail("cosine_table_length_invalid")
    if not result[0].contains(1) or not result[16].contains(0) or not result[32].contains(-1):
        _fail("cosine_identity_not_enclosed")
    return result


def _cosine_entry(table: tuple[_Interval, ...], j: int, k: int) -> _Interval:
    if type(j) is not int or type(k) is not int or not 0 <= j <= 32 or not 0 <= k <= 32:
        _fail("cosine_ordinal_invalid")
    harmonic = (j * k) % 64
    return table[harmonic if harmonic <= 32 else 64 - harmonic]


def _coerce_private_interval(value: object) -> _Interval:
    if type(value) in (int, Fraction):
        return _Interval.exact(value)
    if type(value) is not tuple or len(value) != 2:
        _fail("synthetic_node_interval_shape_invalid")
    lower, upper = value
    if type(lower) not in (int, Fraction) or type(upper) not in (int, Fraction):
        _fail("synthetic_node_interval_scalar_invalid")
    lower_interval = _Interval.exact(lower)
    upper_interval = _Interval.exact(upper)
    return _Interval(lower_interval.lower, upper_interval.upper)


def _validate_synthetic_nodes(values: object) -> tuple[tuple[_Interval, ...], ...]:
    if type(values) is not tuple or len(values) != len(COORDINATE_ORDER):
        _fail("synthetic_coordinate_shape_invalid")
    coordinates: list[tuple[_Interval, ...]] = []
    for coordinate in values:
        if type(coordinate) is not tuple or len(coordinate) != NODE_COUNT:
            _fail("synthetic_node_count_invalid")
        coordinates.append(tuple(_coerce_private_interval(value) for value in coordinate))
    return tuple(coordinates)


def _dct_i_coordinate(
    mathematical_nodes: tuple[_Interval, ...], table: tuple[_Interval, ...]
) -> tuple[_Interval, ...]:
    if len(mathematical_nodes) != NODE_COUNT:
        _fail("dct_node_count_invalid")
    coefficients: list[_Interval] = []
    for k in range(NODE_COUNT):
        accumulator = _ZERO
        for j in range(NODE_COUNT):
            term = _i_mul(mathematical_nodes[j], _cosine_entry(table, j, k))
            if j in (0, PARAMETER_DEGREE):
                term = _i_divide_by_two(term)
            accumulator = _i_add(accumulator, term)
        coefficient = _i_mul(accumulator, _ONE_SIXTEENTH)
        if k in (0, PARAMETER_DEGREE):
            coefficient = _i_divide_by_two(coefficient)
        coefficients.append(coefficient)
    return tuple(coefficients)


@dataclass(frozen=True, slots=True)
class _CalculationReceipt:
    cell_ordinal: int
    physical_to_mathematical_node_order: tuple[int, ...]
    cosine_table: tuple[tuple[str, str], ...]
    coordinate_order: tuple[str, ...]
    coefficients: tuple[tuple[tuple[str, str], ...], ...]
    runtime_versions: tuple[str, str]
    dct_definition_sha256: str
    tail_input_semantic_sha256: str
    point_solve_observations_authenticated: bool
    residual_proof_admitted: bool
    sealed_tail_input_emitted: bool
    producer_runtime_authenticated: bool
    proof_execution_authorized: bool
    candidate_executed: bool
    branch_accepted: bool
    theory_graph_authority: bool
    physical_authority: bool
    propulsion_authority: bool
    transport_authority: bool
    blockers: tuple[str, ...]

    def __post_init__(self) -> None:
        false_fields = (
            "point_solve_observations_authenticated",
            "residual_proof_admitted",
            "sealed_tail_input_emitted",
            "producer_runtime_authenticated",
            "proof_execution_authorized",
            "candidate_executed",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        if any(getattr(self, name) is not False for name in false_fields):
            _fail("calculation_receipt_authority_promotion_forbidden")
        if self.coordinate_order != COORDINATE_ORDER:
            _fail("calculation_receipt_coordinate_order_invalid")
        if self.physical_to_mathematical_node_order != tuple(range(32, -1, -1)):
            _fail("calculation_receipt_node_order_invalid")


def _test_only_calculate_parameter_center_dct_i(
    cell_ordinal: object,
    physical_order_values: object,
    marker: object,
) -> _CalculationReceipt:
    if marker is not _TEST_MARKER:
        _fail("test_marker_invalid")
    if type(cell_ordinal) is not int or not 0 <= cell_ordinal < CELL_COUNT:
        _fail("cell_ordinal_invalid")
    physical = _validate_synthetic_nodes(physical_order_values)
    mathematical = tuple(tuple(reversed(coordinate)) for coordinate in physical)
    table = _cosine_table()
    coefficients = tuple(_dct_i_coordinate(nodes, table) for nodes in mathematical)
    return _CalculationReceipt(
        cell_ordinal=cell_ordinal,
        physical_to_mathematical_node_order=tuple(range(32, -1, -1)),
        cosine_table=tuple(value.encoded() for value in table),
        coordinate_order=COORDINATE_ORDER,
        coefficients=tuple(
            tuple(coefficient.encoded() for coefficient in coordinate)
            for coordinate in coefficients
        ),
        runtime_versions=(gmpy2.version(), gmpy2.mpfr_version()),
        dct_definition_sha256=DCT_DEFINITION_SHA256,
        tail_input_semantic_sha256=TAIL_INPUT_SEMANTIC_SHA256,
        point_solve_observations_authenticated=False,
        residual_proof_admitted=False,
        sealed_tail_input_emitted=False,
        producer_runtime_authenticated=False,
        proof_execution_authorized=False,
        candidate_executed=False,
        branch_accepted=False,
        theory_graph_authority=False,
        physical_authority=False,
        propulsion_authority=False,
        transport_authority=False,
        blockers=(
            "authenticated_33_point_solve_observations_absent",
            "uniform_degree_32_residual_proof_absent",
            "parameter_center_producer_runtime_not_authenticated",
            "exclusive_persistence_issuer_not_implemented",
        ),
    )


def observe_parameter_center_dct_i() -> NoReturn:
    """Fail closed until the physical producer prerequisites exist."""

    _fail("parameter_center_point_solve_and_residual_evidence_absent")
