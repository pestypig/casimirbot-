"""Frozen one-live-operator MPFR256 transfer between accepted core levels.

Only the two preregistered diagnostic transitions, L0 to L1 and L1 to L2,
are implemented.  The production boundary consumes an immutable archived
source-rho tuple, a state in the projected-accepted-state role, and the single
live target spectral primitive.  It never accepts, generates, or reads a
simultaneous source spectral primitive or source D/D2 matrices and clears no
caller-owned state.  This primitive does not establish source acceptance,
solve any equation, select a candidate, retry, filter, publish, or confer
scientific authority.
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


LEVEL_TRANSFER_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_accepted_level_transfer/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
PRIMARY_NUMERICS_POLICY_SHA256_DOMAIN: Final[str] = (
    "nhm2-spherical-boson-star-newtonian-seed-primary-numerics/v1\n"
)
SPECTRAL_SOURCE_SHA256: Final[str] = (
    "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7"
)
SPECTRAL_SOURCE_SIZE_BYTES: Final[int] = 19_045
SPECTRAL_PAYLOAD_GOLDEN_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed-primary-spectral/golden/v1\n"
)
SPECTRAL_PAYLOAD_GOLDEN_HASHES: Final = MappingProxyType(
    {
        64: "83f63880c10f9aafae4d3c173cbb11fabd1baecf1a67c29c3b3f75636536a680",
        96: "33a584aeacfaa92b0fc2bf642ed6e8f5a2ab67f5692d0a37c056e510aa35b8e3",
        128: "9997d1ede86739b4716d838f287f5aaca27edba3fb52748ad0ac48a6e62f7c45",
    }
)
SOURCE_RHO_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/transfer-rho-f64le/v1\n"
)
SOURCE_RHO_PAYLOAD_GOLDEN_HASHES: Final = MappingProxyType(
    {
        64: "ba32f26043e32131bd12a672de28d1cb6eadf0d5d12f9ffd690ed5558f24d362",
        96: "8766de10d18a94211c450c51d7f701d0a9ed3e54e88173e22898a68168c00bdd",
    }
)

LEVEL_NODE_COUNTS: Final = MappingProxyType({"L0": 64, "L1": 96, "L2": 128})
ACCEPTED_TRANSFER_PAIRS: Final = MappingProxyType(
    {(64, 96): ("L0", "L1"), (96, 128): ("L1", "L2")}
)
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
FIELD_TRANSFER_ORDER: Final[tuple[str, ...]] = ("u", "V", "nu_bits")
EXACT_NODE_MATCH_GRAPH: Final[str] = (
    "target_i_increasing;compare_target_rho64_bits_to_source_rho64_bits_"
    "source_j_increasing;copy_lowest_exact_match_value_bits"
)
SOURCE_WEIGHT_GRAPH: Final[str] = (
    "source_j_increasing;weightMagnitude=1_at_endpoints_else_2;divide_by_2;"
    "negate_odd_j"
)
BARYCENTRIC_OPERATION_GRAPH: Final[str] = (
    "validate_archived_source_rho_without_source_operator;privately_snapshot_"
    "only_live_target_operator;field_u_then_V;target_i_increasing;otherwise_set_d_rhoOut;set_ui_"
    "numerator_0_then_denominator_0;source_j_increasing:set_d_rhoIn_then_"
    "literal_source_weight_then_sub_difference_then_div_ratio_then_set_d_"
    "qNode_then_mul_weightedValue_then_add_and_copy_numerator_then_add_and_"
    "copy_denominator;divide_numerator_by_denominator;one_get_d;copy_exact_"
    "nu_bits_last"
)


class LevelTransferError(ValueError):
    """Fail-closed typed error for the bounded level-transfer primitive."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_SPECTRAL_PATH: Final[Path] = Path(__file__).resolve().with_name("spectral.py")


def _read_bound_spectral_source() -> bytes:
    try:
        source = _SPECTRAL_PATH.read_bytes()
    except OSError as error:
        raise LevelTransferError(
            "transfer_spectral_source_binding_unavailable", type(error).__name__
        ) from error
    if len(source) != SPECTRAL_SOURCE_SIZE_BYTES:
        raise LevelTransferError("transfer_spectral_source_binding_mismatch", "size")
    if hashlib.sha256(source).hexdigest() != SPECTRAL_SOURCE_SHA256:
        raise LevelTransferError("transfer_spectral_source_binding_mismatch", "sha256")
    return source


def _load_bound_spectral_module() -> ModuleType:
    source = _read_bound_spectral_source()
    module = ModuleType(
        "_nhm2_spherical_seed_transfer_spectral_e9b2509b0c4a5d41"
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
        raise LevelTransferError(
            "transfer_spectral_private_load_failed", type(error).__name__
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
        raise LevelTransferError("transfer_spectral_module_origin_mismatch", "path")
    return module


_spectral_module = _load_bound_spectral_module()

FrozenLobattoSpectralPrimitive = _spectral_module.FrozenLobattoSpectralPrimitive
SPECTRAL_AUTHORITY_LOCKS = _spectral_module.AUTHORITY_LOCKS
SPECTRAL_POLICY_SHA256 = _spectral_module.PRIMARY_NUMERICS_POLICY_SHA256
SPECTRAL_POLICY_SIZE = (
    _spectral_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
)


@dataclass(frozen=True, slots=True)
class FrozenAcceptedLevelTransfer:
    source_level: str
    target_level: str
    source_node_count: int
    target_node_count: int
    state: tuple[float, ...]
    u: tuple[float, ...]
    potential: tuple[float, ...]
    nu: float
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    spectral_source_sha256: str
    spectral_source_size_bytes: int
    source_rho_payload_sha256: str
    target_spectral_payload_sha256: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    field_transfer_order: tuple[str, ...] = FIELD_TRANSFER_ORDER
    calculation_implemented: bool = True
    source_acceptance_verified: bool = False
    solve_performed: bool = False
    restart_performed: bool = False
    alternate_interpolation_used: bool = False
    filtering_used: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    candidate_output_materialized: bool = False
    output_present: bool = False
    output_accepted: bool = False
    seed_accepted: bool = False
    branch_accepted: bool = False
    replay_authority: bool = False
    independent_agreement: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "primaryNumericsSemanticAuthority": False,
        "sourceStateAcceptanceVerified": False,
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
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool
    false_field_values: tuple[object, ...]
    exact_tuple_shape: bool


def _snapshot_spectral_primitive(
    value: object, role: str
) -> _FrozenSpectralSnapshot:
    if type(value) is not FrozenLobattoSpectralPrimitive:
        raise LevelTransferError(
            "transfer_spectral_primitive_type_invalid",
            f"{role}:{type(value).__name__}",
        )
    try:
        supplied = tuple(
            getattr(value, field_name)
            for field_name in _SPECTRAL_SNAPSHOT_FIELD_NAMES
        )
    except Exception as error:
        raise LevelTransferError(
            "transfer_spectral_snapshot_failed",
            f"{role}:{type(error).__name__}",
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
        mpfr_precision_bits=supplied[7],
        mpfr_rounding_mode=supplied[8],
        mpfr_emin=supplied[9],
        mpfr_emax=supplied[10],
        observed_gmpy2_version=supplied[11],
        observed_mpfr_version=supplied[12],
        calculation_implemented=supplied[13],
        false_field_values=tuple(supplied[14:]),
        exact_tuple_shape=(rho_exact and weights_exact and first_exact and second_exact),
    )


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _f64_bits(value: float) -> bytes:
    return struct.pack("<d", value)


def _copy_f64_bits(value: float) -> float:
    return struct.unpack("<d", _f64_bits(value))[0]


def _verify_literal_bindings() -> None:
    if (
        PRIMARY_NUMERICS_POLICY_SHA256 != SPECTRAL_POLICY_SHA256
        or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != SPECTRAL_POLICY_SIZE
    ):
        raise LevelTransferError(
            "transfer_primary_numerics_policy_binding_mismatch", "spectral"
        )
    _read_bound_spectral_source()


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise LevelTransferError("transfer_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise LevelTransferError("transfer_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise LevelTransferError("transfer_binary64_negative_zero_input", detail)
    return value


def _spectral_payload_sha256(grid: _FrozenSpectralSnapshot) -> str:
    count = grid.node_count
    digest = hashlib.sha256()
    digest.update(SPECTRAL_PAYLOAD_GOLDEN_DOMAIN)
    digest.update(count.to_bytes(8, "little", signed=False))
    for label, values in (
        (b"rho", grid.rho),
        (b"barycentric_weights", grid.barycentric_weights),
    ):
        digest.update(len(label).to_bytes(8, "little", signed=False))
        digest.update(label)
        digest.update(len(values).to_bytes(8, "little", signed=False))
        digest.update(struct.pack(f"<{len(values)}d", *values))
    for label, matrix in (
        (b"first_derivative_row_major", grid.first_derivative),
        (b"second_derivative_row_major", grid.second_derivative),
    ):
        digest.update(len(label).to_bytes(8, "little", signed=False))
        digest.update(label)
        digest.update((count * count).to_bytes(8, "little", signed=False))
        for row in matrix:
            digest.update(struct.pack(f"<{count}d", *row))
    return digest.hexdigest()


def _source_rho_payload_sha256(values: tuple[float, ...]) -> str:
    digest = hashlib.sha256()
    digest.update(SOURCE_RHO_HASH_DOMAIN)
    digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _validate_archived_source_rho(
    value: object,
    source_level: object,
) -> tuple[tuple[float, ...], int, str]:
    if type(source_level) is not str:
        raise LevelTransferError(
            "transfer_source_level_invalid", type(source_level).__name__
        )
    if source_level not in ("L0", "L1"):
        raise LevelTransferError("transfer_source_level_invalid", source_level)
    source_count = LEVEL_NODE_COUNTS[source_level]
    if type(value) is not tuple:
        raise LevelTransferError(
            "transfer_source_rho_type_invalid", type(value).__name__
        )
    if len(value) != source_count:
        raise LevelTransferError(
            "transfer_source_rho_length_invalid",
            f"{len(value)}!={source_count}",
        )
    source_nodes = tuple(
        _copy_f64_bits(_validate_f64(component, f"source_rho[{index}]"))
        for index, component in enumerate(value)
    )
    if _f64_bits(source_nodes[0]) != bytes(8) or _f64_bits(
        source_nodes[-1]
    ) != _f64_bits(1.0):
        raise LevelTransferError(
            "transfer_source_rho_endpoint_invalid", source_level
        )
    if any(
        source_nodes[index] <= source_nodes[index - 1]
        for index in range(1, source_count)
    ):
        raise LevelTransferError(
            "transfer_source_rho_order_invalid", source_level
        )
    observed = _source_rho_payload_sha256(source_nodes)
    if observed != SOURCE_RHO_PAYLOAD_GOLDEN_HASHES[source_count]:
        raise LevelTransferError(
            "transfer_source_rho_payload_mismatch", source_level
        )
    return source_nodes, source_count, observed


def _validate_spectral_primitive(
    grid: _FrozenSpectralSnapshot, role: str
) -> tuple[_FrozenSpectralSnapshot, str]:
    count = grid.node_count
    if type(count) is not int:
        raise LevelTransferError(
            "transfer_spectral_node_count_invalid",
            f"{role}:{type(count).__name__}",
        )
    if count not in SPECTRAL_PAYLOAD_GOLDEN_HASHES:
        raise LevelTransferError(
            "transfer_spectral_node_count_invalid", f"{role}:{count}"
        )
    if (
        type(grid.primary_numerics_policy_sha256) is not str
        or grid.primary_numerics_policy_sha256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or type(grid.primary_numerics_policy_canonical_size_bytes) is not int
        or grid.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise LevelTransferError(
            "transfer_spectral_policy_binding_mismatch", f"{role}:{count}"
        )
    if (
        type(grid.mpfr_precision_bits) is not int
        or grid.mpfr_precision_bits != MPFR_PRECISION_BITS
        or type(grid.mpfr_rounding_mode) is not str
        or grid.mpfr_rounding_mode != MPFR_ROUNDING_MODE
        or type(grid.mpfr_emin) is not int
        or grid.mpfr_emin != MPFR_EMIN
        or type(grid.mpfr_emax) is not int
        or grid.mpfr_emax != MPFR_EMAX
        or type(grid.observed_gmpy2_version) is not str
        or grid.observed_gmpy2_version != gmpy2.version()
        or type(grid.observed_mpfr_version) is not str
        or grid.observed_mpfr_version != gmpy2.mpfr_version()
    ):
        raise LevelTransferError(
            "transfer_spectral_context_binding_mismatch", f"{role}:{count}"
        )
    if grid.calculation_implemented is not True:
        raise LevelTransferError(
            "transfer_spectral_calculation_absent", f"{role}:{count}"
        )
    if any(value is not False for value in grid.false_field_values):
        raise LevelTransferError(
            "transfer_spectral_authority_lock_invalid", f"{role}:{count}"
        )
    if any(value is not False for value in SPECTRAL_AUTHORITY_LOCKS.values()):
        raise LevelTransferError(
            "transfer_spectral_module_authority_lock_invalid", f"{role}:{count}"
        )
    if (
        not grid.exact_tuple_shape
        or type(grid.rho) is not tuple
        or type(grid.barycentric_weights) is not tuple
        or type(grid.first_derivative) is not tuple
        or type(grid.second_derivative) is not tuple
        or len(grid.rho) != count
        or len(grid.barycentric_weights) != count
        or len(grid.first_derivative) != count
        or len(grid.second_derivative) != count
        or any(type(row) is not tuple or len(row) != count for row in grid.first_derivative)
        or any(type(row) is not tuple or len(row) != count for row in grid.second_derivative)
    ):
        raise LevelTransferError("transfer_spectral_shape_invalid", f"{role}:{count}")
    for index, value in enumerate(grid.rho):
        _validate_f64(value, f"{role}.rho[{index}]")
    for index, value in enumerate(grid.barycentric_weights):
        _validate_f64(value, f"{role}.weight[{index}]")
    for matrix_name, matrix in (
        ("D", grid.first_derivative),
        ("D2", grid.second_derivative),
    ):
        for row_index, row in enumerate(matrix):
            for column_index, value in enumerate(row):
                _validate_f64(
                    value,
                    f"{role}.{matrix_name}[{row_index},{column_index}]",
                )
    if _f64_bits(grid.rho[0]) != bytes(8) or grid.rho[-1] != 1.0:
        raise LevelTransferError(
            "transfer_spectral_endpoint_invalid", f"{role}:{count}"
        )
    if any(grid.rho[index] <= grid.rho[index - 1] for index in range(1, count)):
        raise LevelTransferError(
            "transfer_spectral_order_invalid", f"{role}:{count}"
        )
    observed = _spectral_payload_sha256(grid)
    if observed != SPECTRAL_PAYLOAD_GOLDEN_HASHES[count]:
        raise LevelTransferError(
            "transfer_spectral_payload_mismatch", f"{role}:{count}"
        )
    return grid, observed


def _validate_source_state(state: object, source_count: int) -> tuple[float, ...]:
    expected = 2 * source_count + 1
    if type(state) is not tuple:
        raise LevelTransferError(
            "transfer_source_state_type_invalid", type(state).__name__
        )
    if len(state) != expected:
        raise LevelTransferError(
            "transfer_source_state_length_invalid", f"{len(state)}!={expected}"
        )
    for index, value in enumerate(state):
        _validate_f64(value, f"source_state[{index}]")
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
            raise LevelTransferError("transfer_mpfr_context_installation_failed")
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
        raise LevelTransferError(
            "transfer_mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )


def _positive_zero(context: gmpy2.context, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    value = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, operation)
    if not gmpy2.is_zero(value) or gmpy2.is_signed(value):
        raise LevelTransferError("transfer_mpfr_positive_zero_failure", operation)
    return value


def _finish(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise LevelTransferError("transfer_mpfr_nonfinite", operation)
    return _positive_zero(context, operation) if gmpy2.is_zero(value) else value


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise LevelTransferError("transfer_set_ui_domain_invalid", operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise LevelTransferError("transfer_set_ui_inexact", operation)
    return result


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    _validate_f64(value, operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise LevelTransferError("transfer_set_d_inexact", operation)
    return result


def _copy(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise LevelTransferError("transfer_copy_inexact", operation)
    return result


def _add(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.add(left, right), operation)


def _sub(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.sub(left, right), operation)


def _mul(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.mul(left, right), operation)


def _div(
    context: gmpy2.context,
    numerator: gmpy2.mpfr,
    denominator: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    if gmpy2.is_zero(denominator):
        raise LevelTransferError("transfer_mpfr_division_by_zero", operation)
    context.clear_flags()
    return _finish(context, gmpy2.div(numerator, denominator), operation)


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
        raise LevelTransferError("transfer_binary64_nonfinite_result", operation)
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise LevelTransferError("transfer_binary64_negative_zero_result", operation)
    return result


def _source_weight(
    context: gmpy2.context, source_index: int, source_count: int
) -> gmpy2.mpfr:
    magnitude = _set_ui(
        context,
        1 if source_index in (0, source_count - 1) else 2,
        "weight.set_magnitude",
    )
    two = _set_ui(context, 2, "weight.set_two")
    unsigned = _div(context, magnitude, two, "weight.div_two")
    return (
        _neg(context, unsigned, "weight.negate_odd")
        if source_index % 2
        else _copy(context, unsigned, "weight.copy_even")
    )


def _lowest_exact_node_match(
    target_node: float, source_nodes: tuple[float, ...]
) -> int | None:
    target_bits = _f64_bits(target_node)
    for source_index, source_node in enumerate(source_nodes):
        if _f64_bits(source_node) == target_bits:
            return source_index
    return None


def _interpolate_field(
    context: gmpy2.context,
    source_nodes: tuple[float, ...],
    target_nodes: tuple[float, ...],
    source_values: tuple[float, ...],
    field: str,
) -> tuple[float, ...]:
    source_count = len(source_nodes)
    output: list[float] = []
    for target_index, target_node in enumerate(target_nodes):
        exact_index = _lowest_exact_node_match(target_node, source_nodes)
        if exact_index is not None:
            output.append(_copy_f64_bits(source_values[exact_index]))
            continue

        rho_out = _set_d(context, target_node, f"{field}.rho_out[{target_index}]")
        numerator = _set_ui(context, 0, f"{field}.numerator.set_zero[{target_index}]")
        denominator = _set_ui(
            context, 0, f"{field}.denominator.set_zero[{target_index}]"
        )
        for source_index in range(source_count):
            rho_in = _set_d(
                context,
                source_nodes[source_index],
                f"{field}.rho_in[{target_index},{source_index}]",
            )
            weight = _source_weight(context, source_index, source_count)
            difference = _sub(
                context,
                rho_out,
                rho_in,
                f"{field}.difference[{target_index},{source_index}]",
            )
            ratio = _div(
                context,
                weight,
                difference,
                f"{field}.ratio[{target_index},{source_index}]",
            )
            q_node = _set_d(
                context,
                source_values[source_index],
                f"{field}.q_node[{target_index},{source_index}]",
            )
            weighted_value = _mul(
                context,
                ratio,
                q_node,
                f"{field}.weighted_value[{target_index},{source_index}]",
            )
            next_numerator = _add(
                context,
                numerator,
                weighted_value,
                f"{field}.numerator.add[{target_index},{source_index}]",
            )
            numerator = _copy(
                context,
                next_numerator,
                f"{field}.numerator.copy[{target_index},{source_index}]",
            )
            next_denominator = _add(
                context,
                denominator,
                ratio,
                f"{field}.denominator.add[{target_index},{source_index}]",
            )
            denominator = _copy(
                context,
                next_denominator,
                f"{field}.denominator.copy[{target_index},{source_index}]",
            )
        value = _div(
            context,
            numerator,
            denominator,
            f"{field}.final_div[{target_index}]",
        )
        output.append(_get_d(context, value, f"{field}.get_d[{target_index}]"))
    return tuple(output)


def _validate_output(
    state: tuple[float, ...],
    u: tuple[float, ...],
    potential: tuple[float, ...],
    nu: float,
    target_count: int,
    source_nu: float,
) -> None:
    if (
        type(state) is not tuple
        or type(u) is not tuple
        or type(potential) is not tuple
        or len(state) != 2 * target_count + 1
        or len(u) != target_count
        or len(potential) != target_count
        or state != (*u, *potential, nu)
    ):
        raise LevelTransferError("transfer_output_shape_invariant", str(target_count))
    for index, value in enumerate(state):
        _validate_f64(value, f"output[{index}]")
    if _f64_bits(nu) != _f64_bits(source_nu):
        raise LevelTransferError("transfer_nu_bit_copy_invariant")


def transfer_accepted_level_state(
    *,
    source_level: str,
    archived_source_rho: tuple[float, ...],
    projected_source_state: tuple[float, ...],
    target_spectral: FrozenLobattoSpectralPrimitive,
) -> FrozenAcceptedLevelTransfer:
    """Transfer from immutable source archives using only the live target grid."""

    _verify_literal_bindings()
    with _owned_mpfr256_context() as context:
        # Install the complete arithmetic context before the first archived
        # source-rho, target-operator, or accepted source-state numeric read.
        source_nodes, source_count, source_rho_payload = (
            _validate_archived_source_rho(
                archived_source_rho,
                source_level,
            )
        )
        target_snapshot = _snapshot_spectral_primitive(
            target_spectral,
            "target",
        )
        target_grid, target_payload = _validate_spectral_primitive(
            target_snapshot,
            "target",
        )
        pair = (source_count, target_grid.node_count)
        expected_levels = ACCEPTED_TRANSFER_PAIRS.get(pair)
        if expected_levels is None or expected_levels[0] != source_level:
            raise LevelTransferError(
                "transfer_level_pair_invalid", f"{source_count}->{pair[1]}"
            )
        state = _validate_source_state(projected_source_state, source_count)
        source_u = state[:source_count]
        source_potential = state[source_count : 2 * source_count]
        source_nu = state[2 * source_count]
        # This explicit chronology is part of the frozen graph.
        u = _interpolate_field(
            context, source_nodes, target_grid.rho, source_u, "u"
        )
        potential = _interpolate_field(
            context,
            source_nodes,
            target_grid.rho,
            source_potential,
            "V",
        )
        nu = _copy_f64_bits(source_nu)

    transferred_state = (*u, *potential, nu)
    _validate_output(
        transferred_state,
        u,
        potential,
        nu,
        target_grid.node_count,
        source_nu,
    )
    bound_source_level, target_level = ACCEPTED_TRANSFER_PAIRS[pair]
    if bound_source_level != source_level:
        raise LevelTransferError("transfer_source_level_postcondition_invalid")
    return FrozenAcceptedLevelTransfer(
        source_level=source_level,
        target_level=target_level,
        source_node_count=source_count,
        target_node_count=target_grid.node_count,
        state=transferred_state,
        u=u,
        potential=potential,
        nu=nu,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=SPECTRAL_SOURCE_SIZE_BYTES,
        source_rho_payload_sha256=source_rho_payload,
        target_spectral_payload_sha256=target_payload,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        mpfr_emin=MPFR_EMIN,
        mpfr_emax=MPFR_EMAX,
    )


if (
    tuple(LEVEL_NODE_COUNTS.items()) != (("L0", 64), ("L1", 96), ("L2", 128))
    or tuple(ACCEPTED_TRANSFER_PAIRS) != ((64, 96), (96, 128))
    or tuple(SPECTRAL_PAYLOAD_GOLDEN_HASHES) != (64, 96, 128)
    or tuple(SOURCE_RHO_PAYLOAD_GOLDEN_HASHES) != (64, 96)
    or tuple(FrozenLobattoSpectralPrimitive.__dataclass_fields__)
    != _SPECTRAL_SNAPSHOT_FIELD_NAMES
    or FIELD_TRANSFER_ORDER != ("u", "V", "nu_bits")
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_accepted_level_transfer_invariant")


__all__ = [
    "ACCEPTED_TRANSFER_PAIRS",
    "AUTHORITY_LOCKS",
    "BARYCENTRIC_OPERATION_GRAPH",
    "EXACT_NODE_MATCH_GRAPH",
    "FIELD_TRANSFER_ORDER",
    "FrozenAcceptedLevelTransfer",
    "LEVEL_NODE_COUNTS",
    "LEVEL_TRANSFER_VERSION",
    "LevelTransferError",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRIMARY_NUMERICS_POLICY_SHA256_DOMAIN",
    "SOURCE_WEIGHT_GRAPH",
    "SOURCE_RHO_HASH_DOMAIN",
    "SOURCE_RHO_PAYLOAD_GOLDEN_HASHES",
    "SPECTRAL_PAYLOAD_GOLDEN_DOMAIN",
    "SPECTRAL_PAYLOAD_GOLDEN_HASHES",
    "SPECTRAL_SOURCE_SHA256",
    "SPECTRAL_SOURCE_SIZE_BYTES",
    "transfer_accepted_level_state",
]
