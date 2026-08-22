"""Directed MPFR256 algebra for the G2-D Volterra tail proof.

Program gate: G2 — classical branch proof and terminal state
Workstream: exact proof-definition implementation
Capability or component: directed interval/projected-model algebra and closed
    Volterra kernel constants
Current maturity: calculation-only partial assembler; no proof issuer
Target maturity: exact implementation of the audited tail source-envelope
    calculus with authenticated runtime and independent replay
Required frozen inputs: the G2-D Volterra and source-envelope preregistrations,
    chi=17/16, degree 32, analytic order 512, MPFR 4.2.2 at precision 256
Required evidence: outward primitive tests, exact convolution oracle, analytic
    remainder tests, source-DAG tests, runtime identity, and independent audit
Stop/fail criteria: runtime drift, forbidden MPFR flag, nonfinite endpoint,
    invalid interval, omitted overflow, failed analytic margin, or ledger drift
Explicit non-goals: proof/candidate execution, a global radius, terminal state,
    candidate admission, lamp, physical viability, propulsion, or transport
Downstream gate unlocked: cap/source-DAG implementation and independent audit

Only the typed blocked diagnostic is public.  The private marker-gated seam is
for deterministic algebra tests and carries no proof or execution authority.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from fractions import Fraction
import hashlib
import math
from pathlib import Path
import threading
from typing import Callable, Final, Iterator, NoReturn

import gmpy2


__all__ = [
    "TailVolterraBoundAssemblerError",
    "observe_tail_volterra_bound_assembler",
]


MPFR_PRECISION_BITS: Final[int] = 256
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
PARAMETER_DEGREE: Final[int] = 32
ANALYTIC_ORDER: Final[int] = 512
CHI: Final[Fraction] = Fraction(17, 16)

GMPY2_EXTENSION_SHA256: Final[str] = (
    "56f2bf12ffd4ca523f403bd2b6ce13069800cc2fc4332cf5de3537a34e8c76fb"
)
GMPY2_EXTENSION_SIZE_BYTES: Final[int] = 442_368
MPFR_DLL_SHA256: Final[str] = (
    "95b280f52d24a1fe1e024877ee325a629c3424e12961d27f84daec73d02c4bd8"
)
MPFR_DLL_SIZE_BYTES: Final[int] = 904_297
GMP_DLL_SHA256: Final[str] = (
    "829adcf025d22e641c6816b431fbe5b226a39b390c7205192d480151646fe9c9"
)
GMP_DLL_SIZE_BYTES: Final[int] = 1_083_865

_RUNTIME_LOCK: Final = threading.Lock()
_TEST_MARKER: Final = object()


class TailVolterraBoundAssemblerError(RuntimeError):
    """Typed fail-closed calculation or admission error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise TailVolterraBoundAssemblerError(code, detail)


def _sha256_file(path: Path, size: int, sha256: str, label: str) -> None:
    try:
        stat = path.stat()
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        after = path.stat()
    except OSError as error:
        raise TailVolterraBoundAssemblerError(
            f"{label}_unavailable", type(error).__name__
        ) from error
    identity = lambda value: (
        value.st_dev,
        value.st_ino,
        value.st_size,
        value.st_mtime_ns,
    )
    if identity(stat) != identity(after):
        _fail(f"{label}_changed_during_hash")
    if stat.st_size != size or digest != sha256:
        _fail(f"{label}_binding_mismatch")


def _verify_runtime() -> tuple[str, str, str]:
    if gmpy2.version() != "2.3.1" or gmpy2.mpfr_version() != "MPFR 4.2.2":
        _fail("mpfr_runtime_version_mismatch")
    extension = Path(gmpy2.gmpy2.__file__).resolve(strict=True)
    libraries = extension.parent.parent / "gmpy2.libs"
    mpfr = libraries / "libmpfr-6.dll"
    gmp = libraries / "libgmp-10.dll"
    _sha256_file(
        extension,
        GMPY2_EXTENSION_SIZE_BYTES,
        GMPY2_EXTENSION_SHA256,
        "gmpy2_extension",
    )
    _sha256_file(mpfr, MPFR_DLL_SIZE_BYTES, MPFR_DLL_SHA256, "mpfr_runtime")
    _sha256_file(gmp, GMP_DLL_SIZE_BYTES, GMP_DLL_SHA256, "gmp_runtime")
    return (str(extension), str(mpfr), str(gmp))


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
    rounding: int, operation: str, function: Callable[[], gmpy2.mpfr]
) -> gmpy2.mpfr:
    with _rounded(rounding, operation):
        value = gmpy2.mpfr(function())
    if not gmpy2.is_finite(value):
        _fail("mpfr_endpoint_invalid", operation)
    return gmpy2.mpfr(0) if gmpy2.is_zero(value) else value


def _mpq(value: Fraction | int) -> gmpy2.mpq:
    rational = value if isinstance(value, Fraction) else Fraction(value)
    return gmpy2.mpq(rational.numerator, rational.denominator)


def _fraction(value: gmpy2.mpfr) -> Fraction:
    numerator, denominator = value.as_integer_ratio()
    return Fraction(int(numerator), int(denominator))


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
        rational = _mpq(value)
        return _Interval(
            _directed(gmpy2.RoundDown, "set_exact.L", lambda: rational),
            _directed(gmpy2.RoundUp, "set_exact.U", lambda: rational),
        )

    def encoded(self) -> tuple[str, str]:
        return (_encode(self.lower, "L"), _encode(self.upper, "U"))


_ZERO: Final = _Interval.exact(0)
_ONE: Final = _Interval.exact(1)


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
    lower_candidates = tuple(
        _directed(gmpy2.RoundDown, "mul.L", lambda a=a, b=b: a * b)
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    upper_candidates = tuple(
        _directed(gmpy2.RoundUp, "mul.U", lambda a=a, b=b: a * b)
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    return _Interval(min(lower_candidates), max(upper_candidates))


def _i_scale(value: _Interval, scalar: Fraction | int) -> _Interval:
    return _i_mul(value, _Interval.exact(scalar))


def _i_reciprocal(value: _Interval) -> _Interval:
    if value.lower <= 0 <= value.upper:
        _fail("interval_reciprocal_zero_margin")
    return _Interval(
        _directed(gmpy2.RoundDown, "reciprocal.L", lambda: 1 / value.upper),
        _directed(gmpy2.RoundUp, "reciprocal.U", lambda: 1 / value.lower),
    )


def _i_div(left: _Interval, right: _Interval) -> _Interval:
    return _i_mul(left, _i_reciprocal(right))


def _i_exp(value: _Interval) -> _Interval:
    return _Interval(
        _directed(gmpy2.RoundDown, "exp.L", lambda: gmpy2.exp(value.lower)),
        _directed(gmpy2.RoundUp, "exp.U", lambda: gmpy2.exp(value.upper)),
    )


def _i_sqrt(value: _Interval) -> _Interval:
    if value.lower <= 0:
        _fail("interval_sqrt_positive_margin")
    return _Interval(
        _directed(gmpy2.RoundDown, "sqrt.L", lambda: gmpy2.sqrt(value.lower)),
        _directed(gmpy2.RoundUp, "sqrt.U", lambda: gmpy2.sqrt(value.upper)),
    )


def _i_abs_upper(value: _Interval) -> gmpy2.mpfr:
    return _directed(
        gmpy2.RoundUp,
        "abs_upper",
        lambda: max(abs(value.lower), abs(value.upper)),
    )


def _up_add(left: gmpy2.mpfr, right: gmpy2.mpfr) -> gmpy2.mpfr:
    return _directed(gmpy2.RoundUp, "bound_add", lambda: left + right)


def _up_mul(left: gmpy2.mpfr, right: gmpy2.mpfr) -> gmpy2.mpfr:
    return _directed(gmpy2.RoundUp, "bound_mul", lambda: left * right)


def _down_mul(left: gmpy2.mpfr, right: gmpy2.mpfr) -> gmpy2.mpfr:
    return _directed(gmpy2.RoundDown, "bound_mul_lower", lambda: left * right)


def _up_div(left: gmpy2.mpfr, right: gmpy2.mpfr) -> gmpy2.mpfr:
    if right <= 0:
        _fail("bound_divisor_nonpositive")
    return _directed(gmpy2.RoundUp, "bound_div", lambda: left / right)


@dataclass(frozen=True, slots=True)
class _Model32:
    coefficients: tuple[_Interval, ...]
    residual_norm: gmpy2.mpfr

    def __post_init__(self) -> None:
        if len(self.coefficients) != PARAMETER_DEGREE + 1:
            _fail("model_coefficient_count_invalid")
        if not gmpy2.is_finite(self.residual_norm) or self.residual_norm < 0:
            _fail("model_residual_invalid")

    @staticmethod
    def constant(value: Fraction | int) -> _Model32:
        return _Model32(
            (_Interval.exact(value),)
            + (_ZERO,) * PARAMETER_DEGREE,
            _ZERO.upper,
        )


def _m_add(left: _Model32, right: _Model32) -> _Model32:
    return _Model32(
        tuple(_i_add(a, b) for a, b in zip(left.coefficients, right.coefficients)),
        _up_add(left.residual_norm, right.residual_norm),
    )


def _m_neg(value: _Model32) -> _Model32:
    return _Model32(
        tuple(_i_neg(item) for item in value.coefficients), value.residual_norm
    )


def _m_sub(left: _Model32, right: _Model32) -> _Model32:
    return _m_add(left, _m_neg(right))


def _m_scale(value: _Model32, scalar: Fraction | int) -> _Model32:
    absolute = abs(_mpq(scalar))
    residual = _directed(
        gmpy2.RoundUp,
        "model_scale_residual",
        lambda: value.residual_norm * absolute,
    )
    return _Model32(
        tuple(_i_scale(item, scalar) for item in value.coefficients), residual
    )


def _m_poly_norm(value: _Model32) -> gmpy2.mpfr:
    total = _ZERO.upper
    weight = _ONE.upper
    chi_upper = _Interval.exact(CHI).upper
    for coefficient in value.coefficients:
        total = _up_add(total, _up_mul(_i_abs_upper(coefficient), weight))
        weight = _up_mul(weight, chi_upper)
    return total


def _m_norm(value: _Model32) -> gmpy2.mpfr:
    return _up_add(_m_poly_norm(value), value.residual_norm)


def _m_mul(left: _Model32, right: _Model32) -> _Model32:
    product = [_ZERO for _ in range(2 * PARAMETER_DEGREE + 1)]
    half = Fraction(1, 2)
    for left_ordinal, left_coefficient in enumerate(left.coefficients):
        for right_ordinal, right_coefficient in enumerate(right.coefficients):
            term = _i_scale(
                _i_mul(left_coefficient, right_coefficient), half
            )
            high = left_ordinal + right_ordinal
            low = abs(left_ordinal - right_ordinal)
            product[high] = _i_add(product[high], term)
            product[low] = _i_add(product[low], term)

    chi_upper = _Interval.exact(CHI).upper
    weight = _ONE.upper
    dropped = _ZERO.upper
    for ordinal, coefficient in enumerate(product):
        if ordinal > PARAMETER_DEGREE:
            dropped = _up_add(dropped, _up_mul(_i_abs_upper(coefficient), weight))
        weight = _up_mul(weight, chi_upper)

    left_norm = _m_poly_norm(left)
    right_norm = _m_poly_norm(right)
    residual = dropped
    residual = _up_add(residual, _up_mul(left_norm, right.residual_norm))
    residual = _up_add(residual, _up_mul(right_norm, left.residual_norm))
    residual = _up_add(
        residual, _up_mul(left.residual_norm, right.residual_norm)
    )
    return _Model32(tuple(product[: PARAMETER_DEGREE + 1]), residual)


def _m_scalar_center(value: _Model32) -> Fraction:
    lower = _fraction(value.coefficients[0].lower)
    upper = _fraction(value.coefficients[0].upper)
    return (lower + upper) / 2


def _m_with_residual(value: _Model32, extra: gmpy2.mpfr) -> _Model32:
    return _Model32(value.coefficients, _up_add(value.residual_norm, extra))


def _m_exp(value: _Model32) -> _Model32:
    center = _m_scalar_center(value)
    h = _m_sub(value, _Model32.constant(center))
    q = _m_norm(h)
    result = _Model32.constant(1)
    power = _Model32.constant(1)
    factorial = 1
    for ordinal in range(1, ANALYTIC_ORDER + 1):
        power = _m_mul(power, h)
        factorial *= ordinal
        result = _m_add(result, _m_scale(power, Fraction(1, factorial)))
    center_interval = _Interval.exact(center)
    result = _Model32(
        tuple(_i_mul(_i_exp(center_interval), item) for item in result.coefficients),
        _up_mul(_i_exp(center_interval).upper, result.residual_norm),
    )
    q_power = _directed(
        gmpy2.RoundUp,
        "exp_tail_power",
        lambda: q ** (ANALYTIC_ORDER + 1),
    )
    denominator = _Interval.exact(math.factorial(ANALYTIC_ORDER + 1)).lower
    envelope = _directed(
        gmpy2.RoundUp,
        "exp_tail_envelope",
        lambda: gmpy2.exp(center_interval.upper + q),
    )
    tail = _up_div(_up_mul(envelope, q_power), denominator)
    return _m_with_residual(result, tail)


def _m_geometric(
    value: _Model32, primitive: str, coefficients: Callable[[int], Fraction]
) -> tuple[_Model32, Fraction, gmpy2.mpfr]:
    center = _m_scalar_center(value)
    if center == 0:
        _fail(primitive + "_center_zero")
    h = _m_sub(value, _Model32.constant(center))
    u = _m_scale(h, Fraction(1, 1) / center)
    radius = _m_norm(u)
    if radius >= 1:
        _fail(primitive + "_neumann_margin")
    result = _Model32.constant(coefficients(0))
    power = _Model32.constant(1)
    for ordinal in range(1, ANALYTIC_ORDER + 1):
        power = _m_mul(power, u)
        result = _m_add(result, _m_scale(power, coefficients(ordinal)))
    return result, center, radius


def _m_reciprocal(value: _Model32) -> _Model32:
    series, center, radius = _m_geometric(
        value, "reciprocal", lambda ordinal: Fraction((-1) ** ordinal)
    )
    result = _m_scale(series, Fraction(1, 1) / center)
    radius_power = _directed(
        gmpy2.RoundUp,
        "reciprocal_tail_power",
        lambda: radius ** (ANALYTIC_ORDER + 1),
    )
    tail = _up_div(
        _up_div(radius_power, _Interval.exact(abs(center)).lower),
        _directed(gmpy2.RoundDown, "one_minus_radius", lambda: 1 - radius),
    )
    return _m_with_residual(result, tail)


def _m_log_positive(value: _Model32) -> _Model32:
    center = _m_scalar_center(value)
    if center <= 0:
        _fail("log_positive_center")
    series, _, radius = _m_geometric(
        value,
        "log_positive",
        lambda ordinal: (
            Fraction(0)
            if ordinal == 0
            else Fraction((-1) ** (ordinal + 1), ordinal)
        ),
    )
    center_log = _Interval(
        _directed(
            gmpy2.RoundDown,
            "log_center.L",
            lambda: gmpy2.log(_mpq(center)),
        ),
        _directed(
            gmpy2.RoundUp,
            "log_center.U",
            lambda: gmpy2.log(_mpq(center)),
        ),
    )
    coefficients = list(series.coefficients)
    coefficients[0] = _i_add(coefficients[0], center_log)
    result = _Model32(tuple(coefficients), series.residual_norm)
    radius_power = _directed(
        gmpy2.RoundUp,
        "log_tail_power",
        lambda: radius ** (ANALYTIC_ORDER + 1),
    )
    denominator = _down_mul(
        _Interval.exact(ANALYTIC_ORDER + 1).lower,
        _directed(gmpy2.RoundDown, "log_one_minus_radius", lambda: 1 - radius),
    )
    return _m_with_residual(result, _up_div(radius_power, denominator))


def _m_sqrt_positive(value: _Model32) -> _Model32:
    center = _m_scalar_center(value)
    if center <= 0:
        _fail("sqrt_positive_center")
    coefficients: list[Fraction] = [Fraction(1)]
    for ordinal in range(1, ANALYTIC_ORDER + 1):
        coefficients.append(
            coefficients[-1]
            * Fraction(3 - 2 * ordinal, 2 * ordinal)
        )
    series, _, radius = _m_geometric(
        value, "sqrt_positive", lambda ordinal: coefficients[ordinal]
    )
    center_sqrt = _i_sqrt(_Interval.exact(center))
    result = _Model32(
        tuple(_i_mul(center_sqrt, item) for item in series.coefficients),
        _up_mul(center_sqrt.upper, series.residual_norm),
    )
    radius_power = _directed(
        gmpy2.RoundUp,
        "sqrt_tail_power",
        lambda: radius ** (ANALYTIC_ORDER + 1),
    )
    tail = _up_div(
        _up_mul(center_sqrt.upper, radius_power),
        _directed(gmpy2.RoundDown, "sqrt_one_minus_radius", lambda: 1 - radius),
    )
    return _m_with_residual(result, tail)


def _m_phi1(value: _Model32) -> _Model32:
    result = _Model32.constant(1)
    power = _Model32.constant(1)
    factorial = 1
    for ordinal in range(1, ANALYTIC_ORDER + 1):
        power = _m_mul(power, value)
        factorial *= ordinal + 1
        result = _m_add(result, _m_scale(power, Fraction(1, factorial)))
    q = _m_norm(value)
    q_power = _directed(
        gmpy2.RoundUp,
        "phi1_tail_power",
        lambda: q ** (ANALYTIC_ORDER + 1),
    )
    denominator = _Interval.exact(math.factorial(ANALYTIC_ORDER + 2)).lower
    envelope = _directed(gmpy2.RoundUp, "phi1_tail_exp", lambda: gmpy2.exp(q))
    return _m_with_residual(
        result, _up_div(_up_mul(envelope, q_power), denominator)
    )


def _m_q0(s_value: _Model32, v_value: _Model32) -> _Model32:
    argument = _m_scale(_m_mul(s_value, v_value), -2)
    return _m_scale(_m_mul(v_value, _m_phi1(argument)), -2)


@dataclass(frozen=True, slots=True)
class _KernelConstants:
    alpha: _Interval
    c_g1: _Interval
    c_g2: _Interval
    c_k0: _Interval


def _kernel_constants(k_min: _Interval, sigma_abs_max: _Interval) -> _KernelConstants:
    if k_min.lower <= 0 or sigma_abs_max.lower < 0:
        _fail("kernel_input_margin")
    alpha = _i_sub(_i_scale(k_min, 2), _i_scale(sigma_abs_max, Fraction(1, 32)))
    if alpha.lower <= 0:
        _fail("kernel_alpha_nonpositive")
    ai = _i_reciprocal(alpha)
    ai2 = _i_mul(ai, ai)
    ai3 = _i_mul(ai2, ai)
    ki = _i_reciprocal(k_min)
    ki2 = _i_mul(ki, ki)

    c10 = _i_add(ai2, _i_scale(ai3, Fraction(1, 32)))
    c11 = _i_scale(
        _i_mul(
            _i_add(ai, _i_scale(ai2, Fraction(1, 64))), ki
        ),
        Fraction(1, 2),
    )
    c12 = _i_scale(
        _i_mul(
            _i_add(
                _ONE,
                _i_add(
                    _i_scale(ai, Fraction(1, 64)),
                    _i_scale(ai2, Fraction(1, 4096)),
                ),
            ),
            ki2,
        ),
        Fraction(1, 4),
    )
    c21 = _i_scale(
        _i_mul(
            _i_add(
                ai,
                _i_add(
                    _i_scale(ai2, Fraction(1, 32)),
                    _i_scale(ai3, Fraction(1, 2048)),
                ),
            ),
            ki,
        ),
        Fraction(1, 2),
    )
    c22 = _i_scale(
        _i_mul(
            _i_add(
                _ONE,
                _i_add(
                    _i_scale(ai, Fraction(1, 32)),
                    _i_add(
                        _i_scale(ai2, Fraction(1, 1024)),
                        _i_scale(ai3, Fraction(1, 65536)),
                    ),
                ),
            ),
            ki2,
        ),
        Fraction(1, 4),
    )
    c_g1 = _Interval(
        max(c10.lower, c11.lower, c12.lower),
        max(c10.upper, c11.upper, c12.upper),
    )
    c_g2 = _Interval(
        max(c10.lower, c21.lower, c22.lower),
        max(c10.upper, c21.upper, c22.upper),
    )
    c_k0 = _i_scale(ki2, Fraction(1, 16))
    return _KernelConstants(alpha, c_g1, c_g2, c_k0)


@dataclass(frozen=True, slots=True)
class _CalculationReceipt:
    runtime_paths: tuple[str, str, str]
    alpha: tuple[str, str]
    c_g1: tuple[str, str]
    c_g2: tuple[str, str]
    c_k0: tuple[str, str]
    source_envelope_calculus_implemented: bool = False
    endpoint_cap_implemented: bool = False
    source_dag_implemented: bool = False
    independent_audit_clear: bool = False
    proof_execution_authorized: bool = False
    candidate_executed: bool = False
    proof_receipt_ready: bool = False
    branch_accepted: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False

    def __post_init__(self) -> None:
        if any(
            (
                self.source_envelope_calculus_implemented,
                self.endpoint_cap_implemented,
                self.source_dag_implemented,
                self.independent_audit_clear,
                self.proof_execution_authorized,
                self.candidate_executed,
                self.proof_receipt_ready,
                self.branch_accepted,
                self.theory_graph_authority,
                self.physical_authority,
                self.propulsion_authority,
                self.transport_authority,
            )
        ):
            _fail("calculation_receipt_authority_promotion")


def _test_only_kernel_receipt(
    k_min: Fraction, sigma_abs_max: Fraction, marker: object
) -> _CalculationReceipt:
    if marker is not _TEST_MARKER:
        _fail("synthetic_test_marker_required")
    with _RUNTIME_LOCK:
        runtime = _verify_runtime()
        constants = _kernel_constants(
            _Interval.exact(k_min), _Interval.exact(sigma_abs_max)
        )
    return _CalculationReceipt(
        runtime_paths=runtime,
        alpha=constants.alpha.encoded(),
        c_g1=constants.c_g1.encoded(),
        c_g2=constants.c_g2.encoded(),
        c_k0=constants.c_k0.encoded(),
    )


def observe_tail_volterra_bound_assembler() -> NoReturn:
    """Fail closed until the full calculus and independent audit are installed."""

    _fail("tail_source_envelope_calculus_independent_audit_not_installed")
