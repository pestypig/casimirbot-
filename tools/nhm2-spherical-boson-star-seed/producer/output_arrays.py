"""Frozen twenty-role MPFR256 output-array materializer.

This module implements a bounded diagnostic reference for the array portion of
the Stage-2 primary-numerics
output graph: four node levels in ``L0,L1,L2,AUDIT`` order and, at each
level, ``rho``, two base fields, and two scaled target fields.  It accepts
only immutable projected archives plus the final join/tail barriers.  Those
inputs are diagnostic structures rather than authenticated run receipts, so
the result deliberately carries no execution, replay, lamp, or physical
authority.  Python/gmpy2 containers do not satisfy the frozen native
``mpfr_t[65536]``/``Float64Array[262144]`` arena ABI, so the result records that
runtime-resource blocker explicitly and may not be promoted to an execution
implementation.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import math
import struct
from types import MappingProxyType
from typing import ClassVar, Final, Iterator

import gmpy2


OUTPUT_ARRAYS_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_output_arrays/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
LEVELS: Final[tuple[tuple[str, int], ...]] = (
    ("L0", 64),
    ("L1", 96),
    ("L2", 128),
    ("AUDIT", 256),
)
ARCHIVE_LEVELS: Final[tuple[tuple[str, int], ...]] = LEVELS[:3]
ROLE_ORDER: Final[tuple[str, ...]] = (
    "rho_nodes",
    "base_scalar_u0",
    "base_potential_V0",
    "target_scalar_u_star",
    "target_potential_V_star",
)
JOIN_ORDER: Final[tuple[str, ...]] = ("U", "U1", "V", "V1")
TAIL_ORDER: Final[int] = 32
CORE_RADIUS: Final[int] = 32
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
TOTAL_ARRAY_COUNT: Final[int] = 20
TOTAL_VALUE_COUNT: Final[int] = 2_720
TOTAL_BYTE_LENGTH: Final[int] = 21_760
RUNTIME_BLOCKERS: Final[tuple[str, ...]] = (
    "fixed_native_mpfr_65536_arena_not_implemented",
    "fixed_float64_262144_arena_not_implemented",
    "fixed_uint32_257_arena_not_implemented",
)

NODE_GRAPH: Final[str] = (
    "for_level_L0_L1_L2_AUDIT_then_j_increasing:set_j,set_N_minus_1;"
    "endpoint_0_or_1_else_const_pi,mul_pi_j,div_theta,cos,sub_one_cos,div_two;"
    "exactly_one_terminal_get_d_per_rho"
)
BASE_GRAPH: Final[str] = (
    "L0_L1_L2_use_stored_rho64_and_same_level_immutable_projected_archive;"
    "AUDIT_uses_retained_exact_rhoMp_and_final_L2_plus_tail_composite;"
    "infinity_returns_positive_zero;exact_source_match_uses_lowest_j;"
    "otherwise_literal_MPFR256_barycentric_sum;role_major_u_then_V_barriers;"
    "one_get_d_per_field"
)
TARGET_GRAPH: Final[str] = (
    "L0_L1_L2_positive_one_bits_or_AUDIT_cmp_then_rho_to_x_without_get_d;"
    "reuse_coordinate_one_for_lambda=1/32;xBase=lambda*x;"
    "evaluate_final_L2_tail_composite_with_per_tail_call_constants;"
    "lambdaSquared=lambda*lambda;"
    "target=lambdaSquared*base;one_get_d_target_u_then_target_V;"
    "infinity_constructs_baseU_baseV_targetU_targetV_positive_zeros_without_x"
)


class OutputArrayError(ValueError):
    """Fail-closed output-array graph error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenProjectedArchive:
    level_id: str
    node_count: int
    projected_state: tuple[float, ...]
    projection_gate_passed: bool
    immutable_projected_archive: bool
    raw_accepted_state_used: bool = False
    execution_authority: bool = False
    replay_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenOutputArrayInput:
    projected_archives: tuple[FrozenProjectedArchive, ...]
    immutable_l2_rho_source_support: tuple[float, ...]
    join_barriers_u_u1_v_v1: tuple[float, ...]
    accepted_tail_state: tuple[float, ...]
    final_residual_gate_passed: bool
    immutable_accepted_tail_state: bool
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    execution_authority: bool = False
    replay_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenLevelRoleArray:
    ordinal: int
    level_id: str
    node_count: int
    role: str
    values: tuple[float, ...]
    f64le: bytes
    f64le_sha256: str
    size_bytes: int


@dataclass(frozen=True, slots=True)
class FrozenOutputArrayDiagnostic:
    arrays: tuple[FrozenLevelRoleArray, ...]
    array_count: int
    value_count: int
    byte_length: int
    aggregate_f64le_sha256: str
    archive_f64le_sha256: tuple[tuple[str, str], ...]
    l2_rho_source_support_f64le_sha256: str
    join_f64le_sha256: str
    tail_state_f64le_sha256: str
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    output_arrays_version: str
    node_graph: str
    base_graph: str
    target_graph: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: ClassVar[bool] = True
    output_buffers_allocated_after_numeric_gates: ClassVar[bool] = True
    diagnostic_dynamic_numeric_storage_used: ClassVar[bool] = True
    fixed_native_arenas_used: ClassVar[bool] = False
    exact_runtime_resource_model_satisfied: ClassVar[bool] = False
    runtime_blockers: ClassVar[tuple[str, ...]] = RUNTIME_BLOCKERS
    materialization_is_acceptance: ClassVar[bool] = False
    implementation_closure_complete: ClassVar[bool] = False
    runtime_closure_complete: ClassVar[bool] = False
    scientific_preseal_present: ClassVar[bool] = False
    candidate_execution_authorized: ClassVar[bool] = False
    candidate_executed: ClassVar[bool] = False
    output_present: ClassVar[bool] = False
    output_accepted: ClassVar[bool] = False
    replay_authority: ClassVar[bool] = False
    independent_agreement: ClassVar[bool] = False
    diagnostic_pass_authority: ClassVar[bool] = False
    candidate_authority: ClassVar[bool] = False
    theory_graph_authority: ClassVar[bool] = False
    physical_authority: ClassVar[bool] = False
    propulsion_authority: ClassVar[bool] = False
    transport_authority: ClassVar[bool] = False


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "implementationClosureComplete": False,
        "fixedNativeArenaRuntimeComplete": False,
        "runtimeClosureComplete": False,
        "scientificPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "outputPresent": False,
        "outputAccepted": False,
        "replayAuthority": False,
        "independentAgreement": False,
        "diagnosticPass": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)


_INPUT_AUTHORITY_FIELDS: Final[tuple[str, ...]] = (
    "execution_authority",
    "replay_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise OutputArrayError("output_array_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise OutputArrayError("output_array_binary64_nonfinite", detail)
    if _negative_zero(value):
        raise OutputArrayError("output_array_binary64_negative_zero", detail)
    return value


def _f64le(values: tuple[float, ...]) -> bytes:
    return b"".join(struct.pack("<d", value) for value in values)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _snapshot_tuple(value: object, count: int, detail: str) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != count:
        raise OutputArrayError("output_array_tuple_shape_invalid", detail)
    return tuple(
        _validate_f64(item, f"{detail}[{index}]")
        for index, item in enumerate(value)
    )


def _validate_input(
    value: object,
) -> tuple[
    tuple[tuple[str, int, tuple[float, ...]], ...],
    tuple[float, ...],
    tuple[float, float, float, float],
    tuple[float, ...],
]:
    if type(value) is not FrozenOutputArrayInput:
        raise OutputArrayError("output_array_input_type_invalid")
    if (
        type(value.primary_numerics_policy_sha256) is not str
        or value.primary_numerics_policy_sha256 != PRIMARY_NUMERICS_POLICY_SHA256
        or type(value.primary_numerics_policy_canonical_size_bytes) is not int
        or value.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise OutputArrayError("output_array_policy_binding_invalid")
    if any(getattr(value, field) is not False for field in _INPUT_AUTHORITY_FIELDS):
        raise OutputArrayError("output_array_input_authority_invalid", "root")
    if (
        value.final_residual_gate_passed is not True
        or value.immutable_accepted_tail_state is not True
    ):
        raise OutputArrayError("output_array_final_tail_gate_invalid")
    if type(value.projected_archives) is not tuple or len(value.projected_archives) != 3:
        raise OutputArrayError("output_array_archive_inventory_invalid")

    archives: list[tuple[str, int, tuple[float, ...]]] = []
    for ordinal, ((expected_level, count), archive) in enumerate(
        zip(ARCHIVE_LEVELS, value.projected_archives, strict=True)
    ):
        if type(archive) is not FrozenProjectedArchive:
            raise OutputArrayError("output_array_archive_type_invalid", str(ordinal))
        if (
            type(archive.level_id) is not str
            or archive.level_id != expected_level
            or type(archive.node_count) is not int
            or archive.node_count != count
            or archive.projection_gate_passed is not True
            or archive.immutable_projected_archive is not True
            or archive.raw_accepted_state_used is not False
            or any(
                getattr(archive, field) is not False
                for field in _INPUT_AUTHORITY_FIELDS
            )
        ):
            raise OutputArrayError("output_array_archive_binding_invalid", expected_level)
        state = _snapshot_tuple(
            archive.projected_state, 2 * count + 1, f"archive.{expected_level}"
        )
        if (
            state[count - 1] != 0.0
            or state[2 * count - 1] != 0.0
            or not state[-1] < 0.0
        ):
            raise OutputArrayError("output_array_archive_domain_invalid", expected_level)
        archives.append((expected_level, count, state))

    l2_rho = _snapshot_tuple(
        value.immutable_l2_rho_source_support, 128, "l2_rho_source_support"
    )
    if l2_rho[0] != 0.0 or l2_rho[-1] != 1.0 or any(
        not l2_rho[index] > l2_rho[index - 1] for index in range(1, 128)
    ):
        raise OutputArrayError("output_array_l2_rho_domain_invalid")
    joins_raw = _snapshot_tuple(value.join_barriers_u_u1_v_v1, 4, "join")
    joins = (joins_raw[0], joins_raw[1], joins_raw[2], joins_raw[3])
    tail = _snapshot_tuple(value.accepted_tail_state, 65, "tail_state")
    if not tail[0] > 0.0:
        raise OutputArrayError("output_array_tail_C_domain_invalid")
    return tuple(archives), l2_rho, joins, tail


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
        expected = _owned_context_template()
        fields = (
            "precision",
            "round",
            "emin",
            "emax",
            "subnormalize",
            "trap_underflow",
            "trap_overflow",
            "trap_inexact",
            "trap_invalid",
            "trap_erange",
            "trap_divzero",
            "allow_complex",
            "rational_division",
            "allow_release_gil",
        )
        if any(getattr(context, field) != getattr(expected, field) for field in fields):
            raise OutputArrayError("output_array_mpfr_context_installation_failed")
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> bool:
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
    bad = tuple(name for name, present in observed.items() if present and name != "inexact")
    if bad:
        raise OutputArrayError(
            "output_array_mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )
    return observed["inexact"]


def _positive_zero(context: gmpy2.context, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    inexact = _check_flags(context, operation)
    if inexact or not gmpy2.is_zero(result) or gmpy2.is_signed(result):
        raise OutputArrayError("output_array_positive_zero_failed", operation)
    return result


def _finish(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> tuple[gmpy2.mpfr, bool]:
    inexact = _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise OutputArrayError("output_array_mpfr_nonfinite", operation)
    if gmpy2.is_zero(value):
        value = _positive_zero(context, f"{operation}.canonical_zero")
    return value, inexact


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise OutputArrayError("output_array_set_ui_domain_invalid", operation)
    context.clear_flags()
    result, inexact = _finish(
        context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation
    )
    if inexact:
        raise OutputArrayError("output_array_set_ui_inexact", operation)
    return result


def _set_si(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int:
        raise OutputArrayError("output_array_set_si_domain_invalid", operation)
    context.clear_flags()
    result, inexact = _finish(
        context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation
    )
    if inexact:
        raise OutputArrayError("output_array_set_si_inexact", operation)
    return result


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result, inexact = _finish(
        context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation
    )
    if inexact:
        raise OutputArrayError("output_array_set_d_inexact", operation)
    return result


def _copy(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result, inexact = _finish(
        context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation
    )
    if inexact:
        raise OutputArrayError("output_array_copy_inexact", operation)
    return result


def _unary(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str, kind: str
) -> gmpy2.mpfr:
    if kind not in ("neg", "sqrt", "log", "exp", "cos"):
        raise OutputArrayError("output_array_unary_kind_invalid", kind)
    if not gmpy2.is_finite(value):
        raise OutputArrayError("output_array_mpfr_nonfinite", f"{operation}.input")
    if kind in ("sqrt", "log"):
        positive_zero = _positive_zero(
            context, f"{operation}.domain.set_positive_zero"
        )
        comparison = _cmp(
            context,
            value,
            positive_zero,
            f"{operation}.domain.cmp_zero",
        )
        if kind == "sqrt" and comparison < 0:
            raise OutputArrayError(
                "output_array_mpfr_sqrt_domain_invalid", operation
            )
        if kind == "log" and comparison <= 0:
            raise OutputArrayError("output_array_mpfr_log_domain_invalid", operation)
    context.clear_flags()
    if kind == "neg":
        raw = -value
    elif kind == "sqrt":
        raw = gmpy2.sqrt(value)
    elif kind == "log":
        raw = gmpy2.log(value)
    elif kind == "exp":
        raw = gmpy2.exp(value)
    elif kind == "cos":
        raw = gmpy2.cos(value)
    return _finish(context, raw, operation)[0]


def _binary(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
    kind: str,
) -> gmpy2.mpfr:
    if kind == "div" and gmpy2.is_zero(right):
        raise OutputArrayError("output_array_mpfr_division_by_zero", operation)
    context.clear_flags()
    if kind == "add":
        raw = gmpy2.add(left, right)
    elif kind == "sub":
        raw = gmpy2.sub(left, right)
    elif kind == "mul":
        raw = gmpy2.mul(left, right)
    elif kind == "div":
        raw = gmpy2.div(left, right)
    else:
        raise OutputArrayError("output_array_binary_kind_invalid", kind)
    return _finish(context, raw, operation)[0]


def _const_pi(context: gmpy2.context, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.const_pi(MPFR_PRECISION_BITS), operation)[0]


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise OutputArrayError("output_array_binary64_nonfinite_result", operation)
    if result == 0.0:
        result = 0.0
    if _negative_zero(result):
        raise OutputArrayError("output_array_binary64_negative_zero_result", operation)
    return result


def _cmp(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> int:
    context.clear_flags()
    result = int(gmpy2.cmp(left, right))
    if _check_flags(context, operation):
        raise OutputArrayError("output_array_mpfr_compare_inexact", operation)
    if result not in (-1, 0, 1):
        raise OutputArrayError("output_array_mpfr_compare_invalid", operation)
    return result


def _nodes(
    context: gmpy2.context, count: int, level_id: str
) -> tuple[tuple[gmpy2.mpfr, ...], tuple[float, ...]]:
    nodes_mp: list[gmpy2.mpfr] = []
    nodes_64: list[float] = []
    for index in range(count):
        index_mp = _set_ui(context, index, f"{level_id}.node.set_j")
        denominator = _set_ui(
            context, count - 1, f"{level_id}.node.set_denominator"
        )
        if index == 0:
            rho = _set_ui(context, 0, f"{level_id}.node.set_origin")
        elif index == count - 1:
            rho = _set_ui(context, 1, f"{level_id}.node.set_infinity")
        else:
            pi_value = _const_pi(context, f"{level_id}.node.const_pi")
            pi_times_j = _binary(
                context, pi_value, index_mp, f"{level_id}.node.mul_pi_j", "mul"
            )
            theta = _binary(
                context,
                pi_times_j,
                denominator,
                f"{level_id}.node.div_theta",
                "div",
            )
            cosine = _unary(
                context, theta, f"{level_id}.node.cos", "cos"
            )
            one = _set_ui(context, 1, f"{level_id}.node.set_one")
            difference = _binary(
                context,
                one,
                cosine,
                f"{level_id}.node.sub_one_cos",
                "sub",
            )
            two = _set_ui(context, 2, f"{level_id}.node.set_two")
            rho = _binary(
                context, difference, two, f"{level_id}.node.div_two", "div"
            )
        nodes_mp.append(rho)
        nodes_64.append(_get_d(context, rho, f"{level_id}.node.get_d"))
    return tuple(nodes_mp), tuple(nodes_64)


def _interpolate(
    context: gmpy2.context,
    rho: gmpy2.mpfr,
    source_rho: tuple[float, ...],
    source_values: tuple[float, ...],
    operation: str,
    *,
    infinity_branch: bool,
) -> gmpy2.mpfr:
    if infinity_branch:
        one = _set_ui(context, 1, f"{operation}.set_one")
        if _cmp(context, rho, one, f"{operation}.cmp_infinity") == 0:
            return _positive_zero(context, f"{operation}.infinity_zero")
    for index, (node, value) in enumerate(
        zip(source_rho, source_values, strict=True)
    ):
        node_mp = _set_d(context, node, f"{operation}.node[{index}].set_d")
        if _cmp(context, rho, node_mp, f"{operation}.node[{index}].cmp") == 0:
            return _set_d(
                context, value, f"{operation}.shortcut[{index}].set_d"
            )
    numerator = _set_ui(context, 0, f"{operation}.numerator.zero")
    denominator = _set_ui(context, 0, f"{operation}.denominator.zero")
    last = len(source_rho) - 1
    for index, (node, value) in enumerate(
        zip(source_rho, source_values, strict=True)
    ):
        node_mp = _set_d(context, node, f"{operation}.term[{index}].node")
        magnitude = _set_ui(
            context,
            1 if index in (0, last) else 2,
            f"{operation}.term[{index}].weight_magnitude",
        )
        two = _set_ui(context, 2, f"{operation}.term[{index}].set_two")
        weight_unsigned = _binary(
            context,
            magnitude,
            two,
            f"{operation}.term[{index}].weight_div_two",
            "div",
        )
        if index % 2:
            weight = _unary(
                context,
                weight_unsigned,
                f"{operation}.term[{index}].weight_neg",
                "neg",
            )
        else:
            weight = _copy(
                context,
                weight_unsigned,
                f"{operation}.term[{index}].weight_even_copy",
            )
        difference = _binary(
            context,
            rho,
            node_mp,
            f"{operation}.term[{index}].difference",
            "sub",
        )
        ratio = _binary(
            context,
            weight,
            difference,
            f"{operation}.term[{index}].ratio",
            "div",
        )
        value_mp = _set_d(
            context, value, f"{operation}.term[{index}].value"
        )
        weighted = _binary(
            context,
            ratio,
            value_mp,
            f"{operation}.term[{index}].weighted",
            "mul",
        )
        numerator_next = _binary(
            context,
            numerator,
            weighted,
            f"{operation}.term[{index}].numerator_add",
            "add",
        )
        numerator = _copy(
            context,
            numerator_next,
            f"{operation}.term[{index}].numerator_copy",
        )
        denominator_next = _binary(
            context,
            denominator,
            ratio,
            f"{operation}.term[{index}].denominator_add",
            "add",
        )
        denominator = _copy(
            context,
            denominator_next,
            f"{operation}.term[{index}].denominator_copy",
        )
    return _binary(
        context, numerator, denominator, f"{operation}.final_div", "div"
    )


@dataclass(frozen=True, slots=True)
class _TailConstants:
    kappa: gmpy2.mpfr
    sigma: gmpy2.mpfr
    C: gmpy2.mpfr
    R: gmpy2.mpfr
    a: gmpy2.mpfr
    H1: gmpy2.mpfr
    Hy1: gmpy2.mpfr
    Q1: gmpy2.mpfr
    Qy1: gmpy2.mpfr
    h: tuple[float, ...]
    q: tuple[float, ...]


def _tail_constants(
    context: gmpy2.context,
    l2_state: tuple[float, ...],
    joins: tuple[float, float, float, float],
    tail: tuple[float, ...],
) -> _TailConstants:
    nu = _set_d(context, l2_state[-1], "tail_constant.set_nu")
    minus_two = _set_si(context, -2, "tail_constant.set_minus_two")
    minus_two_nu = _binary(
        context, minus_two, nu, "tail_constant.mul_minus_two_nu", "mul"
    )
    kappa = _unary(context, minus_two_nu, "tail_constant.sqrt_kappa", "sqrt")
    C = _set_d(context, tail[0], "tail_constant.set_C")
    c_over_kappa = _binary(
        context, C, kappa, "tail_constant.div_C_kappa", "div"
    )
    one = _set_ui(context, 1, "tail_constant.set_one")
    sigma = _binary(
        context, c_over_kappa, one, "tail_constant.sub_sigma", "sub"
    )
    R = _set_ui(context, CORE_RADIUS, "tail_constant.set_R")
    a = _binary(context, kappa, R, "tail_constant.mul_a", "mul")
    H1 = _set_d(context, joins[0], "tail_constant.set_H1")
    U1 = _set_d(context, joins[1], "tail_constant.set_U1")
    negative_a = _unary(context, a, "tail_constant.neg_a", "neg")
    negative_a_plus_sigma = _binary(
        context,
        negative_a,
        sigma,
        "tail_constant.add_negative_a_sigma",
        "add",
    )
    lift_product = _binary(
        context,
        negative_a_plus_sigma,
        H1,
        "tail_constant.mul_H_lift",
        "mul",
    )
    R_U1 = _binary(context, R, U1, "tail_constant.mul_R_U1", "mul")
    Hy1 = _binary(
        context, lift_product, R_U1, "tail_constant.sub_Hy1", "sub"
    )
    V_join = _set_d(context, joins[2], "tail_constant.set_V")
    c_over_R = _binary(context, C, R, "tail_constant.div_C_R", "div")
    Q1 = _binary(context, V_join, c_over_R, "tail_constant.add_Q1", "add")
    V1 = _set_d(context, joins[3], "tail_constant.set_V1")
    minus_two_exact = _set_si(context, -2, "tail_constant.set_minus_two_exact")
    minus_two_a = _binary(
        context, minus_two_exact, a, "tail_constant.mul_minus_two_a", "mul"
    )
    two = _set_ui(context, 2, "tail_constant.set_two")
    two_sigma = _binary(
        context, two, sigma, "tail_constant.mul_two_sigma", "mul"
    )
    q_lift_coefficient = _binary(
        context,
        minus_two_a,
        two_sigma,
        "tail_constant.add_q_lift_coefficient",
        "add",
    )
    q_lift_product = _binary(
        context,
        q_lift_coefficient,
        Q1,
        "tail_constant.mul_q_lift_product",
        "mul",
    )
    R_V1 = _binary(context, R, V1, "tail_constant.mul_R_V1", "mul")
    q_lift_plus_c = _binary(
        context,
        q_lift_product,
        c_over_R,
        "tail_constant.add_q_lift_plus_c",
        "add",
    )
    Qy1 = _binary(
        context, q_lift_plus_c, R_V1, "tail_constant.sub_Qy1", "sub"
    )
    return _TailConstants(
        kappa=kappa,
        sigma=sigma,
        C=C,
        R=R,
        a=a,
        H1=H1,
        Hy1=Hy1,
        Q1=Q1,
        Qy1=Qy1,
        h=tail[1:33],
        q=tail[33:65],
    )


def _tail_branch(
    context: gmpy2.context,
    x: gmpy2.mpfr,
    constants: _TailConstants,
    operation: str,
) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    y = _binary(context, constants.R, x, f"{operation}.div_y", "div")
    two = _set_ui(context, 2, f"{operation}.set_two")
    two_y = _binary(context, two, y, f"{operation}.mul_two_y", "mul")
    one = _set_ui(context, 1, f"{operation}.set_one")
    t = _binary(context, two_y, one, f"{operation}.sub_t", "sub")
    polynomials: list[gmpy2.mpfr] = [
        _set_ui(context, 1, f"{operation}.T0"),
        _copy(context, t, f"{operation}.T1"),
    ]
    for index in range(1, 31):
        two_t = _binary(
            context, two, t, f"{operation}.T[{index + 1}].two_t", "mul"
        )
        product = _binary(
            context,
            two_t,
            polynomials[index],
            f"{operation}.T[{index + 1}].product",
            "mul",
        )
        polynomials.append(
            _binary(
                context,
                product,
                polynomials[index - 1],
                f"{operation}.T[{index + 1}].sub",
                "sub",
            )
        )
    Ah = _set_ui(context, 0, f"{operation}.Ah.zero")
    Aq = _set_ui(context, 0, f"{operation}.Aq.zero")
    for index in range(TAIL_ORDER):
        h_n = _set_d(context, constants.h[index], f"{operation}.h[{index}]")
        h_term = _binary(
            context,
            h_n,
            polynomials[index],
            f"{operation}.h_term[{index}]",
            "mul",
        )
        Ah = _copy(
            context,
            _binary(context, Ah, h_term, f"{operation}.Ah_add[{index}]", "add"),
            f"{operation}.Ah_copy[{index}]",
        )
        q_n = _set_d(context, constants.q[index], f"{operation}.q[{index}]")
        q_term = _binary(
            context,
            q_n,
            polynomials[index],
            f"{operation}.q_term[{index}]",
            "mul",
        )
        Aq = _copy(
            context,
            _binary(context, Aq, q_term, f"{operation}.Aq_add[{index}]", "add"),
            f"{operation}.Aq_copy[{index}]",
        )
    y_minus_one = _binary(context, y, one, f"{operation}.y_minus_one", "sub")
    one_minus_y = _binary(context, one, y, f"{operation}.one_minus_y", "sub")
    one_minus_y_squared = _binary(
        context,
        one_minus_y,
        one_minus_y,
        f"{operation}.one_minus_y_squared",
        "mul",
    )
    H_linear = _binary(
        context, constants.Hy1, y_minus_one, f"{operation}.H_linear", "mul"
    )
    H_base = _binary(
        context, constants.H1, H_linear, f"{operation}.H_base", "add"
    )
    H_correction = _binary(
        context,
        one_minus_y_squared,
        Ah,
        f"{operation}.H_correction",
        "mul",
    )
    H = _binary(context, H_base, H_correction, f"{operation}.H", "add")
    Q_linear = _binary(
        context, constants.Qy1, y_minus_one, f"{operation}.Q_linear", "mul"
    )
    Q_base = _binary(
        context, constants.Q1, Q_linear, f"{operation}.Q_base", "add"
    )
    Q_correction = _binary(
        context,
        one_minus_y_squared,
        Aq,
        f"{operation}.Q_correction",
        "mul",
    )
    Q = _binary(context, Q_base, Q_correction, f"{operation}.Q", "add")
    x_minus_R = _binary(
        context, x, constants.R, f"{operation}.x_minus_R", "sub"
    )
    kappa_distance = _binary(
        context,
        constants.kappa,
        x_minus_R,
        f"{operation}.kappa_distance",
        "mul",
    )
    decay = _unary(context, kappa_distance, f"{operation}.decay_neg", "neg")
    x_over_R = _binary(context, x, constants.R, f"{operation}.x_over_R", "div")
    log_x_over_R = _unary(
        context, x_over_R, f"{operation}.log_x_over_R", "log"
    )
    log_term = _binary(
        context,
        constants.sigma,
        log_x_over_R,
        f"{operation}.log_term",
        "mul",
    )
    exponent = _binary(context, decay, log_term, f"{operation}.exponent", "add")
    B = _unary(context, exponent, f"{operation}.exp_B", "exp")
    E = _binary(context, B, B, f"{operation}.E", "mul")
    u = _binary(context, B, H, f"{operation}.u", "mul")
    c_over_x = _binary(context, constants.C, x, f"{operation}.C_over_x", "div")
    coulomb = _unary(context, c_over_x, f"{operation}.coulomb_neg", "neg")
    E_Q = _binary(context, E, Q, f"{operation}.E_Q", "mul")
    V = _binary(context, coulomb, E_Q, f"{operation}.V", "add")
    return u, V


def _composite(
    context: gmpy2.context,
    x: gmpy2.mpfr | None,
    l2_rho: tuple[float, ...],
    l2_u: tuple[float, ...],
    l2_v: tuple[float, ...],
    l2_state: tuple[float, ...],
    joins: tuple[float, float, float, float],
    tail: tuple[float, ...],
    operation: str,
) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    if x is None:
        return (
            _set_ui(context, 0, f"{operation}.infinity_u"),
            _set_ui(context, 0, f"{operation}.infinity_V"),
        )
    radius = _set_ui(context, CORE_RADIUS, f"{operation}.core.set_R")
    if _cmp(context, x, radius, f"{operation}.core.cmp_R") <= 0:
        one = _set_ui(context, 1, f"{operation}.core.set_one")
        one_plus_x = _binary(
            context, one, x, f"{operation}.core.one_plus_x", "add"
        )
        rho = _binary(
            context, x, one_plus_x, f"{operation}.core.rho", "div"
        )
        return (
            _interpolate(
                context,
                rho,
                l2_rho,
                l2_u,
                f"{operation}.core.u",
                infinity_branch=False,
            ),
            _interpolate(
                context,
                rho,
                l2_rho,
                l2_v,
                f"{operation}.core.V",
                infinity_branch=False,
            ),
        )
    constants = _tail_constants(context, l2_state, joins, tail)
    return _tail_branch(context, x, constants, f"{operation}.tail")


def _rho_to_x(
    context: gmpy2.context,
    rho: gmpy2.mpfr,
    rho64_for_infinity_branch: float | None,
    operation: str,
) -> tuple[gmpy2.mpfr | None, gmpy2.mpfr]:
    one = _set_ui(context, 1, f"{operation}.set_one")
    infinity = (
        _cmp(context, rho, one, f"{operation}.cmp_infinity") == 0
        if rho64_for_infinity_branch is None
        else struct.pack("<d", rho64_for_infinity_branch)
        == struct.pack("<d", 1.0)
    )
    if infinity:
        return None, one
    one_minus_rho = _binary(
        context, one, rho, f"{operation}.one_minus_rho", "sub"
    )
    return (
        _binary(context, rho, one_minus_rho, f"{operation}.x", "div"),
        one,
    )


def _role(
    ordinal: int, level_id: str, count: int, role: str, values: tuple[float, ...]
) -> FrozenLevelRoleArray:
    if len(values) != count or any(
        not math.isfinite(value) or _negative_zero(value) for value in values
    ):
        raise OutputArrayError("output_array_role_value_invariant", f"{level_id}:{role}")
    raw = _f64le(values)
    return FrozenLevelRoleArray(
        ordinal=ordinal,
        level_id=level_id,
        node_count=count,
        role=role,
        values=values,
        f64le=raw,
        f64le_sha256=_sha256(raw),
        size_bytes=len(raw),
    )


def materialize_output_array_diagnostic(
    value: FrozenOutputArrayInput,
) -> FrozenOutputArrayDiagnostic:
    """Materialize all twenty arrays without granting run or claim authority."""

    with _owned_mpfr256_context() as context:
        archives, l2_rho, joins, tail = _validate_input(value)
        archive_map = {
            level_id: (count, state) for level_id, count, state in archives
        }
        l2_state = archive_map["L2"][1]
        l2_u = l2_state[:128]
        l2_v = l2_state[128:256]

        output: list[FrozenLevelRoleArray] = []
        ordinal = 0
        for level_id, count in LEVELS:
            nodes_mp, rho64 = _nodes(context, count, level_id)
            if level_id == "L2" and any(
                struct.pack("<d", observed) != struct.pack("<d", expected)
                for observed, expected in zip(rho64, l2_rho, strict=True)
            ):
                raise OutputArrayError("output_array_l2_rho_support_mismatch")

            output.append(_role(ordinal, level_id, count, ROLE_ORDER[0], rho64))
            ordinal += 1

            if level_id == "AUDIT":
                base_pairs = tuple(
                    _composite(
                        context,
                        _rho_to_x(
                            context,
                            retained_rho,
                            None,
                            f"{level_id}[{index}].base_coordinate",
                        )[0],
                        l2_rho,
                        l2_u,
                        l2_v,
                        l2_state,
                        joins,
                        tail,
                        f"{level_id}[{index}].base",
                    )
                    for index, retained_rho in enumerate(nodes_mp)
                )
                base_u_mp = tuple(pair[0] for pair in base_pairs)
                base_v_mp = tuple(pair[1] for pair in base_pairs)
            else:
                source_count, source_state = archive_map[level_id]
                stored_base_rho = tuple(
                    _set_d(
                        context,
                        rho64[index],
                        f"{level_id}[{index}].base_coordinate.set_d",
                    )
                    for index in range(count)
                )
                base_u_mp = tuple(
                    _interpolate(
                        context,
                        stored_base_rho[index],
                        rho64,
                        source_state[:source_count],
                        f"{level_id}[{index}].base.u",
                        infinity_branch=True,
                    )
                    for index in range(count)
                )
                base_v_mp = tuple(
                    _interpolate(
                        context,
                        stored_base_rho[index],
                        rho64,
                        source_state[source_count : 2 * source_count],
                        f"{level_id}[{index}].base.V",
                        infinity_branch=True,
                    )
                    for index in range(count)
                )

            base_u = tuple(
                _get_d(context, item, f"{level_id}[{index}].base.u.get_d")
                for index, item in enumerate(base_u_mp)
            )
            output.append(_role(ordinal, level_id, count, ROLE_ORDER[1], base_u))
            ordinal += 1
            base_v = tuple(
                _get_d(context, item, f"{level_id}[{index}].base.V.get_d")
                for index, item in enumerate(base_v_mp)
            )
            output.append(_role(ordinal, level_id, count, ROLE_ORDER[2], base_v))
            ordinal += 1

            target_pairs: list[tuple[gmpy2.mpfr, gmpy2.mpfr]] = []
            for index, retained_rho in enumerate(nodes_mp):
                coordinate = (
                    retained_rho
                    if level_id == "AUDIT"
                    else _set_d(
                        context,
                        rho64[index],
                        f"{level_id}[{index}].target_coordinate.set_d",
                    )
                )
                x, coordinate_one = _rho_to_x(
                    context,
                    coordinate,
                    None if level_id == "AUDIT" else rho64[index],
                    f"{level_id}[{index}].target_coordinate",
                )
                if x is None:
                    _positive_zero(
                        context, f"{level_id}[{index}].target.base.u.infinity"
                    )
                    _positive_zero(
                        context, f"{level_id}[{index}].target.base.V.infinity"
                    )
                    target_u_mp = _positive_zero(
                        context, f"{level_id}[{index}].target.u.infinity"
                    )
                    target_v_mp = _positive_zero(
                        context, f"{level_id}[{index}].target.V.infinity"
                    )
                else:
                    lambda_mp = _binary(
                        context,
                        coordinate_one,
                        _set_ui(
                            context,
                            32,
                            f"{level_id}[{index}].target.set_thirty_two",
                        ),
                        f"{level_id}[{index}].target.lambda",
                        "div",
                    )
                    x_base = _binary(
                        context,
                        lambda_mp,
                        x,
                        f"{level_id}[{index}].target.x_base",
                        "mul",
                    )
                    target_base_u, target_base_v = _composite(
                        context,
                        x_base,
                        l2_rho,
                        l2_u,
                        l2_v,
                        l2_state,
                        joins,
                        tail,
                        f"{level_id}[{index}].target.base",
                    )
                    lambda_squared = _binary(
                        context,
                        lambda_mp,
                        lambda_mp,
                        f"{level_id}[{index}].target.lambda_squared",
                        "mul",
                    )
                    target_u_mp = _binary(
                        context,
                        lambda_squared,
                        target_base_u,
                        f"{level_id}[{index}].target.u.scale",
                        "mul",
                    )
                    target_v_mp = _binary(
                        context,
                        lambda_squared,
                        target_base_v,
                        f"{level_id}[{index}].target.V.scale",
                        "mul",
                    )
                target_pairs.append((target_u_mp, target_v_mp))

            target_u = tuple(
                _get_d(
                    context,
                    item[0],
                    f"{level_id}[{index}].target.u.get_d",
                )
                for index, item in enumerate(target_pairs)
            )
            output.append(_role(ordinal, level_id, count, ROLE_ORDER[3], target_u))
            ordinal += 1
            target_v = tuple(
                _get_d(
                    context,
                    item[1],
                    f"{level_id}[{index}].target.V.get_d",
                )
                for index, item in enumerate(target_pairs)
            )
            output.append(_role(ordinal, level_id, count, ROLE_ORDER[4], target_v))
            ordinal += 1

    arrays = tuple(output)
    aggregate = b"".join(item.f64le for item in arrays)
    archive_hashes = tuple(
        (level_id, _sha256(_f64le(state))) for level_id, _count, state in archives
    )
    if (
        len(arrays) != TOTAL_ARRAY_COUNT
        or sum(len(item.values) for item in arrays) != TOTAL_VALUE_COUNT
        or len(aggregate) != TOTAL_BYTE_LENGTH
        or tuple((item.level_id, item.role) for item in arrays)
        != tuple((level, role) for level, _count in LEVELS for role in ROLE_ORDER)
    ):
        raise OutputArrayError("output_array_inventory_invariant")
    return FrozenOutputArrayDiagnostic(
        arrays=arrays,
        array_count=len(arrays),
        value_count=TOTAL_VALUE_COUNT,
        byte_length=len(aggregate),
        aggregate_f64le_sha256=_sha256(aggregate),
        archive_f64le_sha256=archive_hashes,
        l2_rho_source_support_f64le_sha256=_sha256(_f64le(l2_rho)),
        join_f64le_sha256=_sha256(_f64le(joins)),
        tail_state_f64le_sha256=_sha256(_f64le(tail)),
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        output_arrays_version=OUTPUT_ARRAYS_VERSION,
        node_graph=NODE_GRAPH,
        base_graph=BASE_GRAPH,
        target_graph=TARGET_GRAPH,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )


if (
    LEVELS != (("L0", 64), ("L1", 96), ("L2", 128), ("AUDIT", 256))
    or len(ROLE_ORDER) != 5
    or TOTAL_ARRAY_COUNT != 20
    or TOTAL_VALUE_COUNT != 2_720
    or TOTAL_BYTE_LENGTH != 21_760
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_output_array_invariant")


__all__ = [
    "ARCHIVE_LEVELS",
    "AUTHORITY_LOCKS",
    "BASE_GRAPH",
    "FrozenLevelRoleArray",
    "FrozenOutputArrayDiagnostic",
    "FrozenOutputArrayInput",
    "FrozenProjectedArchive",
    "JOIN_ORDER",
    "LEVELS",
    "NODE_GRAPH",
    "OUTPUT_ARRAYS_VERSION",
    "OutputArrayError",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "ROLE_ORDER",
    "RUNTIME_BLOCKERS",
    "TARGET_GRAPH",
    "TOTAL_ARRAY_COUNT",
    "TOTAL_BYTE_LENGTH",
    "TOTAL_VALUE_COUNT",
    "materialize_output_array_diagnostic",
]
