"""Directed MPFR256 lambda-zero origin contraction and envelope evaluator.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: directed origin recurrence, contraction, and envelope
Current maturity: authority-neutral calculation kernel with blocked public route
Target maturity: authenticated origin stream of the global ground-state proof
Required frozen inputs: directed-proof architecture/operator and exact oracle
Required evidence: RNDD/RNDU recurrence, defects, Y/Z bounds, all 61 radii,
    n=17..34 envelope base, propagation inequality, context restoration
Stop/fail criteria: dependency/runtime drift, forbidden MPFR flag, enclosure miss,
    no valid radius, envelope failure, context leak, or authority promotion
Explicit non-goals: accepted seed ingress, exterior/core/tail proof, kernel,
    transversality, first tube, candidate execution, lamp, or physical authority
Downstream gate unlocked: authenticated origin proof-stream implementation

The public zero-argument route remains blocked until an authenticated seed
producer exists. The marker-gated seam is synthetic test infrastructure only.
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
    "LambdaZeroOriginDirectedError",
    "observe_lambda_zero_origin_directed",
]


DIRECTED_PROOF_OPERATOR_RAW_SHA256: Final[str] = (
    "084e1b32a15955fd9867f9616a4ec01bb986a12fa347162df92efed7c1d430a1"
)
DIRECTED_PROOF_OPERATOR_RAW_SIZE_BYTES: Final[int] = 54_712
DIRECTED_PROOF_ARCHITECTURE_SHA256: Final[str] = (
    "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99"
)
DIRECTED_PROOF_ARCHITECTURE_CANONICAL_SIZE_BYTES: Final[int] = 42_778
EXACT_ORACLE_RAW_SHA256: Final[str] = (
    "ca71d52240be921399f6fbb27201d2bd85807f1e56a0c3468c5863cc8057f894"
)
EXACT_ORACLE_RAW_SIZE_BYTES: Final[int] = 11_912
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
EXPECTED_GMPY2_VERSION: Final[str] = "2.3.1"
EXPECTED_MPFR_VERSION: Final[str] = "MPFR 4.2.2"
MAXIMUM_SCALAR_BITS: Final[int] = 1_024
REPRESENTATIVE_MAXIMUM_INDEX: Final[int] = 16
BASE_MAXIMUM_INDEX: Final[int] = 34
DEFECT_MINIMUM_INDEX: Final[int] = 17
DEFECT_MAXIMUM_INDEX: Final[int] = 33
RADIUS_CANDIDATES: Final[tuple[Fraction, ...]] = tuple(
    Fraction(1, 1 << exponent) for exponent in range(80, 19, -1)
)
D_EXACT: Final[Fraction] = Fraction(1, 1 << 8)
Q_EXACT: Final[Fraction] = Fraction(1, 1 << 12)
M_EXACT: Final[Fraction] = Fraction(1 << 8)
WIRE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-origin-directed/v1\n"
)
TRACE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-origin-directed-trace/v1\n"
)
_TEST_MARKER: Final = object()


class LambdaZeroOriginDirectedError(RuntimeError):
    """Typed fail-closed directed-origin error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise LambdaZeroOriginDirectedError(code, detail)


def _fraction(value: object, label: str) -> Fraction:
    if type(value) is int:
        result = Fraction(value)
    elif type(value) is Fraction:
        result = value
    else:
        _fail("scalar_exact_rational_required", label)
    if (
        result.numerator.bit_length() > MAXIMUM_SCALAR_BITS
        or result.denominator.bit_length() > MAXIMUM_SCALAR_BITS
    ):
        _fail("scalar_bit_budget_exceeded", label)
    return result


def _runtime_guard() -> None:
    if (
        gmpy2.version() != EXPECTED_GMPY2_VERSION
        or gmpy2.mpfr_version() != EXPECTED_MPFR_VERSION
    ):
        _fail("mpfr_runtime_version_mismatch")


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
    lower = tuple(
        engine.directed(
            gmpy2.RoundDown,
            "L",
            label + ".mul",
            lambda a=a, b=b: a * b,
        )
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    upper = tuple(
        engine.directed(
            gmpy2.RoundUp,
            "U",
            label + ".mul",
            lambda a=a, b=b: a * b,
        )
        for a in (left.lower, left.upper)
        for b in (right.lower, right.upper)
    )
    return _Interval(min(lower), max(upper))


def _i_div_positive_integer(
    engine: _Engine, value: _Interval, denominator: int, label: str
) -> _Interval:
    return _Interval(
        engine.directed(
            gmpy2.RoundDown,
            "L",
            label + ".div",
            lambda: value.lower / denominator,
        ),
        engine.directed(
            gmpy2.RoundUp,
            "U",
            label + ".div",
            lambda: value.upper / denominator,
        ),
    )


def _i_abs_upper(engine: _Engine, value: _Interval, label: str) -> gmpy2.mpfr:
    return engine.directed(
        gmpy2.RoundUp,
        "U",
        label + ".abs",
        lambda: max(abs(value.lower), abs(value.upper)),
    )


def _up(
    engine: _Engine, operation: str, function: Callable[[], object]
) -> gmpy2.mpfr:
    return engine.directed(gmpy2.RoundUp, "U", operation, function)


def _convolution(
    engine: _Engine,
    left: list[_Interval],
    right: list[_Interval],
    shell: int,
    label: str,
) -> _Interval:
    result = _i_exact(engine, 0, label + ".zero")
    for index in range(shell + 1):
        product = _i_mul(
            engine,
            left[index],
            right[shell - index],
            f"{label}.term[{index}]",
        )
        result = _i_add(
            engine,
            result,
            product,
            f"{label}.accumulate[{index}]",
        )
    return result


def _next_coefficients(
    engine: _Engine,
    a: list[_Interval],
    b: list[_Interval],
    nu: _Interval,
    shell: int,
) -> tuple[_Interval, _Interval]:
    denominator = 2 * (shell + 1) * (2 * (shell + 1) + 1)
    ba = _convolution(engine, b, a, shell, f"ba[{shell}]")
    aa = _convolution(engine, a, a, shell, f"aa[{shell}]")
    nu_a = _i_mul(engine, nu, a[shell], f"nu_a[{shell}]")
    a_next = _i_div_positive_integer(
        engine,
        _i_mul(
            engine,
            _i_exact(engine, 2, f"two[{shell}]"),
            _i_sub(engine, ba, nu_a, f"ba_minus_nu_a[{shell}]"),
            f"twice_ba_minus_nu_a[{shell}]",
        ),
        denominator,
        f"a[{shell + 1}]",
    )
    b_next = _i_div_positive_integer(
        engine,
        aa,
        denominator,
        f"b[{shell + 1}]",
    )
    return a_next, b_next


def _trace_sha256(trace: tuple[str, ...]) -> str:
    encoded = "\n".join(trace).encode("ascii")
    return hashlib.sha256(
        TRACE_DOMAIN + len(encoded).to_bytes(8, "little") + encoded
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
class _RadiusResult:
    ordinal: int
    radius: Fraction
    z_upper: gmpy2.mpfr
    p_upper: gmpy2.mpfr
    contraction_passed: bool
    envelope_base_passed: bool
    envelope_propagation_passed: bool
    selected: bool


@dataclass(frozen=True, slots=True)
class _DirectedOriginReceipt:
    representative_a: tuple[_Interval, ...]
    representative_b: tuple[_Interval, ...]
    continuation_a: tuple[_Interval, ...]
    continuation_b: tuple[_Interval, ...]
    defects_a: tuple[_Interval, ...]
    defects_b: tuple[_Interval, ...]
    y_upper: gmpy2.mpfr
    z0_upper: gmpy2.mpfr
    z1_upper: gmpy2.mpfr
    envelope_base_passed: bool
    envelope_propagation_upper: gmpy2.mpfr
    envelope_propagation_passed: bool
    radius_results: tuple[_RadiusResult, ...]
    selected_radius_ordinal: int | None
    selected_radius: Fraction | None
    operation_count: int
    operation_trace_sha256: str
    canonical_sha256: str
    runtime_versions: tuple[str, str]
    precision_bits: int
    synthetic_test_only: bool
    origin_stream_authenticated: bool
    exterior_proof_complete: bool
    global_ground_state_accepted: bool
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
            "origin_stream_authenticated",
            "exterior_proof_complete",
            "global_ground_state_accepted",
            "proof_execution_authorized",
            "candidate_executed",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        if any(getattr(self, field) is not False for field in false_fields):
            _fail("receipt_authority_promotion_forbidden")


def observe_lambda_zero_origin_directed() -> NoReturn:
    """Fail closed until an authenticated Newtonian seed instance exists."""

    _fail("accepted_newtonian_seed_instance_absent")


def _test_only_evaluate_lambda_zero_origin_directed(
    nu0: object,
    vc: object,
    marker: object,
) -> _DirectedOriginReceipt:
    if marker is not _TEST_MARKER:
        _fail("private_test_marker_required")
    _runtime_guard()
    exact_nu = _fraction(nu0, "nu0")
    exact_vc = _fraction(vc, "vc")
    if exact_nu >= 0:
        _fail("negative_nu_required")
    if exact_vc >= 0:
        _fail("negative_vc_required")

    engine = _Engine(trace=[])
    nu = _i_exact(engine, exact_nu, "nu0")
    a = [_i_exact(engine, 1, "a[0]")]
    b = [_i_exact(engine, exact_vc, "b[0]")]
    for shell in range(BASE_MAXIMUM_INDEX):
        a_next, b_next = _next_coefficients(engine, a, b, nu, shell)
        a.append(a_next)
        b.append(b_next)
    representative_a = tuple(a[: REPRESENTATIVE_MAXIMUM_INDEX + 1])
    representative_b = tuple(b[: REPRESENTATIVE_MAXIMUM_INDEX + 1])

    zero = _i_exact(engine, 0, "defect.zero")
    defects_a: list[_Interval] = []
    defects_b: list[_Interval] = []
    padded_a = list(representative_a) + [zero] * (
        DEFECT_MAXIMUM_INDEX - REPRESENTATIVE_MAXIMUM_INDEX
    )
    padded_b = list(representative_b) + [zero] * (
        DEFECT_MAXIMUM_INDEX - REPRESENTATIVE_MAXIMUM_INDEX
    )
    for index in range(DEFECT_MINIMUM_INDEX, DEFECT_MAXIMUM_INDEX + 1):
        shell = index - 1
        predicted_a, predicted_b = _next_coefficients(
            engine,
            padded_a[:index],
            padded_b[:index],
            nu,
            shell,
        )
        defects_a.append(
            _i_sub(engine, padded_a[index], predicted_a, f"defect_a[{index}]")
        )
        defects_b.append(
            _i_sub(engine, padded_b[index], predicted_b, f"defect_b[{index}]")
        )

    d = _i_exact(engine, D_EXACT, "d")
    inv_d17 = _i_exact(engine, Fraction(1, 1_190), "invD17")
    d_squared = _i_mul(engine, d, d, "d_squared")
    # q=1/4096, so division by q is multiplication by its denominator.
    ratio = _i_mul(
        engine,
        d_squared,
        _i_exact(engine, Q_EXACT.denominator, "q_reciprocal"),
        "d_squared_over_q",
    )

    d_power = _i_exact(engine, 1, "d_power[0]")
    ratio_power = _i_exact(engine, 1, "ratio_power[0]")
    abar = _i_exact(engine, 0, "abar.zero")
    bbar = _i_exact(engine, 0, "bbar.zero")
    aq = _i_exact(engine, 0, "aq.zero")
    bq = _i_exact(engine, 0, "bq.zero")
    for index in range(REPRESENTATIVE_MAXIMUM_INDEX + 1):
        if index > 0:
            d_power = _i_mul(engine, d_power, d_squared, f"d_power[{index}]")
            ratio_power = _i_mul(
                engine,
                ratio_power,
                ratio,
                f"ratio_power[{index}]",
            )
        a_abs = _Interval(
            gmpy2.mpfr(0),
            _i_abs_upper(engine, representative_a[index], f"a_abs[{index}]"),
        )
        b_abs = _Interval(
            gmpy2.mpfr(0),
            _i_abs_upper(engine, representative_b[index], f"b_abs[{index}]"),
        )
        abar = _i_add(
            engine,
            abar,
            _i_mul(engine, d_power, a_abs, f"abar_term[{index}]"),
            f"abar_sum[{index}]",
        )
        bbar = _i_add(
            engine,
            bbar,
            _i_mul(engine, d_power, b_abs, f"bbar_term[{index}]"),
            f"bbar_sum[{index}]",
        )
        aq = _i_add(
            engine,
            aq,
            _i_mul(engine, ratio_power, a_abs, f"aq_term[{index}]"),
            f"aq_sum[{index}]",
        )
        bq = _i_add(
            engine,
            bq,
            _i_mul(engine, ratio_power, b_abs, f"bq_term[{index}]"),
            f"bq_sum[{index}]",
        )

    y_upper = gmpy2.mpfr(0)
    defect_weight = _i_exact(
        engine,
        D_EXACT ** (2 * DEFECT_MINIMUM_INDEX),
        "defect_weight[17]",
    )
    for offset, (ga, gb) in enumerate(zip(defects_a, defects_b, strict=True)):
        index = DEFECT_MINIMUM_INDEX + offset
        if offset > 0:
            defect_weight = _i_mul(
                engine,
                defect_weight,
                d_squared,
                f"defect_weight[{index}]",
            )
        ga_abs = _i_abs_upper(engine, ga, f"defect_a_abs[{index}]")
        gb_abs = _i_abs_upper(engine, gb, f"defect_b_abs[{index}]")
        defect_sum = _up(
            engine,
            f"defect_abs_sum[{index}]",
            lambda ga_abs=ga_abs, gb_abs=gb_abs: ga_abs + gb_abs,
        )
        term = _up(
            engine,
            f"y_term[{index}]",
            lambda defect_sum=defect_sum, weight=defect_weight.upper: (
                weight * defect_sum
            ),
        )
        y_upper = _up(
            engine,
            f"y_sum[{index}]",
            lambda term=term, current=y_upper: current + term,
        )

    nu_abs = _i_abs_upper(engine, nu, "nu_abs")
    z0_inner = _up(
        engine,
        "z0_inner_ab",
        lambda: abar.upper + bbar.upper,
    )
    z0_inner = _up(
        engine,
        "z0_inner_nu",
        lambda: z0_inner + nu_abs,
    )
    z0_inner = _up(engine, "z0_inner_twice", lambda: 2 * z0_inner)
    z0_upper = _up(
        engine,
        "z0",
        lambda: inv_d17.upper * z0_inner,
    )
    z1_upper = _up(engine, "z1", lambda: inv_d17.upper * 6)

    envelope_base_passed = True
    for index in range(DEFECT_MINIMUM_INDEX, BASE_MAXIMUM_INDEX + 1):
        base_a_abs = _i_abs_upper(engine, a[index], f"base_a_abs[{index}]")
        base_b_abs = _i_abs_upper(engine, b[index], f"base_b_abs[{index}]")
        coefficient_abs = _up(
            engine,
            f"base_abs[{index}]",
            lambda base_a_abs=base_a_abs, base_b_abs=base_b_abs: (
                base_a_abs + base_b_abs
            ),
        )
        left = _up(
            engine,
            f"base_left[{index}]",
            lambda coefficient_abs=coefficient_abs, index=index: (
                _mpq(D_EXACT ** (2 * index)) * coefficient_abs
            ),
        )
        right = _mpq(M_EXACT * Q_EXACT**index)
        if left > right:
            envelope_base_passed = False

    c_upper = _up(engine, "c_a", lambda: 4 * aq.upper)
    c_upper = _up(engine, "c_b", lambda: c_upper + 2 * bq.upper)
    c_upper = _up(engine, "c_nu", lambda: c_upper + 2 * nu_abs)
    c_upper = _up(engine, "c_M", lambda: M_EXACT * c_upper)
    propagation_inner = _up(engine, "propagation_c", lambda: c_upper / 4_970)
    propagation_inner = _up(
        engine,
        "propagation_m",
        lambda: propagation_inner + 3 * M_EXACT**2 / 548,
    )
    envelope_propagation_upper = _up(
        engine,
        "propagation_final",
        lambda: _mpq(D_EXACT**2 / (M_EXACT * Q_EXACT))
        * propagation_inner,
    )
    envelope_propagation_passed = envelope_propagation_upper <= 1

    radius_rows: list[_RadiusResult] = []
    selected_ordinal: int | None = None
    for ordinal, radius in enumerate(RADIUS_CANDIDATES):
        radius_mpq = _mpq(radius)
        zr = _up(
            engine,
            f"radius_z1r[{ordinal}]",
            lambda radius_mpq=radius_mpq: z1_upper * radius_mpq,
        )
        z_upper = _up(
            engine,
            f"radius_z[{ordinal}]",
            lambda zr=zr: z0_upper + zr,
        )
        z_times_r = _up(
            engine,
            f"radius_zr[{ordinal}]",
            lambda z_upper=z_upper, radius_mpq=radius_mpq: (
                z_upper * radius_mpq
            ),
        )
        p_sum = _up(
            engine,
            f"radius_p_sum[{ordinal}]",
            lambda z_times_r=z_times_r: y_upper + z_times_r,
        )
        p_upper = _up(
            engine,
            f"radius_p[{ordinal}]",
            lambda p_sum=p_sum, radius_mpq=radius_mpq: p_sum - radius_mpq,
        )
        contraction_passed = p_upper < 0 and z_upper < 1
        accepted = (
            contraction_passed
            and envelope_base_passed
            and envelope_propagation_passed
        )
        selected = accepted and selected_ordinal is None
        if selected:
            selected_ordinal = ordinal
        radius_rows.append(
            _RadiusResult(
                ordinal=ordinal,
                radius=radius,
                z_upper=z_upper,
                p_upper=p_upper,
                contraction_passed=contraction_passed,
                envelope_base_passed=envelope_base_passed,
                envelope_propagation_passed=envelope_propagation_passed,
                selected=selected,
            )
        )

    trace = tuple(engine.trace)
    payload = {
        "envelopeBasePassed": envelope_base_passed,
        "envelopePropagationPassed": envelope_propagation_passed,
        "operationCount": len(trace),
        "operationTraceSha256": _trace_sha256(trace),
        "selectedRadiusOrdinal": selected_ordinal,
        "version": "nhm2_spherical_boson_star_v2_lambda_zero_origin_directed/v1",
    }
    return _DirectedOriginReceipt(
        representative_a=representative_a,
        representative_b=representative_b,
        continuation_a=tuple(a[DEFECT_MINIMUM_INDEX : BASE_MAXIMUM_INDEX + 1]),
        continuation_b=tuple(b[DEFECT_MINIMUM_INDEX : BASE_MAXIMUM_INDEX + 1]),
        defects_a=tuple(defects_a),
        defects_b=tuple(defects_b),
        y_upper=y_upper,
        z0_upper=z0_upper,
        z1_upper=z1_upper,
        envelope_base_passed=envelope_base_passed,
        envelope_propagation_upper=envelope_propagation_upper,
        envelope_propagation_passed=envelope_propagation_passed,
        radius_results=tuple(radius_rows),
        selected_radius_ordinal=selected_ordinal,
        selected_radius=(
            None if selected_ordinal is None else RADIUS_CANDIDATES[selected_ordinal]
        ),
        operation_count=len(trace),
        operation_trace_sha256=_trace_sha256(trace),
        canonical_sha256=_wire_sha256(payload),
        runtime_versions=(gmpy2.version(), gmpy2.mpfr_version()),
        precision_bits=MPFR_PRECISION_BITS,
        synthetic_test_only=True,
        origin_stream_authenticated=False,
        exterior_proof_complete=False,
        global_ground_state_accepted=False,
        proof_execution_authorized=False,
        candidate_executed=False,
        theory_graph_authority=False,
        physical_authority=False,
        propulsion_authority=False,
        transport_authority=False,
        blockers=(
            "accepted_newtonian_seed_instance_absent",
            "authenticated_origin_proof_runtime_and_preseal_absent",
            "exterior_global_root_proof_not_implemented",
            "simple_kernel_and_transversality_proofs_not_implemented",
            "first_vacuum_tube_containment_not_implemented",
            "source_runtime_disjoint_replay_absent",
        ),
    )
