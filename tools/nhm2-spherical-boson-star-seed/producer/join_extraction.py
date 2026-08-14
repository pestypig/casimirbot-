"""Frozen MPFR256 extraction of the four L2 core/tail join barriers.

This primitive evaluates the projected L2 core fields at x=32 (rho=32/33)
and emits U, U1, V, V1 in the literal primary-numerics barrier order.  It
does not establish that the caller's state was accepted, solve a candidate,
or confer replay, diagnostic, or physical authority.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Final, Iterator

import gmpy2


JOIN_EXTRACTION_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_l2_join_extraction/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
SPECTRAL_SOURCE_SHA256: Final[str] = (
    "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7"
)
SPECTRAL_SOURCE_SIZE_BYTES: Final[int] = 19_045
SPECTRAL_N128_PAYLOAD_SHA256: Final[str] = (
    "9997d1ede86739b4716d838f287f5aaca27edba3fb52748ad0ac48a6e62f7c45"
)
SPECTRAL_PAYLOAD_GOLDEN_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed-primary-spectral/golden/v1\n"
)
NODE_COUNT: Final[int] = 128
UNKNOWN_COUNT: Final[int] = 257
JOIN_X: Final[int] = 32
JOIN_RHO_NUMERATOR: Final[int] = 32
JOIN_RHO_DENOMINATOR: Final[int] = 33
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
BARRIER_ORDER: Final[tuple[str, ...]] = ("U", "U1", "V", "V1")
JOIN_OPERATION_GRAPH: Final[str] = (
    "joinRho=set_ui(32)/set_ui(33)_without_get_d;fields_u_then_V;"
    "j_0_through_127;S0_S1_S2_S3_distinct;"
    "q=S1/S0;qRho=(q*S2-S3)/S0;qX=qRho*(1-rho)^2;"
    "get_d_U_then_U1_then_V_then_V1"
)


class JoinExtractionError(ValueError):
    """Fail-closed join primitive error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_SPECTRAL_PATH: Final[Path] = Path(__file__).resolve().with_name("spectral.py")


def _read_bound_spectral_source() -> bytes:
    try:
        source = _SPECTRAL_PATH.read_bytes()
    except OSError as error:
        raise JoinExtractionError(
            "join_spectral_source_binding_unavailable", type(error).__name__
        ) from error
    if len(source) != SPECTRAL_SOURCE_SIZE_BYTES:
        raise JoinExtractionError("join_spectral_source_binding_mismatch", "size")
    if hashlib.sha256(source).hexdigest() != SPECTRAL_SOURCE_SHA256:
        raise JoinExtractionError("join_spectral_source_binding_mismatch", "sha256")
    return source


def _load_bound_spectral_module() -> ModuleType:
    source = _read_bound_spectral_source()
    module = ModuleType(
        "_nhm2_spherical_seed_join_spectral_e9b2509b0c4a5d41"
    )
    module.__file__ = str(_SPECTRAL_PATH)
    module.__package__ = ""
    missing = object()
    previous = sys.modules.get(module.__name__, missing)
    sys.modules[module.__name__] = module
    try:
        code = compile(
            source,
            str(_SPECTRAL_PATH),
            "exec",
            dont_inherit=True,
            optimize=0,
        )
        exec(code, module.__dict__)
    except Exception as error:
        raise JoinExtractionError(
            "join_spectral_private_load_failed", type(error).__name__
        ) from error
    finally:
        if previous is missing:
            del sys.modules[module.__name__]
        else:
            sys.modules[module.__name__] = previous
    if (
        not isinstance(getattr(module, "__file__", None), str)
        or Path(module.__file__).resolve() != _SPECTRAL_PATH
    ):
        raise JoinExtractionError("join_spectral_module_origin_mismatch", "path")
    return module


_spectral_module = _load_bound_spectral_module()

FrozenLobattoSpectralPrimitive = _spectral_module.FrozenLobattoSpectralPrimitive
SPECTRAL_AUTHORITY_LOCKS = _spectral_module.AUTHORITY_LOCKS
SPECTRAL_POLICY_SHA256 = _spectral_module.PRIMARY_NUMERICS_POLICY_SHA256
SPECTRAL_POLICY_SIZE = (
    _spectral_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
)


@dataclass(frozen=True, slots=True)
class FrozenL2JoinBarriers:
    node_count: int
    join_x: int
    join_rho_exact: str
    U: float
    U1: float
    V: float
    V1: float
    barrier_values: tuple[float, ...]
    barrier_order: tuple[str, ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    spectral_source_sha256: str
    spectral_source_size_bytes: int
    spectral_payload_sha256: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    projected_source_acceptance_verified: bool = False
    join_receipt_present: bool = False
    solve_performed: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    output_present: bool = False
    output_accepted: bool = False
    seed_accepted: bool = False
    branch_accepted: bool = False
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
        "projectedSourceAcceptanceVerified": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "runReplayAccepted": False,
        "independentAgreementAccepted": False,
        "diagnosticPass": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)

_SPECTRAL_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "primary_numerics_semantic_authority",
    "implementation_closure_complete",
    "runtime_closure_complete",
    "node_count_selected_for_candidate",
    "gauss_legendre_fixture_bound",
    "source_manifest_bound",
    "toolchain_manifest_bound",
    "executable_bound",
    "runtime_manifest_bound",
    "scientific_preseal_present",
    "candidate_execution_authorized",
    "candidate_executed",
    "output_present",
    "output_accepted",
    "candidate_output_materialized",
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

_SPECTRAL_SNAPSHOT_FIELD_NAMES: Final[tuple[str, ...]] = (
    "node_count",
    "rho",
    "barycentric_weights",
    "first_derivative",
    "second_derivative",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "mpfr_precision_bits",
    "mpfr_rounding_mode",
    "mpfr_emin",
    "mpfr_emax",
    "observed_gmpy2_version",
    "observed_mpfr_version",
    "calculation_implemented",
    *_SPECTRAL_FALSE_FIELDS,
)


@dataclass(frozen=True, slots=True)
class _FrozenSpectralSnapshot:
    field_values: tuple[object, ...]
    node_count: int
    rho: tuple[float, ...]
    barycentric_weights: tuple[float, ...]
    first_derivative: tuple[tuple[float, ...], ...]
    second_derivative: tuple[tuple[float, ...], ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    calculation_implemented: bool
    false_field_values: tuple[object, ...]
    exact_tuple_shape: bool


def _snapshot_spectral_primitive(value: object) -> _FrozenSpectralSnapshot:
    if type(value) is not FrozenLobattoSpectralPrimitive:
        raise JoinExtractionError(
            "join_spectral_primitive_type_invalid", type(value).__name__
        )
    try:
        supplied = tuple(
            getattr(value, field_name)
            for field_name in _SPECTRAL_SNAPSHOT_FIELD_NAMES
        )
    except Exception as error:
        raise JoinExtractionError(
            "join_spectral_snapshot_failed", type(error).__name__
        ) from error
    rho_raw, weights_raw, first_raw, second_raw = supplied[1:5]
    rho_exact = type(rho_raw) is tuple
    weights_exact = type(weights_raw) is tuple
    first_exact = type(first_raw) is tuple and all(
        type(row) is tuple for row in first_raw
    )
    second_exact = type(second_raw) is tuple and all(
        type(row) is tuple for row in second_raw
    )
    rho = tuple(item for item in rho_raw) if rho_exact else ()
    weights = tuple(item for item in weights_raw) if weights_exact else ()
    first = (
        tuple(tuple(item for item in row) for row in first_raw)
        if first_exact
        else ()
    )
    second = (
        tuple(tuple(item for item in row) for row in second_raw)
        if second_exact
        else ()
    )
    return _FrozenSpectralSnapshot(
        field_values=(supplied[0], rho, weights, first, second, *supplied[5:]),
        node_count=supplied[0],
        rho=rho,
        barycentric_weights=weights,
        first_derivative=first,
        second_derivative=second,
        primary_numerics_policy_sha256=supplied[5],
        primary_numerics_policy_canonical_size_bytes=supplied[6],
        calculation_implemented=supplied[13],
        false_field_values=tuple(supplied[14:]),
        exact_tuple_shape=(rho_exact and weights_exact and first_exact and second_exact),
    )


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise JoinExtractionError("join_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise JoinExtractionError("join_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise JoinExtractionError("join_binary64_negative_zero_input", detail)
    return value


def _spectral_payload_sha256(grid: _FrozenSpectralSnapshot) -> str:
    digest = hashlib.sha256()
    digest.update(SPECTRAL_PAYLOAD_GOLDEN_DOMAIN)
    digest.update(grid.node_count.to_bytes(8, "little"))
    for label, values in (
        (b"rho", grid.rho),
        (b"barycentric_weights", grid.barycentric_weights),
    ):
        digest.update(len(label).to_bytes(8, "little"))
        digest.update(label)
        digest.update(len(values).to_bytes(8, "little"))
        digest.update(struct.pack(f"<{len(values)}d", *values))
    for label, matrix in (
        (b"first_derivative_row_major", grid.first_derivative),
        (b"second_derivative_row_major", grid.second_derivative),
    ):
        digest.update(len(label).to_bytes(8, "little"))
        digest.update(label)
        digest.update((grid.node_count * grid.node_count).to_bytes(8, "little"))
        for row in matrix:
            digest.update(struct.pack(f"<{grid.node_count}d", *row))
    return digest.hexdigest()


def _validate_spectral_primitive(
    grid: _FrozenSpectralSnapshot,
) -> _FrozenSpectralSnapshot:
    if type(grid.node_count) is not int or grid.node_count != NODE_COUNT:
        raise JoinExtractionError("join_spectral_node_count_invalid", str(grid.node_count))
    if (
        SPECTRAL_POLICY_SHA256 != PRIMARY_NUMERICS_POLICY_SHA256
        or SPECTRAL_POLICY_SIZE != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or grid.primary_numerics_policy_sha256 != PRIMARY_NUMERICS_POLICY_SHA256
        or grid.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or grid.calculation_implemented is not True
    ):
        raise JoinExtractionError("join_spectral_binding_invalid")
    if any(value is not False for value in grid.false_field_values):
        raise JoinExtractionError("join_spectral_authority_lock_invalid")
    if any(value is not False for value in SPECTRAL_AUTHORITY_LOCKS.values()):
        raise JoinExtractionError("join_spectral_module_authority_lock_invalid")
    if (
        not grid.exact_tuple_shape
        or type(grid.rho) is not tuple
        or type(grid.barycentric_weights) is not tuple
        or type(grid.first_derivative) is not tuple
        or type(grid.second_derivative) is not tuple
        or len(grid.rho) != NODE_COUNT
        or len(grid.barycentric_weights) != NODE_COUNT
        or len(grid.first_derivative) != NODE_COUNT
        or len(grid.second_derivative) != NODE_COUNT
        or any(
            type(row) is not tuple or len(row) != NODE_COUNT
            for row in grid.first_derivative
        )
        or any(
            type(row) is not tuple or len(row) != NODE_COUNT
            for row in grid.second_derivative
        )
    ):
        raise JoinExtractionError("join_spectral_shape_invalid")
    for index, value in enumerate(grid.rho):
        _validate_f64(value, f"spectral.rho[{index}]")
    for index, value in enumerate(grid.barycentric_weights):
        _validate_f64(value, f"spectral.weight[{index}]")
    for matrix_name, matrix in (
        ("D", grid.first_derivative),
        ("D2", grid.second_derivative),
    ):
        for row_index, row in enumerate(matrix):
            for column_index, value in enumerate(row):
                _validate_f64(
                    value,
                    f"spectral.{matrix_name}[{row_index},{column_index}]",
                )
    if struct.pack("<d", grid.rho[0]) != bytes(8) or grid.rho[-1] != 1.0:
        raise JoinExtractionError("join_spectral_endpoint_invalid")
    if any(grid.rho[index] <= grid.rho[index - 1] for index in range(1, NODE_COUNT)):
        raise JoinExtractionError("join_spectral_order_invalid")
    if _spectral_payload_sha256(grid) != SPECTRAL_N128_PAYLOAD_SHA256:
        raise JoinExtractionError("join_spectral_payload_mismatch")
    return grid


def _validate_projected_state(projected_state: object) -> tuple[float, ...]:
    if type(projected_state) is not tuple or len(projected_state) != UNKNOWN_COUNT:
        raise JoinExtractionError("join_projected_state_shape_invalid")
    state = tuple(
        _validate_f64(value, f"projected_state[{index}]")
        for index, value in enumerate(projected_state)
    )
    if struct.pack("<d", state[NODE_COUNT - 1]) != bytes(8):
        raise JoinExtractionError("join_projected_u_infinity_not_positive_zero")
    if struct.pack("<d", state[2 * NODE_COUNT - 1]) != bytes(8):
        raise JoinExtractionError("join_projected_V_infinity_not_positive_zero")
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
            raise JoinExtractionError("join_mpfr_context_installation_failed")
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
        raise JoinExtractionError(
            "join_mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )


def _finish(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise JoinExtractionError("join_mpfr_nonfinite", operation)
    if gmpy2.is_zero(value):
        context.clear_flags()
        result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
        _check_flags(context, f"{operation}.canonical_zero")
        return result
    return value


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise JoinExtractionError("join_mpfr_set_ui_inexact", operation)
    return result


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise JoinExtractionError("join_mpfr_set_d_inexact", operation)
    return result


def _copy(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise JoinExtractionError("join_mpfr_copy_inexact", operation)
    return result


def _binary(
    context: gmpy2.context,
    operation: str,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
) -> gmpy2.mpfr:
    context.clear_flags()
    if operation.endswith(".add"):
        value = gmpy2.add(left, right)
    elif operation.endswith(".sub"):
        value = gmpy2.sub(left, right)
    elif operation.endswith(".mul"):
        value = gmpy2.mul(left, right)
    elif operation.endswith(".div"):
        if gmpy2.is_zero(right):
            raise JoinExtractionError("join_mpfr_division_by_zero", operation)
        value = gmpy2.div(left, right)
    else:
        raise JoinExtractionError("join_internal_operation_invalid", operation)
    return _finish(context, value, operation)


def _neg(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, -value, operation)


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise JoinExtractionError("join_binary64_nonfinite_result", operation)
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise JoinExtractionError("join_binary64_negative_zero_result", operation)
    return result


def _weight(
    context: gmpy2.context, index: int
) -> gmpy2.mpfr:
    magnitude = _set_ui(context, 1 if index in (0, NODE_COUNT - 1) else 2, "weight.set_ui")
    two = _set_ui(context, 2, "weight.two")
    unsigned = _binary(context, "weight.div", magnitude, two)
    return _neg(context, unsigned, "weight.neg") if index % 2 else _copy(
        context, unsigned, "weight.copy"
    )


def _field_at_join(
    context: gmpy2.context,
    join_rho: gmpy2.mpfr,
    nodes: tuple[float, ...],
    values: tuple[float, ...],
    field: str,
) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    sums = [_set_ui(context, 0, f"{field}.S{k}.zero") for k in range(4)]
    for index in range(NODE_COUNT):
        node = _set_d(context, nodes[index], f"{field}.node[{index}]")
        weight = _weight(context, index)
        value = _set_d(context, values[index], f"{field}.value[{index}]")
        difference = _binary(context, f"{field}.difference.sub", join_rho, node)
        if gmpy2.is_zero(difference):
            raise JoinExtractionError("join_exact_node_collision", f"{field}:{index}")
        difference_squared = _binary(
            context, f"{field}.difference_squared.mul", difference, difference
        )
        term_s0 = _binary(context, f"{field}.termS0.div", weight, difference)
        next_s0 = _binary(
            context,
            f"{field}.S0.add",
            sums[0],
            term_s0,
        )
        sums[0] = _copy(context, next_s0, f"{field}.S0.copy")

        weighted_value = _binary(
            context, f"{field}.weighted_value.mul", weight, value
        )
        term_s1 = _binary(
            context, f"{field}.termS1.div", weighted_value, difference
        )
        next_s1 = _binary(context, f"{field}.S1.add", sums[1], term_s1)
        sums[1] = _copy(context, next_s1, f"{field}.S1.copy")

        term_s2 = _binary(
            context, f"{field}.termS2.div", weight, difference_squared
        )
        next_s2 = _binary(context, f"{field}.S2.add", sums[2], term_s2)
        sums[2] = _copy(context, next_s2, f"{field}.S2.copy")

        term_s3 = _binary(
            context, f"{field}.termS3.div", weighted_value, difference_squared
        )
        next_s3 = _binary(context, f"{field}.S3.add", sums[3], term_s3)
        sums[3] = _copy(context, next_s3, f"{field}.S3.copy")
    q_at_join = _binary(context, f"{field}.q.div", sums[1], sums[0])
    q_times_s2 = _binary(context, f"{field}.q_times_s2.mul", q_at_join, sums[2])
    derivative_numerator = _binary(
        context, f"{field}.derivative_numerator.sub", q_times_s2, sums[3]
    )
    q_rho = _binary(context, f"{field}.q_rho.div", derivative_numerator, sums[0])
    one = _set_ui(context, 1, f"{field}.one")
    one_minus_rho = _binary(context, f"{field}.one_minus_rho.sub", one, join_rho)
    one_minus_rho_squared = _binary(
        context,
        f"{field}.one_minus_rho_squared.mul",
        one_minus_rho,
        one_minus_rho,
    )
    q_x = _binary(context, f"{field}.q_x.mul", q_rho, one_minus_rho_squared)
    return q_at_join, q_x


def extract_l2_join_barriers(
    spectral: FrozenLobattoSpectralPrimitive,
    projected_state: tuple[float, ...],
) -> FrozenL2JoinBarriers:
    """Compute U, U1, V, V1 without accepting the supplied L2 state."""

    _read_bound_spectral_source()
    grid = _validate_spectral_primitive(_snapshot_spectral_primitive(spectral))
    with _owned_mpfr256_context() as context:
        state = _validate_projected_state(projected_state)
        numerator = _set_ui(context, JOIN_RHO_NUMERATOR, "join_rho.numerator")
        denominator = _set_ui(context, JOIN_RHO_DENOMINATOR, "join_rho.denominator")
        join_rho = _binary(context, "join_rho.div", numerator, denominator)
        u_mp, u1_mp = _field_at_join(
            context, join_rho, grid.rho, state[:NODE_COUNT], "u"
        )
        U = _get_d(context, u_mp, "U.get_d")
        U1 = _get_d(context, u1_mp, "U1.get_d")
        v_mp, v1_mp = _field_at_join(
            context,
            join_rho,
            grid.rho,
            state[NODE_COUNT : 2 * NODE_COUNT],
            "V",
        )
        V = _get_d(context, v_mp, "V.get_d")
        V1 = _get_d(context, v1_mp, "V1.get_d")
    barriers = (U, U1, V, V1)
    for index, value in enumerate(barriers):
        _validate_f64(value, BARRIER_ORDER[index])
    return FrozenL2JoinBarriers(
        node_count=NODE_COUNT,
        join_x=JOIN_X,
        join_rho_exact="32/33",
        U=U,
        U1=U1,
        V=V,
        V1=V1,
        barrier_values=barriers,
        barrier_order=BARRIER_ORDER,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=SPECTRAL_N128_PAYLOAD_SHA256,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        mpfr_emin=MPFR_EMIN,
        mpfr_emax=MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )


if (
    NODE_COUNT != 128
    or UNKNOWN_COUNT != 257
    or (JOIN_X, JOIN_RHO_NUMERATOR, JOIN_RHO_DENOMINATOR) != (32, 32, 33)
    or BARRIER_ORDER != ("U", "U1", "V", "V1")
    or tuple(FrozenLobattoSpectralPrimitive.__dataclass_fields__)
    != _SPECTRAL_SNAPSHOT_FIELD_NAMES
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_l2_join_extraction_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BARRIER_ORDER",
    "FrozenL2JoinBarriers",
    "JOIN_EXTRACTION_VERSION",
    "JOIN_OPERATION_GRAPH",
    "JOIN_RHO_DENOMINATOR",
    "JOIN_RHO_NUMERATOR",
    "JOIN_X",
    "JoinExtractionError",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "NODE_COUNT",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "SPECTRAL_N128_PAYLOAD_SHA256",
    "SPECTRAL_SOURCE_SHA256",
    "SPECTRAL_SOURCE_SIZE_BYTES",
    "extract_l2_join_barriers",
]
