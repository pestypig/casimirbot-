"""Frozen MPFR256 DCT-I materializer for projected spherical core states.

This module implements only the primary-policy coefficient transform for the
immutable projected L0/L1/L2 core archives.  It does not solve, execute, accept,
or materialize a candidate artifact and grants no scientific, replay, physical,
propulsion, or transport authority.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import math
import struct
from types import MappingProxyType
from typing import Final, Iterator

import gmpy2


CORE_DCT_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_core_dct_i/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
CORE_LEVELS: Final[tuple[tuple[str, int], ...]] = (
    ("L0", 64),
    ("L1", 96),
    ("L2", 128),
)
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

DCT_I_OPERATION_GRAPH: Final[str] = (
    "const_pi_once;set_ui_denominator_N_minus_1_then_two;for_n_increasing_set_"
    "n_cn_sum_zero;for_m_increasing_set_m_then_mul_mn_then_mul_pi_mn_then_div_"
    "theta_then_cos;set_d_f_from_q_N_minus_1_minus_m_then_mul_f_cos_then_set_"
    "cm_then_div_term_then_add_sum_next_then_copy_sum;after_m_mul_two_sum_then_"
    "div_denominator_then_div_cn_then_exactly_one_terminal_get_d"
)
DCT_I_POLYNOMIAL_CONVENTION: Final[str] = (
    "q(rho)=sum_n_0_to_N_minus_1_a[n]*T_n(2*rho-1);"
    "no_implicit_endpoint_halves"
)
DCT_I_EXACT_FORMULA: Final[str] = (
    "a[n]=2/((N-1)*c_n)*sum_m_0_to_N_minus_1("
    "q[N-1-m]*cos(pi*m*n/(N-1))/c_m);c_0=c_N_minus_1=2_else_1"
)
DCT_I_OUTPUT_ORDER: Final[str] = (
    "level_L0_L1_L2_then_field_u_V_then_coefficient_n_increasing"
)


class CoreDctError(ValueError):
    """Fail-closed DCT boundary error with a deterministic code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenProjectedCoreState:
    level_id: str
    node_count: int
    state: tuple[float, ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    projection_gate_passed: bool
    immutable_projected_archive: bool
    raw_accepted_state_used: bool = False
    primary_numerics_semantic_authority: bool = False
    fixture_runtime_authority: bool = False
    projection_acceptance_authority: bool = False
    materialization_authority: bool = False
    source_manifest_bound: bool = False
    toolchain_manifest_bound: bool = False
    executable_bound: bool = False
    runtime_manifest_bound: bool = False
    scientific_preseal_present: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    candidate_output_materialized: bool = False
    output_present: bool = False
    output_accepted: bool = False
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


@dataclass(frozen=True, slots=True)
class FrozenCoreDctLevelResult:
    level_id: str
    node_count: int
    u_coefficients: tuple[float, ...]
    V_coefficients: tuple[float, ...]


@dataclass(frozen=True, slots=True)
class FrozenCoreDctOperationCounts:
    transform_count: int
    const_pi_count: int
    set_ui_count: int
    set_d_count: int
    multiply_count: int
    divide_count: int
    cosine_count: int
    add_count: int
    copy_count: int
    terminal_get_d_count: int


@dataclass(frozen=True, slots=True)
class FrozenCoreDctResult:
    levels: tuple[FrozenCoreDctLevelResult, ...]
    operation_counts: FrozenCoreDctOperationCounts
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    projected_archives_validated: bool = True
    literal_operation_graph_used: bool = True
    no_implicit_endpoint_halves: bool = True
    raw_accepted_state_used: bool = False
    alternate_transform_used: bool = False
    binary64_intermediate_used: bool = False
    primary_numerics_semantic_authority: bool = False
    fixture_runtime_authority: bool = False
    projection_acceptance_authority: bool = False
    materialization_authority: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
    source_manifest_bound: bool = False
    toolchain_manifest_bound: bool = False
    executable_bound: bool = False
    runtime_manifest_bound: bool = False
    scientific_preseal_present: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    candidate_output_materialized: bool = False
    output_present: bool = False
    output_accepted: bool = False
    seed_accepted: bool = False
    branch_accepted: bool = False
    nondegeneracy_accepted: bool = False
    replay_authority: bool = False
    independent_agreement: bool = False
    semiclassical_stress_noise_lamp: bool = False
    semiclassical_constraint_algebra_lamp: bool = False
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
        "projectionAcceptanceAuthority": False,
        "materializationAuthority": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "executableAuthority": False,
        "runtimeAuthority": False,
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
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "diagnosticPass": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)


_PROJECTED_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "raw_accepted_state_used",
    "primary_numerics_semantic_authority",
    "fixture_runtime_authority",
    "projection_acceptance_authority",
    "materialization_authority",
    "source_manifest_bound",
    "toolchain_manifest_bound",
    "executable_bound",
    "runtime_manifest_bound",
    "scientific_preseal_present",
    "candidate_execution_authorized",
    "candidate_executed",
    "candidate_output_materialized",
    "output_present",
    "output_accepted",
    "seed_accepted",
    "branch_accepted",
    "nondegeneracy_accepted",
    "replay_authority",
    "independent_agreement",
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)


@dataclass(slots=True)
class _MutableOperationCounts:
    transform_count: int = 0
    const_pi_count: int = 0
    set_ui_count: int = 0
    set_d_count: int = 0
    multiply_count: int = 0
    divide_count: int = 0
    cosine_count: int = 0
    add_count: int = 0
    copy_count: int = 0
    terminal_get_d_count: int = 0


def _check_policy_binding(sha256: object, canonical_size_bytes: object) -> None:
    if type(sha256) is not str or sha256 != PRIMARY_NUMERICS_POLICY_SHA256:
        raise CoreDctError("primary_numerics_policy_binding_mismatch", "sha256")
    if (
        type(canonical_size_bytes) is not int
        or canonical_size_bytes != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise CoreDctError(
            "primary_numerics_policy_binding_mismatch", "canonical_size_bytes"
        )


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise CoreDctError("core_dct_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise CoreDctError("core_dct_nonfinite_input", detail)
    if _negative_zero(value):
        raise CoreDctError("core_dct_negative_zero_input", detail)
    return 0.0 if value == 0.0 else value


def _validate_projected_states(
    projected_states: object,
) -> tuple[tuple[str, int, tuple[float, ...]], ...]:
    if type(projected_states) is not tuple:
        raise CoreDctError(
            "core_dct_projected_states_type_invalid",
            type(projected_states).__name__,
        )
    if len(projected_states) != len(CORE_LEVELS):
        raise CoreDctError(
            "core_dct_projected_states_length_invalid", str(len(projected_states))
        )
    validated: list[tuple[str, int, tuple[float, ...]]] = []
    for level_index, ((expected_id, expected_count), record) in enumerate(
        zip(CORE_LEVELS, projected_states, strict=True)
    ):
        if type(record) is not FrozenProjectedCoreState:
            raise CoreDctError(
                "core_dct_projected_state_type_invalid", str(level_index)
            )
        if type(record.level_id) is not str or record.level_id != expected_id:
            raise CoreDctError("core_dct_level_order_invalid", str(level_index))
        if type(record.node_count) is not int or record.node_count != expected_count:
            raise CoreDctError("core_dct_node_count_invalid", expected_id)
        _check_policy_binding(
            record.primary_numerics_policy_sha256,
            record.primary_numerics_policy_canonical_size_bytes,
        )
        if record.projection_gate_passed is not True:
            raise CoreDctError("core_dct_projection_gate_missing", expected_id)
        if record.immutable_projected_archive is not True:
            raise CoreDctError("core_dct_projected_archive_not_immutable", expected_id)
        for field in _PROJECTED_FALSE_FIELDS:
            if getattr(record, field, None) is not False:
                raise CoreDctError("core_dct_input_authority_invalid", field)
        if type(record.state) is not tuple:
            raise CoreDctError("core_dct_state_type_invalid", expected_id)
        expected_length = 2 * expected_count + 1
        if len(record.state) != expected_length:
            raise CoreDctError(
                "core_dct_state_length_invalid",
                f"{expected_id}:{len(record.state)}!={expected_length}",
            )
        state = tuple(
            _validate_f64(value, f"{expected_id}.state[{index}]")
            for index, value in enumerate(record.state)
        )
        for endpoint in (expected_count - 1, 2 * expected_count - 1):
            if struct.pack("<d", state[endpoint]) != bytes(8):
                raise CoreDctError(
                    "core_dct_projected_endpoint_not_positive_zero",
                    f"{expected_id}:{endpoint}",
                )
        validated.append((expected_id, expected_count, state))
    return tuple(validated)


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
            or context.allow_complex
            or context.rational_division
            or context.allow_release_gil
        ):
            raise CoreDctError("mpfr_context_installation_failed", "root")
        context.clear_flags()
        if any(
            bool(getattr(context, name))
            for name in (
                "underflow",
                "overflow",
                "inexact",
                "invalid",
                "erange",
                "divzero",
            )
        ):
            raise CoreDctError("mpfr_context_flag_clear_failed", "root")
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
    bad = tuple(
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if bool(getattr(context, name))
    )
    if bad:
        raise CoreDctError(
            "mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )


def _positive_zero(context: gmpy2.context) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, "set_positive_zero")
    if not gmpy2.is_zero(result) or gmpy2.is_signed(result):
        raise CoreDctError("mpfr_positive_zero_failure", "root")
    return result


def _finish(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise CoreDctError("mpfr_nonfinite", operation)
    return _positive_zero(context) if gmpy2.is_zero(value) else value


def _set_ui(
    context: gmpy2.context,
    value: int,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise CoreDctError("set_ui_domain_invalid", operation)
    counts.set_ui_count += 1
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise CoreDctError("set_ui_inexact", operation)
    return result


def _set_d(
    context: gmpy2.context,
    value: float,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    counts.set_d_count += 1
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise CoreDctError("set_d_inexact", operation)
    return result


def _copy(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    counts.copy_count += 1
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise CoreDctError("copy_inexact", operation)
    return result


def _const_pi(
    context: gmpy2.context,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    counts.const_pi_count += 1
    context.clear_flags()
    return _finish(context, gmpy2.const_pi(), operation)


def _mul(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    counts.multiply_count += 1
    context.clear_flags()
    return _finish(context, gmpy2.mul(left, right), operation)


def _div(
    context: gmpy2.context,
    numerator: gmpy2.mpfr,
    denominator: gmpy2.mpfr,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    if gmpy2.is_zero(denominator):
        raise CoreDctError("mpfr_division_by_zero", operation)
    counts.divide_count += 1
    context.clear_flags()
    return _finish(context, gmpy2.div(numerator, denominator), operation)


def _cos(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    counts.cosine_count += 1
    context.clear_flags()
    return _finish(context, gmpy2.cos(value), operation)


def _add(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
    counts: _MutableOperationCounts,
) -> gmpy2.mpfr:
    counts.add_count += 1
    context.clear_flags()
    return _finish(context, gmpy2.add(left, right), operation)


def _get_d(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
    counts: _MutableOperationCounts,
) -> float:
    counts.terminal_get_d_count += 1
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise CoreDctError("binary64_nonfinite", operation)
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise CoreDctError("binary64_negative_zero", operation)
    return result


def _dct_i(
    context: gmpy2.context,
    values_in_rho_order: tuple[float, ...],
    label: str,
    counts: _MutableOperationCounts,
) -> tuple[float, ...]:
    count = len(values_in_rho_order)
    if count < 2:
        raise CoreDctError("core_dct_fixture_count_invalid", str(count))
    counts.transform_count += 1
    pi_value = _const_pi(context, f"{label}.const_pi", counts)
    denominator = _set_ui(context, count - 1, f"{label}.set_denominator", counts)
    two = _set_ui(context, 2, f"{label}.set_two", counts)
    coefficients: list[float] = []
    for coefficient_index in range(count):
        coefficient_index_mp = _set_ui(
            context,
            coefficient_index,
            f"{label}.n[{coefficient_index}].set_n",
            counts,
        )
        c_n = _set_ui(
            context,
            2 if coefficient_index in (0, count - 1) else 1,
            f"{label}.n[{coefficient_index}].set_cn",
            counts,
        )
        accumulator = _set_ui(
            context,
            0,
            f"{label}.n[{coefficient_index}].set_sum",
            counts,
        )
        for sample_index in range(count):
            sample_index_mp = _set_ui(
                context,
                sample_index,
                f"{label}.n[{coefficient_index}].m[{sample_index}].set_m",
                counts,
            )
            mn = _mul(
                context,
                sample_index_mp,
                coefficient_index_mp,
                f"{label}.n[{coefficient_index}].m[{sample_index}].mul_mn",
                counts,
            )
            pi_mn = _mul(
                context,
                pi_value,
                mn,
                f"{label}.n[{coefficient_index}].m[{sample_index}].mul_pi_mn",
                counts,
            )
            theta = _div(
                context,
                pi_mn,
                denominator,
                f"{label}.n[{coefficient_index}].m[{sample_index}].div_theta",
                counts,
            )
            cosine = _cos(
                context,
                theta,
                f"{label}.n[{coefficient_index}].m[{sample_index}].cos",
                counts,
            )
            f_value = _set_d(
                context,
                values_in_rho_order[count - 1 - sample_index],
                f"{label}.n[{coefficient_index}].m[{sample_index}].set_f",
                counts,
            )
            f_cos = _mul(
                context,
                f_value,
                cosine,
                f"{label}.n[{coefficient_index}].m[{sample_index}].mul_f_cos",
                counts,
            )
            c_m = _set_ui(
                context,
                2 if sample_index in (0, count - 1) else 1,
                f"{label}.n[{coefficient_index}].m[{sample_index}].set_cm",
                counts,
            )
            term = _div(
                context,
                f_cos,
                c_m,
                f"{label}.n[{coefficient_index}].m[{sample_index}].div_term",
                counts,
            )
            next_accumulator = _add(
                context,
                accumulator,
                term,
                f"{label}.n[{coefficient_index}].m[{sample_index}].add_sum",
                counts,
            )
            accumulator = _copy(
                context,
                next_accumulator,
                f"{label}.n[{coefficient_index}].m[{sample_index}].copy_sum",
                counts,
            )
        numerator = _mul(
            context,
            two,
            accumulator,
            f"{label}.n[{coefficient_index}].mul_numerator",
            counts,
        )
        after_grid = _div(
            context,
            numerator,
            denominator,
            f"{label}.n[{coefficient_index}].div_grid",
            counts,
        )
        coefficient = _div(
            context,
            after_grid,
            c_n,
            f"{label}.n[{coefficient_index}].div_cn",
            counts,
        )
        coefficients.append(
            _get_d(
                context,
                coefficient,
                f"{label}.n[{coefficient_index}].get_d",
                counts,
            )
        )
    return tuple(coefficients)


def _expected_operation_counts(
    levels: tuple[tuple[str, int], ...],
) -> FrozenCoreDctOperationCounts:
    transform_count = 2 * len(levels)
    const_pi_count = transform_count
    set_ui_count = 0
    set_d_count = 0
    multiply_count = 0
    divide_count = 0
    cosine_count = 0
    add_count = 0
    copy_count = 0
    terminal_get_d_count = 0
    for _level_id, count in levels:
        set_ui_count += 2 * (2 + 3 * count + 2 * count * count)
        set_d_count += 2 * count * count
        multiply_count += 2 * (3 * count * count + count)
        divide_count += 2 * (2 * count * count + 2 * count)
        cosine_count += 2 * count * count
        add_count += 2 * count * count
        copy_count += 2 * count * count
        terminal_get_d_count += 2 * count
    return FrozenCoreDctOperationCounts(
        transform_count=transform_count,
        const_pi_count=const_pi_count,
        set_ui_count=set_ui_count,
        set_d_count=set_d_count,
        multiply_count=multiply_count,
        divide_count=divide_count,
        cosine_count=cosine_count,
        add_count=add_count,
        copy_count=copy_count,
        terminal_get_d_count=terminal_get_d_count,
    )


def _freeze_counts(counts: _MutableOperationCounts) -> FrozenCoreDctOperationCounts:
    return FrozenCoreDctOperationCounts(
        transform_count=counts.transform_count,
        const_pi_count=counts.const_pi_count,
        set_ui_count=counts.set_ui_count,
        set_d_count=counts.set_d_count,
        multiply_count=counts.multiply_count,
        divide_count=counts.divide_count,
        cosine_count=counts.cosine_count,
        add_count=counts.add_count,
        copy_count=counts.copy_count,
        terminal_get_d_count=counts.terminal_get_d_count,
    )


def materialize_projected_core_dct(
    projected_states: tuple[FrozenProjectedCoreState, ...],
    *,
    primary_numerics_policy_sha256: str = PRIMARY_NUMERICS_POLICY_SHA256,
    primary_numerics_policy_canonical_size_bytes: int = (
        PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ),
) -> FrozenCoreDctResult:
    """Transform projected L0/L1/L2 u then V archives into DCT-I coefficients."""

    _check_policy_binding(
        primary_numerics_policy_sha256,
        primary_numerics_policy_canonical_size_bytes,
    )
    validated = _validate_projected_states(projected_states)
    counts = _MutableOperationCounts()
    level_results: list[FrozenCoreDctLevelResult] = []
    with _owned_mpfr256_context() as context:
        for level_id, node_count, state in validated:
            u_values = state[:node_count]
            V_values = state[node_count : 2 * node_count]
            u_coefficients = _dct_i(
                context, u_values, f"{level_id}.u", counts
            )
            V_coefficients = _dct_i(
                context, V_values, f"{level_id}.V", counts
            )
            level_results.append(
                FrozenCoreDctLevelResult(
                    level_id=level_id,
                    node_count=node_count,
                    u_coefficients=u_coefficients,
                    V_coefficients=V_coefficients,
                )
            )

    frozen_counts = _freeze_counts(counts)
    if frozen_counts != _expected_operation_counts(CORE_LEVELS):
        raise CoreDctError("core_dct_operation_count_invariant", "root")
    values = tuple(
        value
        for level in level_results
        for coefficients in (level.u_coefficients, level.V_coefficients)
        for value in coefficients
    )
    if any(not math.isfinite(value) or _negative_zero(value) for value in values):
        raise CoreDctError("core_dct_output_f64_invariant", "root")
    return FrozenCoreDctResult(
        levels=tuple(level_results),
        operation_counts=frozen_counts,
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
    or CORE_LEVELS != (("L0", 64), ("L1", 96), ("L2", 128))
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_core_dct_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "CORE_DCT_VERSION",
    "CORE_LEVELS",
    "CoreDctError",
    "DCT_I_EXACT_FORMULA",
    "DCT_I_OPERATION_GRAPH",
    "DCT_I_OUTPUT_ORDER",
    "DCT_I_POLYNOMIAL_CONVENTION",
    "FrozenCoreDctLevelResult",
    "FrozenCoreDctOperationCounts",
    "FrozenCoreDctResult",
    "FrozenProjectedCoreState",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "materialize_projected_core_dct",
]
