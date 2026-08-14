"""Frozen MPFR256 Lobatto differentiation primitive for the spherical seed.

This module implements only the primary-numerics node and differentiation
graph.  It does not choose a level, solve an equation, materialize a candidate
artifact, or confer source, fixture, runtime, execution, replay, or scientific
authority.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import math
import struct
from types import MappingProxyType
from typing import Final, Iterator

import gmpy2


SPECTRAL_PRIMITIVE_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_spectral/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
PRIMARY_NUMERICS_POLICY_SHA256_DOMAIN: Final[str] = (
    "nhm2-spherical-boson-star-newtonian-seed-primary-numerics/v1\n"
)

ADMITTED_NODE_COUNTS: Final[tuple[int, ...]] = (64, 96, 128, 256)
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

NODE_OPERATION_GRAPH: Final[str] = (
    "j_increasing;endpoints_set_ui_positive_zero_or_one;interior_const_pi_then_"
    "mul(pi,j)_div(N-1)_cos_sub(1,cos)_div(2);one_get_d_RNDN_per_node"
)
FIRST_DERIVATIVE_OPERATION_GRAPH: Final[str] = (
    "weights=(-1)^j*(endpoint?1/2:1)_exact_MPFR;all_offdiagonal_i_then_j_"
    "sub(rho_i,rho_j)_mul(w_i,difference)_div(w_j,denominator);then_each_"
    "diagonal_i_sum_j_increasing_excluding_i_by_add_then_set_and_negate;after_"
    "the_complete_unrounded_D_one_get_d_RNDN_per_entry_row_major"
)
SECOND_DERIVATIVE_OPERATION_GRAPH: Final[str] = (
    "for_i_then_j_set_ui(acc,0);for_k_increasing_mul(unrounded_D_i_k,"
    "unrounded_D_k_j)_add(acc,term)_set(acc,next);set(D2_i_j,acc);one_get_d_"
    "RNDN_immediately_for_that_entry"
)


class SpectralPrimitiveError(ValueError):
    """Fail-closed typed error for this bounded primitive."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenLobattoSpectralPrimitive:
    node_count: int
    rho: tuple[float, ...]
    barycentric_weights: tuple[float, ...]
    first_derivative: tuple[tuple[float, ...], ...]
    second_derivative: tuple[tuple[float, ...], ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    primary_numerics_semantic_authority: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
    node_count_selected_for_candidate: bool = False
    gauss_legendre_fixture_bound: bool = False
    source_manifest_bound: bool = False
    toolchain_manifest_bound: bool = False
    executable_bound: bool = False
    runtime_manifest_bound: bool = False
    scientific_preseal_present: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    output_present: bool = False
    output_accepted: bool = False
    candidate_output_materialized: bool = False
    seed_accepted: bool = False
    branch_accepted: bool = False
    nondegeneracy_accepted: bool = False
    replay_authority: bool = False
    independent_agreement: bool = False
    diagnostic_pass_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "primaryNumericsSemanticAuthority": False,
        "fixtureRuntimeAuthority": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "nondegeneracyAccepted": False,
        "runReplayAccepted": False,
        "independentAgreementAccepted": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "executableAuthority": False,
        "runtimeAuthority": False,
        "scientificPresealAuthority": False,
        "executionAuthority": False,
        "candidateOutputAuthority": False,
        "seedAcceptanceAuthority": False,
        "replayAuthority": False,
        "independentAgreement": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "diagnosticPass": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _check_policy_binding(sha256: object, canonical_size_bytes: object) -> None:
    if type(sha256) is not str or sha256 != PRIMARY_NUMERICS_POLICY_SHA256:
        raise SpectralPrimitiveError(
            "primary_numerics_policy_binding_mismatch", "sha256"
        )
    if (
        type(canonical_size_bytes) is not int
        or canonical_size_bytes != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise SpectralPrimitiveError(
            "primary_numerics_policy_binding_mismatch", "canonical_size_bytes"
        )


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
            or context.allow_complex
            or context.rational_division
            or context.allow_release_gil
        ):
            raise SpectralPrimitiveError("mpfr_context_installation_failed", "root")
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
    bad = tuple(
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
    if bad:
        raise SpectralPrimitiveError(
            "mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )


def _positive_zero(context: gmpy2.context) -> gmpy2.mpfr:
    context.clear_flags()
    value = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, "set_positive_zero")
    if not gmpy2.is_zero(value) or gmpy2.is_signed(value):
        raise SpectralPrimitiveError("mpfr_positive_zero_failure", "root")
    return value


def _finish(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise SpectralPrimitiveError("mpfr_nonfinite", operation)
    return _positive_zero(context) if gmpy2.is_zero(value) else value


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise SpectralPrimitiveError("set_ui_domain_invalid", operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    result = _finish(context, result, operation)
    if context.inexact:
        raise SpectralPrimitiveError("set_ui_inexact", operation)
    return result


def _copy(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    result = _finish(context, result, operation)
    if context.inexact:
        raise SpectralPrimitiveError("set_inexact", operation)
    return result


def _const_pi(context: gmpy2.context, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.const_pi(), operation)


def _add(
    context: gmpy2.context, left: gmpy2.mpfr, right: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.add(left, right), operation)


def _sub(
    context: gmpy2.context, left: gmpy2.mpfr, right: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.sub(left, right), operation)


def _mul(
    context: gmpy2.context, left: gmpy2.mpfr, right: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.mul(left, right), operation)


def _div(
    context: gmpy2.context, numerator: gmpy2.mpfr, denominator: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    if gmpy2.is_zero(denominator):
        raise SpectralPrimitiveError("mpfr_division_by_zero", operation)
    context.clear_flags()
    return _finish(context, gmpy2.div(numerator, denominator), operation)


def _neg(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, -value, operation)


def _cos(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.cos(value), operation)


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise SpectralPrimitiveError("binary64_nonfinite", operation)
    if result == 0.0:
        result = 0.0
    if _negative_zero(result):
        raise SpectralPrimitiveError("binary64_negative_zero", operation)
    return result


def _nodes(
    context: gmpy2.context, count: int
) -> tuple[tuple[gmpy2.mpfr, ...], tuple[float, ...]]:
    nodes_mp: list[gmpy2.mpfr] = []
    nodes_64: list[float] = []
    for index in range(count):
        index_mp = _set_ui(context, index, "node.set_j")
        denominator = _set_ui(context, count - 1, "node.set_denominator")
        if index == 0:
            rho = _set_ui(context, 0, "node.set_origin")
        elif index == count - 1:
            rho = _set_ui(context, 1, "node.set_infinity")
        else:
            pi_value = _const_pi(context, "node.const_pi")
            pi_times_j = _mul(context, pi_value, index_mp, "node.mul_pi_j")
            theta = _div(context, pi_times_j, denominator, "node.div_theta")
            cosine = _cos(context, theta, "node.cos")
            one = _set_ui(context, 1, "node.set_one")
            difference = _sub(context, one, cosine, "node.sub_one_cos")
            two = _set_ui(context, 2, "node.set_two")
            rho = _div(context, difference, two, "node.div_two")
        nodes_mp.append(rho)
        nodes_64.append(_get_d(context, rho, "node.get_d"))
    return tuple(nodes_mp), tuple(nodes_64)


def _weights(
    context: gmpy2.context, count: int
) -> tuple[gmpy2.mpfr, ...]:
    output: list[gmpy2.mpfr] = []
    for index in range(count):
        weight = _set_ui(context, 1, "weight.set_one")
        if index in (0, count - 1):
            two = _set_ui(context, 2, "weight.set_two")
            weight = _div(context, weight, two, "weight.div_two")
        if index % 2:
            weight = _neg(context, weight, "weight.negate_odd")
        output.append(weight)
    return tuple(output)


def _first_derivative(
    context: gmpy2.context,
    nodes: tuple[gmpy2.mpfr, ...],
    weights: tuple[gmpy2.mpfr, ...],
) -> tuple[tuple[tuple[gmpy2.mpfr, ...], ...], tuple[tuple[float, ...], ...]]:
    count = len(nodes)
    matrix: list[list[gmpy2.mpfr]] = [
        [_positive_zero(context) for _ in range(count)] for _ in range(count)
    ]
    for row in range(count):
        for column in range(count):
            if row == column:
                continue
            difference = _sub(
                context, nodes[row], nodes[column], "D.sub_node_difference"
            )
            denominator = _mul(
                context, weights[row], difference, "D.mul_denominator"
            )
            matrix[row][column] = _div(
                context, weights[column], denominator, "D.div_offdiagonal"
            )
    for row in range(count):
        accumulator = _set_ui(context, 0, "D.diagonal_set_acc")
        for column in range(count):
            if row == column:
                continue
            next_accumulator = _add(
                context,
                accumulator,
                matrix[row][column],
                "D.diagonal_add",
            )
            accumulator = _copy(context, next_accumulator, "D.diagonal_set")
        matrix[row][row] = _neg(context, accumulator, "D.diagonal_negate")
    frozen_mp = tuple(tuple(row) for row in matrix)
    frozen_64 = tuple(
        tuple(_get_d(context, entry, "D.get_d_row_major") for entry in row)
        for row in frozen_mp
    )
    return frozen_mp, frozen_64


def _second_derivative(
    context: gmpy2.context,
    first: tuple[tuple[gmpy2.mpfr, ...], ...],
) -> tuple[tuple[float, ...], ...]:
    count = len(first)
    rows: list[tuple[float, ...]] = []
    for row in range(count):
        output_row: list[float] = []
        for column in range(count):
            accumulator = _set_ui(context, 0, "D2.set_acc")
            for inner in range(count):
                term = _mul(
                    context,
                    first[row][inner],
                    first[inner][column],
                    "D2.mul_term",
                )
                next_accumulator = _add(
                    context, accumulator, term, "D2.add_term"
                )
                accumulator = _copy(context, next_accumulator, "D2.set_acc_next")
            entry = _copy(context, accumulator, "D2.set_entry")
            output_row.append(_get_d(context, entry, "D2.get_d_entry"))
        rows.append(tuple(output_row))
    return tuple(rows)


def _validate_result(
    *,
    count: int,
    rho: tuple[float, ...],
    weights: tuple[float, ...],
    first: tuple[tuple[float, ...], ...],
    second: tuple[tuple[float, ...], ...],
) -> None:
    if (
        len(rho) != count
        or len(weights) != count
        or len(first) != count
        or len(second) != count
        or any(len(row) != count for row in first)
        or any(len(row) != count for row in second)
    ):
        raise SpectralPrimitiveError("spectral_dimension_invariant", str(count))
    if struct.pack("<d", rho[0]) != bytes(8) or rho[-1] != 1.0:
        raise SpectralPrimitiveError("spectral_endpoint_invariant", str(count))
    if any(not rho[index] > rho[index - 1] for index in range(1, count)):
        raise SpectralPrimitiveError("spectral_node_order_invariant", str(count))
    values = (*rho, *weights, *(item for row in first for item in row), *(item for row in second for item in row))
    if any(not math.isfinite(value) or _negative_zero(value) for value in values):
        raise SpectralPrimitiveError("spectral_f64_invariant", str(count))


def generate_lobatto_spectral_primitive(
    node_count: int,
    *,
    primary_numerics_policy_sha256: str = PRIMARY_NUMERICS_POLICY_SHA256,
    primary_numerics_policy_canonical_size_bytes: int = PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
) -> FrozenLobattoSpectralPrimitive:
    """Build one unselected frozen spectral primitive under an owned context."""

    _check_policy_binding(
        primary_numerics_policy_sha256,
        primary_numerics_policy_canonical_size_bytes,
    )
    if type(node_count) is not int or node_count not in ADMITTED_NODE_COUNTS:
        raise SpectralPrimitiveError(
            "spectral_node_count_invalid", repr(node_count)
        )
    with _owned_mpfr256_context() as context:
        nodes_mp, rho = _nodes(context, node_count)
        weights_mp = _weights(context, node_count)
        weights = tuple(
            _get_d(context, value, "weight.get_d") for value in weights_mp
        )
        first_mp, first = _first_derivative(context, nodes_mp, weights_mp)
        second = _second_derivative(context, first_mp)
    _validate_result(
        count=node_count,
        rho=rho,
        weights=weights,
        first=first,
        second=second,
    )
    return FrozenLobattoSpectralPrimitive(
        node_count=node_count,
        rho=rho,
        barycentric_weights=weights,
        first_derivative=first,
        second_derivative=second,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        mpfr_emin=MPFR_EMIN,
        mpfr_emax=MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )


if (
    len(PRIMARY_NUMERICS_POLICY_SHA256) != 64
    or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != 80_055
    or ADMITTED_NODE_COUNTS != (64, 96, 128, 256)
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_spectral_invariant")


__all__ = [
    "ADMITTED_NODE_COUNTS",
    "AUTHORITY_LOCKS",
    "FIRST_DERIVATIVE_OPERATION_GRAPH",
    "FrozenLobattoSpectralPrimitive",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "NODE_OPERATION_GRAPH",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRIMARY_NUMERICS_POLICY_SHA256_DOMAIN",
    "SECOND_DERIVATIVE_OPERATION_GRAPH",
    "SPECTRAL_PRIMITIVE_VERSION",
    "SpectralPrimitiveError",
    "generate_lobatto_spectral_primitive",
]
