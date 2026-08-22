"""Canonical exact endpoint algebra for the G2-D Volterra tail.

Program gate: G2 — classical branch proof and terminal state
Workstream: exact proof-definition implementation
Capability or component: descaled Laurent recurrence and z^10 cancellation
Current maturity: calculation-only generator; unsealed and unaudited
Target maturity: frozen canonical coefficient wire consumed by native assembly
Required frozen inputs: endpoint-algebra audit and source-envelope calculus
Required evidence: exact compatibility, diagonals, zero orders, quotient hashes
Stop/fail criteria: noncanonical term, illegal division, or nonzero order < 10
Explicit non-goals: proof/candidate execution, runtime issuer, radii, or lamps
Downstream gate unlocked: native endpoint quotient and radial-cover assembly
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
from typing import Final, NoReturn


__all__ = [
    "TailEndpointSparseAlgebraError",
    "observe_tail_endpoint_sparse_algebra",
]

RAW_ORDER: Final[int] = 26
QUOTIENT_ORDER: Final[int] = 16
SCALAR_ORDER: Final[int] = 8
_TEST_MARKER: Final[object] = object()
SCALAR_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-scalar-jet/v1\n"
)
RAW_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-raw-source/v1\n"
)
QUOTIENT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-quotient/v1\n"
)


class TailEndpointSparseAlgebraError(RuntimeError):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def _fail(code: str) -> NoReturn:
    raise TailEndpointSparseAlgebraError(code)


Monomial = tuple[int, int, int]
Term = tuple[Monomial, Fraction]


@dataclass(frozen=True, slots=True)
class _Poly:
    """A canonical element of Q[s,m,k,k^-1]."""

    terms: tuple[Term, ...] = ()

    def __post_init__(self) -> None:
        previous: Monomial | None = None
        for monomial, coefficient in self.terms:
            if (
                type(monomial) is not tuple
                or len(monomial) != 3
                or any(type(item) is not int for item in monomial)
                or monomial[0] < 0
                or monomial[1] < 0
                or type(coefficient) is not Fraction
                or coefficient == 0
                or (previous is not None and monomial <= previous)
            ):
                _fail("laurent_polynomial_not_canonical")
            previous = monomial

    @classmethod
    def from_dict(cls, source: dict[Monomial, Fraction]) -> _Poly:
        normalized = tuple(
            sorted(
                (
                    (monomial, coefficient)
                    for monomial, coefficient in source.items()
                    if coefficient != 0
                ),
                key=lambda item: item[0],
            )
        )
        return cls(normalized)

    @classmethod
    def rational(cls, value: int | Fraction) -> _Poly:
        fraction = value if type(value) is Fraction else Fraction(value)
        return cls() if fraction == 0 else cls((((0, 0, 0), fraction),))

    @classmethod
    def monomial(
        cls, coefficient: int | Fraction, s: int, m: int, k: int
    ) -> _Poly:
        fraction = (
            coefficient if type(coefficient) is Fraction else Fraction(coefficient)
        )
        if s < 0 or m < 0:
            _fail("negative_nonlocalized_exponent")
        return cls() if fraction == 0 else cls((((s, m, k), fraction),))

    def as_dict(self) -> dict[Monomial, Fraction]:
        return dict(self.terms)

    def __add__(self, other: _Poly) -> _Poly:
        values = self.as_dict()
        for monomial, coefficient in other.terms:
            values[monomial] = values.get(monomial, Fraction()) + coefficient
        return _Poly.from_dict(values)

    def __neg__(self) -> _Poly:
        return _Poly(tuple((monomial, -value) for monomial, value in self.terms))

    def __sub__(self, other: _Poly) -> _Poly:
        return self + (-other)

    def __mul__(self, other: _Poly) -> _Poly:
        values: dict[Monomial, Fraction] = {}
        for (s_left, m_left, k_left), left in self.terms:
            for (s_right, m_right, k_right), right in other.terms:
                monomial = (
                    s_left + s_right,
                    m_left + m_right,
                    k_left + k_right,
                )
                values[monomial] = values.get(monomial, Fraction()) + left * right
        return _Poly.from_dict(values)

    def scale(self, value: int | Fraction) -> _Poly:
        fraction = value if type(value) is Fraction else Fraction(value)
        return _Poly.from_dict(
            {monomial: coefficient * fraction for monomial, coefficient in self.terms}
        )

    def power(self, exponent: int) -> _Poly:
        if type(exponent) is not int or exponent < 0:
            _fail("polynomial_power_invalid")
        result = ONE
        factor = self
        remaining = exponent
        while remaining:
            if remaining & 1:
                result = result * factor
            remaining >>= 1
            if remaining:
                factor = factor * factor
        return result

    def shift(self, s: int = 0, m: int = 0, k: int = 0) -> _Poly:
        output: dict[Monomial, Fraction] = {}
        for (s_exp, m_exp, k_exp), coefficient in self.terms:
            shifted = (s_exp + s, m_exp + m, k_exp + k)
            if shifted[0] < 0 or shifted[1] < 0:
                _fail("nonexact_laurent_division")
            output[shifted] = coefficient
        return _Poly.from_dict(output)

    def wire(self) -> list[list[int | str]]:
        return [
            [
                s_exp,
                m_exp,
                k_exp,
                str(coefficient.numerator),
                str(coefficient.denominator),
            ]
            for (s_exp, m_exp, k_exp), coefficient in self.terms
        ]


ZERO: Final[_Poly] = _Poly()
ONE: Final[_Poly] = _Poly.rational(1)
S_ATOM: Final[_Poly] = _Poly.monomial(1, 1, 0, 0)
M_ATOM: Final[_Poly] = _Poly.monomial(1, 0, 1, 0)
K_ATOM: Final[_Poly] = _Poly.monomial(1, 0, 0, 1)

Series = tuple[_Poly, ...]


def _zeros(order: int) -> list[_Poly]:
    return [ZERO for _ in range(order + 1)]


def _coefficient(series: Series | list[_Poly], ordinal: int) -> _Poly:
    return series[ordinal] if 0 <= ordinal < len(series) else ZERO


def _series_add(left: Series, right: Series, order: int) -> Series:
    return tuple(
        _coefficient(left, i) + _coefficient(right, i)
        for i in range(order + 1)
    )


def _series_sub(left: Series, right: Series, order: int) -> Series:
    return tuple(
        _coefficient(left, i) - _coefficient(right, i)
        for i in range(order + 1)
    )


def _series_scale(value: Series, scalar: _Poly, order: int) -> Series:
    return tuple(_coefficient(value, i) * scalar for i in range(order + 1))


def _series_mul(left: Series, right: Series, order: int) -> Series:
    output = _zeros(order)
    for total in range(order + 1):
        accumulated = ZERO
        for left_ordinal in range(total + 1):
            accumulated = accumulated + (
                _coefficient(left, left_ordinal)
                * _coefficient(right, total - left_ordinal)
            )
        output[total] = accumulated
    return tuple(output)


def _series_derivative(value: Series, order: int) -> Series:
    return tuple(
        _coefficient(value, ordinal + 1).scale(ordinal + 1)
        for ordinal in range(order + 1)
    )


def _series_shift_z(value: Series, amount: int, order: int) -> Series:
    if amount < 0:
        _fail("negative_z_shift")
    return tuple(
        _coefficient(value, ordinal - amount) if ordinal >= amount else ZERO
        for ordinal in range(order + 1)
    )


def _series_exp_zero_constant(value: Series, order: int) -> Series:
    if _coefficient(value, 0) != ZERO:
        _fail("formal_exp_constant_not_zero")
    output = _zeros(order)
    output[0] = ONE
    for ordinal in range(1, order + 1):
        accumulated = ZERO
        for source in range(1, ordinal + 1):
            accumulated = accumulated + (
                _coefficient(value, source)
                * output[ordinal - source]
            ).scale(source)
        output[ordinal] = accumulated.scale(Fraction(1, ordinal))
    return tuple(output)


def _series_divide_s_exact(value: Series, order: int) -> Series:
    return tuple(_coefficient(value, i).shift(s=-1) for i in range(order + 1))


def _metric_series(order: int) -> tuple[Series, Series, _Poly, _Poly]:
    q = S_ATOM * M_ATOM * K_ATOM
    q = q.scale(Fraction(1, 2))
    v0 = _zeros(order)
    v1 = _zeros(order)
    for ordinal in range(1, order + 1):
        q_power = q.power(ordinal)
        if ordinal % 2 == 1:
            v0[ordinal] = q_power.scale(Fraction(-2, ordinal)).shift(s=-1)
        v1[ordinal] = q_power.scale(
            Fraction(2 * ((-1) ** (ordinal + 1)), ordinal)
        ).shift(s=-1)
    sigma = M_ATOM.shift(k=-1) - (S_ATOM * M_ATOM * K_ATOM).scale(2) - ONE
    return tuple(v0), tuple(v1), q, sigma


def _l_sigma(value: Series, sigma: _Poly, order: int) -> Series:
    derivative = _series_derivative(value, order)
    return _series_add(
        _series_scale(value, _Poly.rational(-1), order),
        _series_sub(
            _series_scale(_series_shift_z(value, 1, order), sigma, order),
            _series_shift_z(derivative, 2, order),
            order,
        ),
        order,
    )


def _q0_series(s_times_v0: Series, order: int) -> Series:
    argument = _series_scale(s_times_v0, _Poly.rational(-2), order)
    exponential = list(_series_exp_zero_constant(argument, order))
    exponential[0] = exponential[0] - ONE
    return _series_divide_s_exact(tuple(exponential), order)


def _descaled_kg(
    scalar: Series, v0: Series, v1: Series, sigma: _Poly, order: int
) -> Series:
    s_v0 = _series_scale(v0, S_ATOM, order)
    s_v1 = _series_scale(v1, S_ATOM, order)
    exp_minus_2_s_v1 = _series_exp_zero_constant(
        _series_scale(s_v1, _Poly.rational(-2), order), order
    )
    exp_minus_2_s_v0 = _series_exp_zero_constant(
        _series_scale(s_v0, _Poly.rational(-2), order), order
    )
    l1 = _l_sigma(scalar, sigma, order)
    l2 = _l_sigma(l1, sigma, order)
    metric_derivative = _series_add(
        _series_derivative(v0, order), _series_derivative(v1, order), order
    )
    transport = _series_sub(
        _series_shift_z((ONE,) + (ZERO,) * order, 1, order),
        _series_scale(_series_shift_z(metric_derivative, 2, order), S_ATOM, order),
        order,
    )
    transport = _series_add(
        transport,
        _series_shift_z((ONE,) + (ZERO,) * order, 1, order),
        order,
    )
    bracket = _series_add(l2, _series_mul(transport, l1, order), order)
    k_squared = K_ATOM.power(2)
    first = _series_scale(
        _series_mul(exp_minus_2_s_v1, bracket, order), k_squared, order
    )
    potential = _series_sub(
        _q0_series(s_v0, order),
        _series_scale(exp_minus_2_s_v0, k_squared, order),
        order,
    )
    return _series_add(first, _series_mul(potential, scalar, order), order)


def _derive_scalar_jet(v0: Series, v1: Series, sigma: _Poly) -> Series:
    scalar = _zeros(SCALAR_ORDER)
    scalar[0] = ONE
    compatibility = _descaled_kg(tuple(scalar), v0, v1, sigma, 1)
    if compatibility[0] != ZERO or compatibility[1] != ZERO:
        _fail("descaled_kg_compatibility_nonzero")
    for n in range(1, SCALAR_ORDER + 1):
        order = n + 1
        scalar[n] = ZERO
        row_zero = _coefficient(
            _descaled_kg(tuple(scalar), v0, v1, sigma, order), order
        )
        scalar[n] = ONE
        row_one = _coefficient(
            _descaled_kg(tuple(scalar), v0, v1, sigma, order), order
        )
        diagonal = row_one - row_zero
        expected = K_ATOM.power(2).scale(2 * n)
        if diagonal != expected:
            _fail(f"descaled_scalar_diagonal_drift:{n}")
        scalar[n] = (-row_zero).shift(k=-2).scale(Fraction(1, 2 * n))
        after = _coefficient(
            _descaled_kg(tuple(scalar), v0, v1, sigma, order), order
        )
        if after != ZERO:
            _fail(f"descaled_scalar_elimination_failed:{n}")
    return tuple(scalar)


def _source_su(v0: Series, v1: Series, scalar: Series, sigma: _Poly) -> Series:
    order = RAW_ORDER
    h = _series_add(v0, v1, order)
    h_y = _series_scale(
        _series_shift_z(_series_derivative(h, order), 2, order),
        -K_ATOM,
        order,
    )
    f_y = _series_scale(
        _series_shift_z(_series_derivative(scalar, order), 2, order),
        -K_ATOM,
        order,
    )
    y_inverse = _series_shift_z((K_ATOM,) + (ZERO,) * order, 1, order)
    b = _series_add(
        (_Poly.monomial(-1, 0, 0, 1),) + (ZERO,) * order,
        _series_scale(y_inverse, sigma, order),
        order,
    )
    p_tilde = _series_add(
        _series_scale(y_inverse, sigma.scale(2) + _Poly.rational(2), order),
        _series_scale(h_y, S_ATOM, order),
        order,
    )
    a_scalar = _series_add(
        _series_scale(y_inverse, _Poly.rational(2), order),
        _series_scale(h_y, S_ATOM, order),
        order,
    )
    h_minus_v1 = v0
    e0 = _series_exp_zero_constant(
        _series_scale(h_minus_v1, S_ATOM.scale(-2), order), order
    )
    exp_2_s_v1 = _series_exp_zero_constant(
        _series_scale(v1, S_ATOM.scale(2), order), order
    )
    two_nu = K_ATOM.power(2).scale(-1)
    v_scalar = _series_mul(
        exp_2_s_v1,
        _series_add(
            _q0_series(_series_scale(v0, S_ATOM, order), order),
            _series_scale(e0, two_nu, order),
            order,
        ),
        order,
    )
    y_inverse_squared = _series_mul(y_inverse, y_inverse, order)
    q_tilde = _series_add(
        _series_scale(y_inverse_squared, -sigma, order),
        _series_add(
            _series_mul(b, b, order),
            _series_add(_series_mul(a_scalar, b, order), v_scalar, order),
            order,
        ),
        order,
    )
    f_yy = _series_scale(
        _series_add(
            _series_shift_z(
                _series_derivative(_series_derivative(scalar, order), order),
                4,
                order,
            ),
            _series_scale(
                _series_shift_z(_series_derivative(scalar, order), 3, order),
                _Poly.rational(2),
                order,
            ),
            order,
        ),
        K_ATOM.power(2),
        order,
    )
    return _series_sub(
        _series_sub(
            _series_scale(_series_mul(p_tilde, f_y, order), _Poly.rational(-1), order),
            _series_mul(q_tilde, scalar, order),
            order,
        ),
        _series_sub(f_yy, _series_scale(f_y, K_ATOM.scale(2), order), order),
        order,
    )


@dataclass(frozen=True, slots=True)
class _EndpointReceipt:
    scalar_coefficients: tuple[list[list[int | str]], ...]
    raw_coefficients: tuple[list[list[int | str]], ...]
    quotient_coefficients: tuple[list[list[int | str]], ...]
    scalar_wire_sha256: str
    raw_wire_sha256: str
    quotient_wire_sha256: str
    scalar_wire_plain_sha256: str
    raw_wire_plain_sha256: str
    quotient_wire_plain_sha256: str
    scalar_wire_size_bytes: int
    raw_wire_size_bytes: int
    quotient_wire_size_bytes: int
    compatibility_zero: bool = True
    scalar_diagonals_exact: bool = True
    orders_zero_through_nine_empty: bool = True
    graded_residual_order_before: int = 27
    graded_residual_order_after: int = 17
    calculation_only: bool = True
    independent_audit_clear: bool = False
    proof_authority: bool = False
    candidate_executed: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


def _canonical_bytes(value: object) -> bytes:
    return json.dumps(
        value, ensure_ascii=True, separators=(",", ":"), sort_keys=True
    ).encode("ascii")


def _seal(domain: bytes, wire: bytes) -> str:
    return hashlib.sha256(
        domain + len(wire).to_bytes(8, "little", signed=False) + wire
    ).hexdigest()


def _test_only_generate(marker: object) -> _EndpointReceipt:
    if marker is not _TEST_MARKER:
        _fail("private_test_marker_required")
    v0, v1, _, sigma = _metric_series(RAW_ORDER)
    scalar = _derive_scalar_jet(v0, v1, sigma)
    scalar_extended = scalar + (ZERO,) * (RAW_ORDER + 1 - len(scalar))
    raw = _source_su(v0, v1, scalar_extended, sigma)
    if any(raw[ordinal] != ZERO for ordinal in range(10)):
        first = next(ordinal for ordinal in range(10) if raw[ordinal] != ZERO)
        _fail(f"scalar_endpoint_cancellation_failed:{first}")
    quotient = raw[10 : RAW_ORDER + 1]
    if len(quotient) != QUOTIENT_ORDER + 1:
        _fail("scalar_endpoint_quotient_shape")
    scalar_wire = tuple(item.wire() for item in scalar)
    raw_wire = tuple(item.wire() for item in raw)
    quotient_wire = tuple(item.wire() for item in quotient)
    scalar_bytes = _canonical_bytes(scalar_wire)
    raw_bytes = _canonical_bytes(raw_wire)
    quotient_bytes = _canonical_bytes(quotient_wire)
    return _EndpointReceipt(
        scalar_coefficients=scalar_wire,
        raw_coefficients=raw_wire,
        quotient_coefficients=quotient_wire,
        scalar_wire_sha256=_seal(SCALAR_DOMAIN, scalar_bytes),
        raw_wire_sha256=_seal(RAW_DOMAIN, raw_bytes),
        quotient_wire_sha256=_seal(QUOTIENT_DOMAIN, quotient_bytes),
        scalar_wire_plain_sha256=hashlib.sha256(scalar_bytes).hexdigest(),
        raw_wire_plain_sha256=hashlib.sha256(raw_bytes).hexdigest(),
        quotient_wire_plain_sha256=hashlib.sha256(quotient_bytes).hexdigest(),
        scalar_wire_size_bytes=len(scalar_bytes),
        raw_wire_size_bytes=len(raw_bytes),
        quotient_wire_size_bytes=len(quotient_bytes),
    )


def observe_tail_endpoint_sparse_algebra() -> NoReturn:
    """Fail closed until the successor and independent audit are installed."""

    _fail("tail_endpoint_algebra_successor_not_sealed_or_independently_audited")
