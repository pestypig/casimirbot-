"""Frozen MPFR256 tail-coefficient materialization diagnostic.

This module implements only the terminal ``h[0..31]`` then ``q[0..31]``
coefficient barrier from the frozen primary-numerics policy.  It deliberately
does not authenticate a tail-Newton acceptance receipt, publish files, confer
replay authority, or promote any Theory Graph lamp.
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


TAIL_COEFFICIENT_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_tail_coefficients/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
TAIL_ORDER: Final[int] = 32
TAIL_STATE_COUNT: Final[int] = 65
H_OFFSET: Final[int] = 1
Q_OFFSET: Final[int] = 33
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
TAIL_COEFFICIENT_OPERATION_GRAPH: Final[str] = (
    "enter_complete_owned_MPFR256_RNDN_context;validate_exact_tuple_65_and_C_"
    "positive;for_h_0_through_31_then_q_0_through_31:set_d_from_exact_f64_"
    "bits_then_if_zero_set_positive_zero_exactly_once_then_exactly_one_terminal_"
    "get_d;write_two_fresh_nonaliased_f64le_buffers;no_binary64_arithmetic_or_"
    "direct_bit_copy"
)


class TailCoefficientError(ValueError):
    """Fail-closed materialization error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenTailCoefficientPayloads:
    h: tuple[float, ...]
    q: tuple[float, ...]
    h_f64le: bytes
    q_f64le: bytes
    h_f64le_sha256: str
    q_f64le_sha256: str
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    materialization_version: str
    materialization_graph: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    observed_gmpy2_version: str
    observed_mpfr_version: str
    set_d_count: int
    get_d_count: int
    source_tail_acceptance_authenticated: bool = False
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


AUTHORITY_LOCKS = MappingProxyType(
    {
        "source_tail_acceptance_authenticated": False,
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
        raise TailCoefficientError("tail_coefficient_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise TailCoefficientError("tail_coefficient_binary64_nonfinite", detail)
    if _negative_zero(value):
        raise TailCoefficientError("tail_coefficient_binary64_negative_zero", detail)
    return value


def _validate_state(value: object) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != TAIL_STATE_COUNT:
        raise TailCoefficientError("tail_coefficient_state_shape_invalid")
    state = tuple(
        _validate_f64(item, f"state[{index}]")
        for index, item in enumerate(value)
    )
    if not state[0] > 0.0:
        raise TailCoefficientError("tail_coefficient_C_domain_invalid")
    return state


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
            raise TailCoefficientError("tail_coefficient_mpfr_context_installation_failed")
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
        raise TailCoefficientError(
            "tail_coefficient_mpfr_exceptional_flag",
            f"{operation}:{','.join(bad)}",
        )


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    _check_flags(context, operation)
    if context.inexact:
        raise TailCoefficientError("tail_coefficient_set_d_inexact", operation)
    if not gmpy2.is_finite(result):
        raise TailCoefficientError("tail_coefficient_mpfr_nonfinite", operation)
    if gmpy2.is_zero(result):
        return _set_positive_zero(context, f"{operation}.canonical_zero")
    return result


def _set_positive_zero(
    context: gmpy2.context, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, operation)
    if context.inexact or not gmpy2.is_zero(result) or gmpy2.is_signed(result):
        raise TailCoefficientError("tail_coefficient_set_positive_zero_failed", operation)
    return result


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise TailCoefficientError("tail_coefficient_output_nonfinite", operation)
    if result == 0.0:
        result = 0.0
    if _negative_zero(result):
        raise TailCoefficientError("tail_coefficient_output_negative_zero", operation)
    return result


def _materialize_group(
    context: gmpy2.context,
    state: tuple[float, ...],
    *,
    label: str,
    offset: int,
) -> tuple[float, ...]:
    output: list[float] = []
    for index in range(TAIL_ORDER):
        coefficient = _set_d(
            context,
            state[offset + index],
            f"{label}[{index}].set_d",
        )
        output.append(
            _get_d(context, coefficient, f"{label}[{index}].get_d")
        )
    return tuple(output)


def materialize_tail_coefficient_diagnostic(
    tail_state: object,
) -> FrozenTailCoefficientPayloads:
    """Materialize the frozen terminal tail coefficient barriers.

    The result is calculation evidence only.  The caller must still supply an
    authenticated accepted-state receipt and the run/output publication layer.
    """

    with _owned_mpfr256_context() as context:
        state = _validate_state(tail_state)
        h = _materialize_group(context, state, label="h", offset=H_OFFSET)
        q = _materialize_group(context, state, label="q", offset=Q_OFFSET)
    h_f64le = struct.pack("<32d", *h)
    q_f64le = struct.pack("<32d", *q)
    if h_f64le is q_f64le or len(h_f64le) != 256 or len(q_f64le) != 256:
        raise TailCoefficientError("tail_coefficient_output_buffer_invalid")
    return FrozenTailCoefficientPayloads(
        h=h,
        q=q,
        h_f64le=h_f64le,
        q_f64le=q_f64le,
        h_f64le_sha256=hashlib.sha256(h_f64le).hexdigest(),
        q_f64le_sha256=hashlib.sha256(q_f64le).hexdigest(),
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        materialization_version=TAIL_COEFFICIENT_VERSION,
        materialization_graph=TAIL_COEFFICIENT_OPERATION_GRAPH,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
        set_d_count=2 * TAIL_ORDER,
        get_d_count=2 * TAIL_ORDER,
    )


if (
    TAIL_STATE_COUNT != 1 + 2 * TAIL_ORDER
    or H_OFFSET != 1
    or Q_OFFSET != 1 + TAIL_ORDER
    or MPFR_PRECISION_BITS != 256
    or MPFR_ROUNDING_MODE != "MPFR_RNDN"
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_tail_coefficient_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "FrozenTailCoefficientPayloads",
    "H_OFFSET",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "Q_OFFSET",
    "TAIL_COEFFICIENT_OPERATION_GRAPH",
    "TAIL_COEFFICIENT_VERSION",
    "TAIL_ORDER",
    "TAIL_STATE_COUNT",
    "TailCoefficientError",
    "materialize_tail_coefficient_diagnostic",
]
