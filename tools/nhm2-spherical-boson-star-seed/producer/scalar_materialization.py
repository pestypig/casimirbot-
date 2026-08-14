"""Frozen nine-scalar MPFR256 output-materialization diagnostic.

The graph exactly follows the primary-numerics scalar chronology.  Structural
``projection_gate_passed`` and ``final_residual_gate_passed`` inputs are not
authenticated receipts, so this module deliberately confers no execution,
acceptance, replay, lamp, or physical authority.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import math
import struct
from types import MappingProxyType
from typing import Final, Iterator

import gmpy2


SCALAR_MATERIALIZATION_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_scalar_materialization/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
CORE_NODE_COUNT: Final[int] = 128
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
SCALAR_ORDER: Final[tuple[str, ...]] = (
    "nu0",
    "Vc",
    "N0",
    "C",
    "kappa",
    "sigma",
    "lambda",
    "nu_star",
    "wSeed",
)
SCALAR_OPERATION_GRAPH: Final[str] = (
    "set_d_nu_Vc_C;set_si_minus2;mul_minusTwoNu;sqrt_kappa;div_COverKappa;"
    "set_ui_one;sub_sigma;set_ui_four;const_pi;mul_fourPi;mul_N0;set_ui_32;"
    "div_lambda;mul_lambdaSquared;mul_nuStar;set_ui_two;mul_twoNuStar;"
    "add_wSquared;sqrt_wSeed;after_each_zero_destination_set_positive_zero_"
    "exactly_once;get_d_nu0_Vc_N0_C_kappa_sigma_lambda_nu_star_wSeed_exactly_"
    "once_each"
)


class ScalarMaterializationError(ValueError):
    """Fail-closed scalar graph error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenScalarMaterializationInput:
    projected_l2_nu: float
    projected_l2_v_at_origin: float
    accepted_tail_c: float
    projected_l2_archive_f64le_sha256: str
    accepted_tail_state_f64le_sha256: str
    projection_gate_passed: bool
    immutable_projected_archive: bool
    final_residual_gate_passed: bool
    immutable_accepted_tail_state: bool
    primary_numerics_semantic_authority: bool = False
    execution_authority: bool = False
    replay_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenScalarMaterializationResult:
    scalar_order: tuple[str, ...]
    scalar_values: tuple[float, ...]
    scalar_buffers_f64le: tuple[bytes, ...]
    aggregate_f64le: bytes
    aggregate_f64le_sha256: str
    projected_l2_archive_f64le_sha256: str
    accepted_tail_state_f64le_sha256: str
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    materialization_version: str
    materialization_graph: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    observed_gmpy2_version: str
    observed_mpfr_version: str
    set_d_count: int
    set_si_count: int
    set_ui_count: int
    multiply_count: int
    divide_count: int
    subtract_count: int
    add_count: int
    square_root_count: int
    const_pi_count: int
    terminal_get_d_count: int
    source_projection_gate_authenticated: bool = False
    source_tail_gate_authenticated: bool = False
    output_publication_complete: bool = False
    implementation_complete: bool = False
    runtime_complete: bool = False
    preseal_complete: bool = False
    execution_authorized: bool = False
    candidate_execution_observed: bool = False
    primary_replay_complete: bool = False
    independent_replay_complete: bool = False
    pair_agreement_complete: bool = False
    diagnostic_pass_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_viability: bool = False
    propulsion: bool = False
    transport: bool = False


INPUT_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "primary_numerics_semantic_authority",
    "execution_authority",
    "replay_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)
AUTHORITY_LOCKS = MappingProxyType(
    {
        "source_projection_gate_authenticated": False,
        "source_tail_gate_authenticated": False,
        "output_publication_complete": False,
        "implementation_complete": False,
        "runtime_complete": False,
        "preseal_complete": False,
        "execution_authorized": False,
        "candidate_execution_observed": False,
        "primary_replay_complete": False,
        "independent_replay_complete": False,
        "pair_agreement_complete": False,
        "diagnostic_pass_authority": False,
        "candidate_authority": False,
        "theory_graph_authority": False,
        "physical_viability": False,
        "propulsion": False,
        "transport": False,
    }
)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == b"\x00\x00\x00\x00\x00\x00\x00\x80"


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise ScalarMaterializationError("scalar_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise ScalarMaterializationError("scalar_binary64_nonfinite", detail)
    if _negative_zero(value):
        raise ScalarMaterializationError("scalar_binary64_negative_zero", detail)
    return value


def _sha256_valid(value: object) -> bool:
    return (
        type(value) is str
        and len(value) == 64
        and value != "0" * 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _validate_input(value: object) -> tuple[float, float, float]:
    if type(value) is not FrozenScalarMaterializationInput:
        raise ScalarMaterializationError("scalar_input_type_invalid")
    if value.projection_gate_passed is not True:
        raise ScalarMaterializationError("scalar_projection_gate_missing")
    if value.immutable_projected_archive is not True:
        raise ScalarMaterializationError("scalar_projected_archive_not_immutable")
    if value.final_residual_gate_passed is not True:
        raise ScalarMaterializationError("scalar_tail_gate_missing")
    if value.immutable_accepted_tail_state is not True:
        raise ScalarMaterializationError("scalar_tail_state_not_immutable")
    for name in INPUT_FALSE_FIELDS:
        if getattr(value, name) is not False:
            raise ScalarMaterializationError("scalar_input_authority_invalid", name)
    nu = _validate_f64(value.projected_l2_nu, "projected_l2_nu")
    vc = _validate_f64(
        value.projected_l2_v_at_origin, "projected_l2_v_at_origin"
    )
    c_value = _validate_f64(value.accepted_tail_c, "accepted_tail_c")
    if not _sha256_valid(value.projected_l2_archive_f64le_sha256):
        raise ScalarMaterializationError("scalar_projected_archive_hash_invalid")
    if not _sha256_valid(value.accepted_tail_state_f64le_sha256):
        raise ScalarMaterializationError("scalar_tail_state_hash_invalid")
    if not nu < 0.0:
        raise ScalarMaterializationError("scalar_projected_nu_domain_invalid")
    if not c_value > 0.0:
        raise ScalarMaterializationError("scalar_tail_C_domain_invalid")
    return nu, vc, c_value


def _owned_context_template() -> gmpy2.context:
    template = gmpy2.get_context().copy()
    template.precision = MPFR_PRECISION_BITS
    template.round = gmpy2.RoundToNearest
    template.emin = MPFR_EMIN
    template.emax = MPFR_EMAX
    template.subnormalize = False
    template.trap_underflow = False
    template.trap_overflow = False
    template.trap_inexact = False
    template.trap_invalid = False
    template.trap_erange = False
    template.trap_divzero = False
    template.underflow = False
    template.overflow = False
    template.inexact = False
    template.invalid = False
    template.erange = False
    template.divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    return template


@contextmanager
def _owned_mpfr256_context() -> Iterator[gmpy2.context]:
    with gmpy2.context(_owned_context_template()):
        context = gmpy2.get_context()
        if (
            context.precision != MPFR_PRECISION_BITS
            or context.round != gmpy2.RoundToNearest
            or context.emin != MPFR_EMIN
            or context.emax != MPFR_EMAX
            or context.subnormalize
            or context.trap_underflow
            or context.trap_overflow
            or context.trap_inexact
            or context.trap_invalid
            or context.trap_erange
            or context.trap_divzero
            or context.underflow
            or context.overflow
            or context.inexact
            or context.invalid
            or context.erange
            or context.divzero
            or context.allow_complex
            or context.rational_division
            or context.allow_release_gil
        ):
            raise ScalarMaterializationError("scalar_mpfr_context_installation_failed")
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
    observed = {
        name: bool(getattr(context, name))
        for name in (
            "underflow",
            "overflow",
            "inexact",
            "invalid",
            "erange",
            "divzero",
        )
    }
    bad = tuple(
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if observed[name]
    )
    if bad:
        raise ScalarMaterializationError(
            "scalar_mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )


def _finish(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise ScalarMaterializationError("scalar_mpfr_nonfinite", operation)
    if gmpy2.is_zero(value):
        return _set_positive_zero(context, f"{operation}.canonical_zero")
    return value


def _set_positive_zero(
    context: gmpy2.context, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, operation)
    if context.inexact or not gmpy2.is_zero(result) or gmpy2.is_signed(result):
        raise ScalarMaterializationError("scalar_set_positive_zero_failed", operation)
    return result


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise ScalarMaterializationError("scalar_set_d_inexact", operation)
    return result


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise ScalarMaterializationError("scalar_set_ui_inexact", operation)
    return result


def _set_si(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise ScalarMaterializationError("scalar_set_si_inexact", operation)
    return result


def _binary(
    context: gmpy2.context,
    operation: str,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    kind: str,
) -> gmpy2.mpfr:
    if kind == "div" and gmpy2.is_zero(right):
        raise ScalarMaterializationError("scalar_mpfr_division_by_zero", operation)
    context.clear_flags()
    if kind == "mul":
        value = gmpy2.mul(left, right)
    elif kind == "div":
        value = gmpy2.div(left, right)
    elif kind == "sub":
        value = gmpy2.sub(left, right)
    elif kind == "add":
        value = gmpy2.add(left, right)
    else:
        raise ScalarMaterializationError("scalar_internal_binary_kind_invalid", kind)
    return _finish(context, value, operation)


def _sqrt(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    if value < 0:
        raise ScalarMaterializationError("scalar_mpfr_sqrt_domain_invalid", operation)
    context.clear_flags()
    return _finish(context, gmpy2.sqrt(value), operation)


def _const_pi(context: gmpy2.context, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.const_pi(MPFR_PRECISION_BITS), operation)


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise ScalarMaterializationError("scalar_output_nonfinite", operation)
    if result == 0.0:
        result = 0.0
    if _negative_zero(result):
        raise ScalarMaterializationError("scalar_output_negative_zero", operation)
    return result


def materialize_scalar_diagnostic(value: object) -> FrozenScalarMaterializationResult:
    """Run the exact nine-scalar graph on structurally gated immutable inputs."""

    with _owned_mpfr256_context() as context:
        nu, vc, c_value = _validate_input(value)
        nu_mp = _set_d(context, nu, "set_nu")
        vc_mp = _set_d(context, vc, "set_Vc")
        c_mp = _set_d(context, c_value, "set_C")
        minus_two = _set_si(context, -2, "set_minus_two")
        minus_two_nu = _binary(context, "mul_minus_two_nu", minus_two, nu_mp, "mul")
        kappa_mp = _sqrt(context, minus_two_nu, "sqrt_kappa")
        c_over_kappa = _binary(context, "div_C_over_kappa", c_mp, kappa_mp, "div")
        one = _set_ui(context, 1, "set_one")
        sigma_mp = _binary(context, "sub_sigma", c_over_kappa, one, "sub")
        four = _set_ui(context, 4, "set_four")
        pi_mp = _const_pi(context, "const_pi")
        four_pi = _binary(context, "mul_four_pi", four, pi_mp, "mul")
        n0_mp = _binary(context, "mul_N0", four_pi, c_mp, "mul")
        thirty_two = _set_ui(context, 32, "set_thirty_two")
        lambda_mp = _binary(context, "div_lambda", one, thirty_two, "div")
        lambda_squared_mp = _binary(
            context, "mul_lambda_squared", lambda_mp, lambda_mp, "mul"
        )
        nu_star_mp = _binary(
            context, "mul_nu_star", lambda_squared_mp, nu_mp, "mul"
        )
        two = _set_ui(context, 2, "set_two")
        two_nu_star = _binary(context, "mul_two_nu_star", two, nu_star_mp, "mul")
        w_squared = _binary(context, "add_w_squared", one, two_nu_star, "add")
        w_seed_mp = _sqrt(context, w_squared, "sqrt_w_seed")
        named = (
            ("nu0", nu_mp),
            ("Vc", vc_mp),
            ("N0", n0_mp),
            ("C", c_mp),
            ("kappa", kappa_mp),
            ("sigma", sigma_mp),
            ("lambda", lambda_mp),
            ("nu_star", nu_star_mp),
            ("wSeed", w_seed_mp),
        )
        scalar_values = tuple(
            _get_d(context, scalar, f"get_d_{name}") for name, scalar in named
        )
    scalar_buffers = tuple(struct.pack("<d", scalar) for scalar in scalar_values)
    if len({id(buffer) for buffer in scalar_buffers}) != len(SCALAR_ORDER):
        raise ScalarMaterializationError("scalar_output_buffer_alias")
    aggregate = b"".join(scalar_buffers)
    if len(aggregate) != 72 or any(len(buffer) != 8 for buffer in scalar_buffers):
        raise ScalarMaterializationError("scalar_output_buffer_shape_invalid")
    return FrozenScalarMaterializationResult(
        scalar_order=SCALAR_ORDER,
        scalar_values=scalar_values,
        scalar_buffers_f64le=scalar_buffers,
        aggregate_f64le=aggregate,
        aggregate_f64le_sha256=hashlib.sha256(aggregate).hexdigest(),
        projected_l2_archive_f64le_sha256=(
            value.projected_l2_archive_f64le_sha256
        ),
        accepted_tail_state_f64le_sha256=(
            value.accepted_tail_state_f64le_sha256
        ),
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
        materialization_version=SCALAR_MATERIALIZATION_VERSION,
        materialization_graph=SCALAR_OPERATION_GRAPH,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
        set_d_count=3,
        set_si_count=1,
        set_ui_count=4,
        multiply_count=6,
        divide_count=2,
        subtract_count=1,
        add_count=1,
        square_root_count=2,
        const_pi_count=1,
        terminal_get_d_count=9,
    )


if (
    SCALAR_ORDER != ("nu0", "Vc", "N0", "C", "kappa", "sigma", "lambda", "nu_star", "wSeed")
    or MPFR_PRECISION_BITS != 256
    or MPFR_ROUNDING_MODE != "MPFR_RNDN"
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_scalar_materialization_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "CORE_NODE_COUNT",
    "FrozenScalarMaterializationInput",
    "FrozenScalarMaterializationResult",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "SCALAR_MATERIALIZATION_VERSION",
    "SCALAR_OPERATION_GRAPH",
    "SCALAR_ORDER",
    "ScalarMaterializationError",
    "materialize_scalar_diagnostic",
]
