"""Directed MPFR256 finite-prefix lambda-zero coupled-Jacobian evaluator.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: directed finite-prefix coupled-Jacobian enclosure
Current maturity: authority-neutral calculation kernel with blocked public route
Target maturity: authenticated primary finite-column evaluator for a global inverse
Required frozen inputs: sealed lambda-zero successor and exact prefix oracle
Required evidence: RNDD/RNDU enclosure, literal accumulation order, runtime facts,
    exact replay containment, context restoration, and false authority locks
Stop/fail criteria: dependency drift, invalid MPFR flag, nonfinite endpoint,
    exact containment failure, context leak, or authority promotion
Explicit non-goals: accepted profile ingress, tail columns, inverse norm, kernel,
    transversality, first tube, proof execution, candidate, lamp, or viability
Downstream gate unlocked: finite block for the directed approximate inverse

The public zero-argument route is permanently blocked until an authenticated
ground-state producer and proof runtime exist. A marker-gated private seam is
used only by the focused test and cannot issue a proof receipt.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
from typing import Callable, Final, Iterator, NoReturn

import gmpy2


__all__ = [
    "LambdaZeroCoupledJacobianDirectedError",
    "observe_lambda_zero_coupled_jacobian_directed",
]


LAMBDA_ZERO_DEFINITION_SEMANTIC_SHA256: Final[str] = (
    "bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f"
)
LAMBDA_ZERO_DEFINITION_CANONICAL_SIZE_BYTES: Final[int] = 8_157
LAMBDA_ZERO_DEFINITION_RAW_SHA256: Final[str] = (
    "ee617cf1c48d25536e1faf11f9cd2bd75fc25deb2b102fec547243c26e928de7"
)
LAMBDA_ZERO_DEFINITION_RAW_SIZE_BYTES: Final[int] = 20_476
EXACT_ORACLE_RAW_SHA256: Final[str] = (
    "3e96aba583ed5b560dd257f9c6cfdd5e1741b487417f9bdc8acc09e06d4d0eb0"
)
EXACT_ORACLE_RAW_SIZE_BYTES: Final[int] = 9_924
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
EXPECTED_GMPY2_VERSION: Final[str] = "2.3.1"
EXPECTED_MPFR_VERSION: Final[str] = "MPFR 4.2.2"
MAXIMUM_PREFIX_COEFFICIENTS: Final[int] = 513
MAXIMUM_SCALAR_BITS: Final[int] = 2_048
WIRE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/"
    b"lambda-zero-coupled-jacobian-directed/v1\n"
)
TRACE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/"
    b"lambda-zero-coupled-jacobian-directed-trace/v1\n"
)
_TEST_MARKER: Final = object()


class LambdaZeroCoupledJacobianDirectedError(RuntimeError):
    """Typed fail-closed directed evaluator error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise LambdaZeroCoupledJacobianDirectedError(code, detail)


def _fraction(value: object, label: str) -> Fraction:
    if type(value) is int:
        result = Fraction(value)
    elif type(value) is Fraction:
        result = value
    else:
        _fail("exact_rational_required", label)
    if (
        result.numerator.bit_length() > MAXIMUM_SCALAR_BITS
        or result.denominator.bit_length() > MAXIMUM_SCALAR_BITS
    ):
        _fail("scalar_bit_budget_exceeded", label)
    return result


def _coefficients(value: object, label: str) -> tuple[Fraction, ...]:
    if type(value) is not tuple:
        _fail("coefficient_tuple_required", label)
    if not 1 <= len(value) <= MAXIMUM_PREFIX_COEFFICIENTS:
        _fail("coefficient_count_invalid", label)
    return tuple(
        _fraction(entry, f"{label}[{index}]")
        for index, entry in enumerate(value)
    )


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


@dataclass(slots=True)
class _Engine:
    trace: list[str]

    @contextmanager
    def rounded(self, rounding: int, operation: str) -> Iterator[None]:
        with gmpy2.context(_context_template(rounding)):
            context = gmpy2.get_context()
            context.clear_flags()
            yield
            forbidden = tuple(
                name
                for name in (
                    "invalid",
                    "divzero",
                    "overflow",
                    "underflow",
                    "erange",
                )
                if bool(getattr(context, name))
            )
            if forbidden:
                _fail(
                    "mpfr_forbidden_flag",
                    operation + ":" + ",".join(forbidden),
                )

    def directed(
        self,
        rounding: int,
        direction: str,
        operation: str,
        function: Callable[[], object],
    ) -> gmpy2.mpfr:
        label = f"{len(self.trace)}:{operation}:{direction}"
        with self.rounded(rounding, label):
            value = gmpy2.mpfr(function())
        if not gmpy2.is_finite(value):
            _fail("mpfr_endpoint_invalid", label)
        self.trace.append(label)
        return gmpy2.mpfr(0) if gmpy2.is_zero(value) else value


def _mpq(value: Fraction | int) -> gmpy2.mpq:
    rational = value if type(value) is Fraction else Fraction(value)
    return gmpy2.mpq(rational.numerator, rational.denominator)


def _runtime_guard() -> None:
    if (
        gmpy2.version() != EXPECTED_GMPY2_VERSION
        or gmpy2.mpfr_version() != EXPECTED_MPFR_VERSION
    ):
        _fail("mpfr_runtime_version_mismatch")


def _encode(value: gmpy2.mpfr, direction: str) -> str:
    numerator, denominator = value.as_integer_ratio()
    numerator = int(numerator)
    denominator = int(denominator)
    if numerator == 0:
        return f"0:0:0:{MPFR_PRECISION_BITS}:{direction}"
    sign = -1 if numerator < 0 else 1
    mantissa = abs(numerator)
    exponent = -(denominator.bit_length() - 1)
    while mantissa & 1 == 0:
        mantissa >>= 1
        exponent += 1
    return f"{sign}:{mantissa:x}:{exponent}:{MPFR_PRECISION_BITS}:{direction}"


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

    def encoded(self) -> tuple[str, str]:
        return (_encode(self.lower, "L"), _encode(self.upper, "U"))

    def contains(self, value: Fraction | int) -> bool:
        return self.lower <= _mpq(value) <= self.upper


def _i_exact(engine: _Engine, value: Fraction | int, label: str) -> _Interval:
    rational = _mpq(value)
    return _Interval(
        engine.directed(
            gmpy2.RoundDown,
            "L",
            label + ".set",
            lambda: rational,
        ),
        engine.directed(
            gmpy2.RoundUp,
            "U",
            label + ".set",
            lambda: rational,
        ),
    )


def _i_add(
    engine: _Engine, left: _Interval, right: _Interval, label: str
) -> _Interval:
    return _Interval(
        engine.directed(
            gmpy2.RoundDown,
            "L",
            label + ".add",
            lambda: left.lower + right.lower,
        ),
        engine.directed(
            gmpy2.RoundUp,
            "U",
            label + ".add",
            lambda: left.upper + right.upper,
        ),
    )


def _i_neg(engine: _Engine, value: _Interval, label: str) -> _Interval:
    return _Interval(
        engine.directed(
            gmpy2.RoundDown,
            "L",
            label + ".neg",
            lambda: -value.upper,
        ),
        engine.directed(
            gmpy2.RoundUp,
            "U",
            label + ".neg",
            lambda: -value.lower,
        ),
    )


def _i_sub(
    engine: _Engine, left: _Interval, right: _Interval, label: str
) -> _Interval:
    return _i_add(engine, left, _i_neg(engine, right, label), label)


def _i_mul(
    engine: _Engine, left: _Interval, right: _Interval, label: str
) -> _Interval:
    lower_candidates = tuple(
        engine.directed(
            gmpy2.RoundDown,
            "L",
            label + ".mul",
            lambda a=a, b=b: a * b,
        )
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    upper_candidates = tuple(
        engine.directed(
            gmpy2.RoundUp,
            "U",
            label + ".mul",
            lambda a=a, b=b: a * b,
        )
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    return _Interval(min(lower_candidates), max(upper_candidates))


def _sum_products(
    engine: _Engine,
    left: tuple[_Interval, ...],
    right: tuple[_Interval, ...],
    shell: int,
    label: str,
) -> _Interval:
    result = _i_exact(engine, 0, label + ".zero")
    for left_index in range(shell + 1):
        product = _i_mul(
            engine,
            left[left_index],
            right[shell - left_index],
            f"{label}.term[{left_index}]",
        )
        result = _i_add(
            engine,
            result,
            product,
            f"{label}.accumulate[{left_index}]",
        )
    return result


def _trace_sha256(trace: tuple[str, ...]) -> str:
    payload = "\n".join(trace).encode("ascii")
    return hashlib.sha256(
        TRACE_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()


def _wire_sha256(payload: object) -> str:
    encoded = json.dumps(
        payload,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")
    return hashlib.sha256(
        WIRE_DOMAIN + len(encoded).to_bytes(8, "little") + encoded
    ).hexdigest()


@dataclass(frozen=True, slots=True)
class _DirectedReceipt:
    delta_r_u: tuple[_Interval, ...]
    delta_r_v: tuple[_Interval, ...]
    delta_r_normalization: _Interval
    operation_count: int
    operation_trace_sha256: str
    canonical_sha256: str
    runtime_versions: tuple[str, str]
    precision_bits: int
    synthetic_test_only: bool
    exact_oracle_containment_checked_by_caller: bool
    accepted_ground_state_bound: bool
    analytic_tail_columns_implemented: bool
    global_inverse_proved: bool
    proof_execution_authorized: bool
    candidate_executed: bool
    theory_graph_authority: bool
    physical_authority: bool
    propulsion_authority: bool
    transport_authority: bool
    blockers: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.synthetic_test_only is not True or self.precision_bits != 256:
            _fail("receipt_calculation_fact_invalid")
        false_fields = (
            "exact_oracle_containment_checked_by_caller",
            "accepted_ground_state_bound",
            "analytic_tail_columns_implemented",
            "global_inverse_proved",
            "proof_execution_authorized",
            "candidate_executed",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        if any(getattr(self, field) is not False for field in false_fields):
            _fail("receipt_authority_promotion_forbidden")


def observe_lambda_zero_coupled_jacobian_directed() -> NoReturn:
    """Fail closed until an authenticated global ground state exists."""

    _fail("accepted_global_newtonian_profile_absent")


def _test_only_apply_lambda_zero_coupled_jacobian_directed(
    u: object,
    v: object,
    nu: object,
    delta_u: object,
    delta_v: object,
    delta_nu: object,
    marker: object,
) -> _DirectedReceipt:
    if marker is not _TEST_MARKER:
        _fail("private_test_marker_required")
    _runtime_guard()
    exact_u = _coefficients(u, "u")
    exact_v = _coefficients(v, "v")
    exact_delta_u = _coefficients(delta_u, "delta_u")
    exact_delta_v = _coefficients(delta_v, "delta_v")
    if not (
        len(exact_u)
        == len(exact_v)
        == len(exact_delta_u)
        == len(exact_delta_v)
    ):
        _fail("coefficient_length_mismatch")
    if exact_u[0] != 1:
        _fail("normalized_ground_state_u0_required")
    exact_nu = _fraction(nu, "nu")
    if exact_nu >= 0:
        _fail("negative_nu_required")
    exact_delta_nu = _fraction(delta_nu, "delta_nu")

    engine = _Engine(trace=[])
    interval_u = tuple(
        _i_exact(engine, value, f"u[{index}]")
        for index, value in enumerate(exact_u)
    )
    interval_v = tuple(
        _i_exact(engine, value, f"v[{index}]")
        for index, value in enumerate(exact_v)
    )
    interval_delta_u = tuple(
        _i_exact(engine, value, f"delta_u[{index}]")
        for index, value in enumerate(exact_delta_u)
    )
    interval_delta_v = tuple(
        _i_exact(engine, value, f"delta_v[{index}]")
        for index, value in enumerate(exact_delta_v)
    )
    interval_nu = _i_exact(engine, exact_nu, "nu")
    interval_delta_nu = _i_exact(engine, exact_delta_nu, "delta_nu")
    zero = _i_exact(engine, 0, "constant.zero")
    two = _i_exact(engine, 2, "constant.two")
    half = _i_exact(engine, Fraction(1, 2), "constant.half")
    potential = list(interval_v)
    potential[0] = _i_sub(engine, potential[0], interval_nu, "potential[0]")

    delta_r_u: list[_Interval] = []
    delta_r_v: list[_Interval] = []
    length = len(exact_u)
    for shell in range(length):
        if shell + 1 < length:
            factor = _i_exact(
                engine,
                2 * (shell + 1) * (2 * (shell + 1) + 1),
                f"laplacian_factor[{shell}]",
            )
            lap_delta_u = _i_mul(
                engine,
                factor,
                interval_delta_u[shell + 1],
                f"laplacian_delta_u[{shell}]",
            )
            lap_delta_v = _i_mul(
                engine,
                factor,
                interval_delta_v[shell + 1],
                f"laplacian_delta_v[{shell}]",
            )
        else:
            lap_delta_u = zero
            lap_delta_v = zero
        potential_delta_u = _sum_products(
            engine,
            tuple(potential),
            interval_delta_u,
            shell,
            f"potential_delta_u[{shell}]",
        )
        spectral = _i_add(
            engine,
            _i_neg(
                engine,
                _i_mul(
                    engine,
                    half,
                    lap_delta_u,
                    f"half_laplacian_delta_u[{shell}]",
                ),
                f"negative_half_laplacian_delta_u[{shell}]",
            ),
            potential_delta_u,
            f"spectral[{shell}]",
        )
        u_delta_v = _sum_products(
            engine,
            interval_u,
            interval_delta_v,
            shell,
            f"u_delta_v[{shell}]",
        )
        u_delta_nu = _i_mul(
            engine,
            interval_u[shell],
            interval_delta_nu,
            f"u_delta_nu[{shell}]",
        )
        delta_r_u.append(
            _i_sub(
                engine,
                _i_add(
                    engine,
                    spectral,
                    u_delta_v,
                    f"delta_r_u_sum[{shell}]",
                ),
                u_delta_nu,
                f"delta_r_u[{shell}]",
            )
        )
        u_delta_u = _sum_products(
            engine,
            interval_u,
            interval_delta_u,
            shell,
            f"u_delta_u[{shell}]",
        )
        delta_r_v.append(
            _i_sub(
                engine,
                lap_delta_v,
                _i_mul(
                    engine,
                    two,
                    u_delta_u,
                    f"twice_u_delta_u[{shell}]",
                ),
                f"delta_r_v[{shell}]",
            )
        )

    trace = tuple(engine.trace)
    encoded_u = tuple(value.encoded() for value in delta_r_u)
    encoded_v = tuple(value.encoded() for value in delta_r_v)
    encoded_norm = interval_delta_u[0].encoded()
    payload = {
        "deltaRNormalization": encoded_norm,
        "deltaRU": encoded_u,
        "deltaRV": encoded_v,
        "operationCount": len(trace),
        "operationTraceSha256": _trace_sha256(trace),
        "precisionBits": MPFR_PRECISION_BITS,
        "version": (
            "nhm2_spherical_boson_star_v2_"
            "lambda_zero_coupled_jacobian_directed/v1"
        ),
    }
    return _DirectedReceipt(
        delta_r_u=tuple(delta_r_u),
        delta_r_v=tuple(delta_r_v),
        delta_r_normalization=interval_delta_u[0],
        operation_count=len(trace),
        operation_trace_sha256=_trace_sha256(trace),
        canonical_sha256=_wire_sha256(payload),
        runtime_versions=(gmpy2.version(), gmpy2.mpfr_version()),
        precision_bits=MPFR_PRECISION_BITS,
        synthetic_test_only=True,
        exact_oracle_containment_checked_by_caller=False,
        accepted_ground_state_bound=False,
        analytic_tail_columns_implemented=False,
        global_inverse_proved=False,
        proof_execution_authorized=False,
        candidate_executed=False,
        theory_graph_authority=False,
        physical_authority=False,
        propulsion_authority=False,
        transport_authority=False,
        blockers=(
            "accepted_global_newtonian_profile_absent",
            "authenticated_proof_runtime_and_preseal_absent",
            "analytic_tail_columns_and_global_inverse_absent",
            "simple_kernel_and_transversality_receipts_absent",
            "first_tube_containment_absent",
            "source_runtime_disjoint_replay_absent",
        ),
    )
