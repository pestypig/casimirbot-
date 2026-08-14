"""Frozen primary core residual and analytic-Jacobian evaluator.

This module consumes one already sealed Lobatto spectral primitive and one
synthetic binary64 state.  It implements only the N=64/96/128 core finite
operation graph; it does not initialize, iterate, solve, project, publish, or
accept a candidate and does not confer scientific or execution authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Final

CORE_OPERATOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_core_operator/v1"
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
BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980
CORE_NODE_COUNTS: Final[tuple[int, ...]] = (64, 96, 128)
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

CORE_RESIDUAL_OPERATION_GRAPH: Final[str] = (
    "allocate_positive_zero_F_and_J;S_i_increasing_then_P_i_increasing_then_A;"
    "dot_products_j_increasing_mul_then_add;interior_radial_L_literal_grouping;"
    "canonicalize_each_primitive_zero"
)
CORE_JACOBIAN_OPERATION_GRAPH: Final[str] = (
    "after_complete_F_fill_analytic_J_rows_0_through_2N_then_columns_0_through_"
    "2N;literal_Lij_scalar_and_poisson_derivatives;no_numeric_differentiation"
)
CORE_DOMAIN_GRAPH: Final[str] = (
    "after_complete_F_and_J_require_nu_lt_zero_then_round64(2^-10*nu)_gt_-1/2_"
    "then_lt_zero_then_all_state_residual_and_J_entries_finite"
)


class CoreOperatorError(ValueError):
    """Fail-closed core primitive error with a stable code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_PRODUCER_ROOT: Final[Path] = Path(__file__).resolve().parent
_BINARY64_ENVIRONMENT_PATH: Final[Path] = _PRODUCER_ROOT / "binary64_environment.py"
_SPECTRAL_PATH: Final[Path] = _PRODUCER_ROOT / "spectral.py"


def _read_bound_binary64_environment_source() -> bytes:
    try:
        source = _BINARY64_ENVIRONMENT_PATH.read_bytes()
    except OSError as error:
        raise CoreOperatorError(
            "binary64_environment_source_binding_unavailable", type(error).__name__
        ) from error
    if len(source) != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES:
        raise CoreOperatorError(
            "binary64_environment_source_binding_mismatch", "size"
        )
    if hashlib.sha256(source).hexdigest() != BINARY64_ENVIRONMENT_SOURCE_SHA256:
        raise CoreOperatorError(
            "binary64_environment_source_binding_mismatch", "sha256"
        )
    return source


def _read_bound_spectral_source() -> bytes:
    try:
        source = _SPECTRAL_PATH.read_bytes()
    except OSError as error:
        raise CoreOperatorError(
            "spectral_source_binding_unavailable", type(error).__name__
        ) from error
    if len(source) != SPECTRAL_SOURCE_SIZE_BYTES:
        raise CoreOperatorError("spectral_source_binding_mismatch", "size")
    if hashlib.sha256(source).hexdigest() != SPECTRAL_SOURCE_SHA256:
        raise CoreOperatorError("spectral_source_binding_mismatch", "sha256")
    return source


def _load_bound_binary64_environment() -> ModuleType:
    source = _read_bound_binary64_environment_source()
    module = ModuleType(
        "_nhm2_spherical_seed_core_bound_binary64_environment"
    )
    module.__file__ = str(_BINARY64_ENVIRONMENT_PATH)
    module.__package__ = ""
    try:
        code = compile(
            source,
            str(_BINARY64_ENVIRONMENT_PATH),
            "exec",
            dont_inherit=True,
            optimize=0,
        )
        exec(code, module.__dict__)
    except Exception as error:
        raise CoreOperatorError(
            "binary64_environment_source_execution_failed", type(error).__name__
        ) from error
    if (
        not isinstance(getattr(module, "__file__", None), str)
        or Path(module.__file__).resolve() != _BINARY64_ENVIRONMENT_PATH
    ):
        raise CoreOperatorError("binary64_environment_module_origin_mismatch", "path")
    return module


def _load_bound_spectral_module() -> ModuleType:
    source = _read_bound_spectral_source()
    module = ModuleType(
        "_nhm2_spherical_seed_core_operator_spectral_e9b2509b0c4a5d41"
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
        raise CoreOperatorError(
            "spectral_private_load_failed", type(error).__name__
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
        raise CoreOperatorError("spectral_module_origin_mismatch", "path")
    return module


# Execute the already-authenticated bytes in a private module object.  A public
# sys.modules entry cannot substitute an identically named no-op implementation.
_binary64_environment_module = _load_bound_binary64_environment()

BINARY64_RUNTIME_FAMILY = _binary64_environment_module.BINARY64_RUNTIME_FAMILY
nearest_binary64_environment = (
    _binary64_environment_module.nearest_binary64_environment
)

_spectral_module = _load_bound_spectral_module()

SPECTRAL_AUTHORITY_LOCKS = _spectral_module.AUTHORITY_LOCKS
FrozenLobattoSpectralPrimitive = _spectral_module.FrozenLobattoSpectralPrimitive
SPECTRAL_POLICY_SIZE = (
    _spectral_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
)
SPECTRAL_POLICY_SHA256 = _spectral_module.PRIMARY_NUMERICS_POLICY_SHA256


@dataclass(frozen=True, slots=True)
class FrozenCoreOperatorEvaluation:
    node_count: int
    unknown_count: int
    residual: tuple[float, ...]
    jacobian: tuple[tuple[float, ...], ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    spectral_source_sha256: str
    spectral_source_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    spectral_payload_sha256: str
    binary64_runtime_family: str
    residual_row_order: str = "S[0..N-1],P[0..N-1],A"
    unknown_order: str = "u[0..N-1],V[0..N-1],nu"
    analytic_jacobian: bool = True
    calculation_implemented: bool = True
    domain_valid: bool = True
    newton_implemented: bool = False
    solve_performed: bool = False
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


@dataclass(frozen=True, slots=True)
class FrozenCoreResidualEvaluation:
    """Residual-only projection-gate evaluation with no Jacobian allocation."""

    node_count: int
    unknown_count: int
    residual: tuple[float, ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    spectral_source_sha256: str
    spectral_source_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    spectral_payload_sha256: str
    binary64_runtime_family: str
    residual_row_order: str = "S[0..N-1],P[0..N-1],A"
    projected_gate_only: bool = True
    jacobian_materialized: bool = False
    calculation_implemented: bool = True
    solve_performed: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
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
    calculation_implemented: bool
    false_field_values: tuple[object, ...]
    exact_tuple_shape: bool


def _snapshot_spectral_primitive(value: object) -> _FrozenSpectralSnapshot:
    if type(value) is not FrozenLobattoSpectralPrimitive:
        raise CoreOperatorError(
            "core_spectral_primitive_type_invalid", type(value).__name__
        )
    try:
        supplied = tuple(
            getattr(value, field_name)
            for field_name in _SPECTRAL_SNAPSHOT_FIELD_NAMES
        )
    except Exception as error:
        raise CoreOperatorError(
            "core_spectral_snapshot_failed", type(error).__name__
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
    return value == 0.0 and struct.pack("<d", value) == b"\x00\x00\x00\x00\x00\x00\x00\x80"


def _verify_literal_bindings() -> None:
    if (
        PRIMARY_NUMERICS_POLICY_SHA256 != SPECTRAL_POLICY_SHA256
        or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != SPECTRAL_POLICY_SIZE
    ):
        raise CoreOperatorError("primary_numerics_policy_binding_mismatch", "spectral")
    _read_bound_binary64_environment_source()
    _read_bound_spectral_source()


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise CoreOperatorError("core_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise CoreOperatorError("core_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise CoreOperatorError("core_binary64_negative_zero_input", detail)
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


def _validate_spectral_primitive(
    grid: _FrozenSpectralSnapshot,
) -> _FrozenSpectralSnapshot:
    count = grid.node_count
    if type(count) is not int or count not in CORE_NODE_COUNTS:
        raise CoreOperatorError("core_spectral_node_count_invalid", repr(count))
    if (
        grid.primary_numerics_policy_sha256 != PRIMARY_NUMERICS_POLICY_SHA256
        or grid.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise CoreOperatorError("core_spectral_policy_binding_mismatch", str(count))
    if grid.calculation_implemented is not True:
        raise CoreOperatorError("core_spectral_calculation_absent", str(count))
    if any(value is not False for value in grid.false_field_values):
        raise CoreOperatorError("core_spectral_authority_lock_invalid", str(count))
    if any(value is not False for value in SPECTRAL_AUTHORITY_LOCKS.values()):
        raise CoreOperatorError("core_spectral_module_authority_lock_invalid", str(count))

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
    ):
        raise CoreOperatorError("core_spectral_shape_invalid", str(count))
    for matrix_name, matrix in (
        ("D", grid.first_derivative),
        ("D2", grid.second_derivative),
    ):
        if any(type(row) is not tuple or len(row) != count for row in matrix):
            raise CoreOperatorError("core_spectral_shape_invalid", matrix_name)
    for index, value in enumerate(grid.rho):
        _validate_f64(value, f"rho[{index}]")
    for index, value in enumerate(grid.barycentric_weights):
        _validate_f64(value, f"weight[{index}]")
    for matrix_name, matrix in (
        ("D", grid.first_derivative),
        ("D2", grid.second_derivative),
    ):
        for row in range(count):
            for column in range(count):
                _validate_f64(matrix[row][column], f"{matrix_name}[{row},{column}]")
    if struct.pack("<d", grid.rho[0]) != bytes(8) or grid.rho[-1] != 1.0:
        raise CoreOperatorError("core_spectral_endpoint_invalid", str(count))
    if any(grid.rho[index] <= grid.rho[index - 1] for index in range(1, count)):
        raise CoreOperatorError("core_spectral_order_invalid", str(count))
    observed_payload_sha256 = _spectral_payload_sha256(grid)
    if observed_payload_sha256 != SPECTRAL_PAYLOAD_GOLDEN_HASHES[count]:
        raise CoreOperatorError("core_spectral_payload_mismatch", str(count))
    return grid


def _validate_state(state: object, count: int) -> tuple[float, ...]:
    expected = 2 * count + 1
    if type(state) is not tuple:
        raise CoreOperatorError("core_state_type_invalid", type(state).__name__)
    if len(state) != expected:
        raise CoreOperatorError("core_state_length_invalid", f"{len(state)}!={expected}")
    for index, value in enumerate(state):
        _validate_f64(value, f"z[{index}]")
    return state


def _finish(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise CoreOperatorError("core_binary64_nonfinite_intermediate", operation)
    return 0.0 if value == 0.0 else value


def _add(left: float, right: float, operation: str) -> float:
    return _finish(left + right, operation)


def _sub(left: float, right: float, operation: str) -> float:
    return _finish(left - right, operation)


def _mul(left: float, right: float, operation: str) -> float:
    return _finish(left * right, operation)


def _div(numerator: float, denominator: float, operation: str) -> float:
    if denominator == 0.0:
        raise CoreOperatorError("core_binary64_division_by_zero", operation)
    return _finish(numerator / denominator, operation)


def _neg(value: float, operation: str) -> float:
    return _finish(-value, operation)


def _dot(
    matrix: tuple[tuple[float, ...], ...],
    row: int,
    state: tuple[float, ...],
    state_offset: int,
    count: int,
    operation: str,
) -> float:
    accumulator = 0.0
    for column in range(count):
        product = _mul(
            matrix[row][column],
            state[state_offset + column],
            f"{operation}.mul[{column}]",
        )
        accumulator = _add(accumulator, product, f"{operation}.add[{column}]")
    return accumulator


def _one_minus_four(rho: float, operation: str) -> float:
    one_minus = _sub(1.0, rho, f"{operation}.one_minus")
    one_minus_two = _mul(one_minus, one_minus, f"{operation}.one_minus_two")
    return _mul(one_minus_two, one_minus_two, f"{operation}.one_minus_four")


def _radial_laplacian(
    grid: _FrozenSpectralSnapshot,
    row: int,
    state: tuple[float, ...],
    state_offset: int,
    operation: str,
) -> float:
    count = grid.node_count
    derivative = _dot(
        grid.first_derivative,
        row,
        state,
        state_offset,
        count,
        f"{operation}.D",
    )
    second = _dot(
        grid.second_derivative,
        row,
        state,
        state_offset,
        count,
        f"{operation}.D2",
    )
    one_minus_four = _one_minus_four(grid.rho[row], operation)
    twice_derivative = _mul(2.0, derivative, f"{operation}.twice_derivative")
    quotient = _div(twice_derivative, grid.rho[row], f"{operation}.quotient")
    inside = _add(second, quotient, f"{operation}.inside")
    return _mul(one_minus_four, inside, f"{operation}.L")


def _fill_residual(
    grid: _FrozenSpectralSnapshot,
    state: tuple[float, ...],
    residual: list[float],
) -> None:
    count = grid.node_count
    nu = state[2 * count]
    for row in range(count):
        if row == 0:
            value = _dot(grid.first_derivative, 0, state, 0, count, "S[0]")
        elif row == count - 1:
            value = state[count - 1]
        else:
            laplacian = _radial_laplacian(grid, row, state, 0, f"S[{row}].L")
            half_laplacian = _mul(0.5, laplacian, f"S[{row}].half_L")
            negative_half = _neg(half_laplacian, f"S[{row}].negative_half_L")
            difference = _sub(state[count + row], nu, f"S[{row}].V_minus_nu")
            product = _mul(difference, state[row], f"S[{row}].potential_product")
            value = _add(negative_half, product, f"S[{row}].residual")
        residual[row] = value

    for row in range(count):
        target = count + row
        if row == 0:
            value = _dot(grid.first_derivative, 0, state, count, count, "P[0]")
        elif row == count - 1:
            value = state[2 * count - 1]
        else:
            laplacian = _radial_laplacian(grid, row, state, count, f"P[{row}].L")
            square = _mul(state[row], state[row], f"P[{row}].u_square")
            value = _sub(laplacian, square, f"P[{row}].residual")
        residual[target] = value

    residual[2 * count] = _sub(state[0], 1.0, "A.residual")


def _interior_l_entry(
    grid: _FrozenSpectralSnapshot,
    row: int,
    column: int,
    operation: str,
) -> float:
    one_minus_four = _one_minus_four(grid.rho[row], operation)
    twice_d = _mul(2.0, grid.first_derivative[row][column], f"{operation}.twice_D")
    quotient = _div(twice_d, grid.rho[row], f"{operation}.quotient")
    inside = _add(grid.second_derivative[row][column], quotient, f"{operation}.inside")
    return _mul(one_minus_four, inside, f"{operation}.Lij")


def _jacobian_entry(
    grid: _FrozenSpectralSnapshot,
    state: tuple[float, ...],
    row: int,
    column: int,
) -> float:
    count = grid.node_count
    nu_column = 2 * count
    if row < count:
        if row == 0:
            return grid.first_derivative[0][column] if column < count else 0.0
        if row == count - 1:
            return 1.0 if column == count - 1 else 0.0
        if column < count:
            l_entry = _interior_l_entry(grid, row, column, f"J.S[{row},{column}]")
            negative_half = _mul(-0.5, l_entry, f"J.S[{row},{column}].negative_half")
            diagonal_term = (
                _sub(state[count + row], state[nu_column], f"J.S[{row},{column}].V_minus_nu")
                if column == row
                else 0.0
            )
            return _add(negative_half, diagonal_term, f"J.S[{row},{column}].du")
        if column < 2 * count:
            return state[row] if column == count + row else 0.0
        return _neg(state[row], f"J.S[{row},{column}].dnu")

    if row < 2 * count:
        potential_row = row - count
        if potential_row == 0:
            if count <= column < 2 * count:
                return grid.first_derivative[0][column - count]
            return 0.0
        if potential_row == count - 1:
            return 1.0 if column == 2 * count - 1 else 0.0
        if column < count:
            return (
                _mul(-2.0, state[potential_row], f"J.P[{potential_row},{column}].du")
                if column == potential_row
                else 0.0
            )
        if column < 2 * count:
            return _interior_l_entry(
                grid,
                potential_row,
                column - count,
                f"J.P[{potential_row},{column}].dV",
            )
        return 0.0

    return 1.0 if column == 0 else 0.0


def _fill_jacobian(
    grid: _FrozenSpectralSnapshot,
    state: tuple[float, ...],
    jacobian: list[list[float]],
) -> None:
    unknown_count = 2 * grid.node_count + 1
    for row in range(unknown_count):
        for column in range(unknown_count):
            jacobian[row][column] = _jacobian_entry(grid, state, row, column)


def _check_complete_domain(
    state: tuple[float, ...],
    residual: list[float],
    jacobian: list[list[float]],
    count: int,
) -> None:
    nu = state[2 * count]
    if not nu < 0.0:
        raise CoreOperatorError("core_domain_invalid", "nu_not_negative")
    scaled_nu = _mul(2.0**-10, nu, "domain.scaled_nu")
    if not scaled_nu > -0.5:
        raise CoreOperatorError("core_domain_invalid", "scaled_nu_not_above_minus_half")
    if not scaled_nu < 0.0:
        raise CoreOperatorError("core_domain_invalid", "scaled_nu_not_negative")
    for index, value in enumerate(state):
        if not math.isfinite(value):
            raise CoreOperatorError("core_domain_nonfinite", f"z[{index}]")
    for row, value in enumerate(residual):
        if not math.isfinite(value):
            raise CoreOperatorError("core_domain_nonfinite", f"F[{row}]")
    for row in range(len(jacobian)):
        for column in range(len(jacobian[row])):
            if not math.isfinite(jacobian[row][column]):
                raise CoreOperatorError("core_domain_nonfinite", f"J[{row},{column}]")


def evaluate_primary_core_operator(
    spectral: FrozenLobattoSpectralPrimitive,
    state: tuple[float, ...],
) -> FrozenCoreOperatorEvaluation:
    """Evaluate the frozen core residual and analytic Jacobian once."""

    _verify_literal_bindings()
    with nearest_binary64_environment():
        grid = _validate_spectral_primitive(_snapshot_spectral_primitive(spectral))
        selected_state = _validate_state(state, grid.node_count)
        unknown_count = 2 * grid.node_count + 1
        residual = [0.0 for _ in range(unknown_count)]
        jacobian = [
            [0.0 for _ in range(unknown_count)] for _ in range(unknown_count)
        ]
        _fill_residual(grid, selected_state, residual)
        _fill_jacobian(grid, selected_state, jacobian)
        _check_complete_domain(
            selected_state,
            residual,
            jacobian,
            grid.node_count,
        )
        frozen_residual = tuple(residual)
        frozen_jacobian = tuple(tuple(row) for row in jacobian)
        return FrozenCoreOperatorEvaluation(
            node_count=grid.node_count,
            unknown_count=unknown_count,
            residual=frozen_residual,
            jacobian=frozen_jacobian,
            primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
            primary_numerics_policy_canonical_size_bytes=(
                PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
            spectral_source_size_bytes=SPECTRAL_SOURCE_SIZE_BYTES,
            binary64_environment_source_sha256=(
                BINARY64_ENVIRONMENT_SOURCE_SHA256
            ),
            binary64_environment_source_size_bytes=(
                BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
            ),
            spectral_payload_sha256=SPECTRAL_PAYLOAD_GOLDEN_HASHES[grid.node_count],
            binary64_runtime_family=BINARY64_RUNTIME_FAMILY,
        )


def evaluate_primary_core_residual_only(
    spectral: FrozenLobattoSpectralPrimitive,
    state: tuple[float, ...],
) -> FrozenCoreResidualEvaluation:
    """Evaluate only the complete residual for the postsolve projection gate."""

    _verify_literal_bindings()
    with nearest_binary64_environment():
        grid = _validate_spectral_primitive(_snapshot_spectral_primitive(spectral))
        selected_state = _validate_state(state, grid.node_count)
        unknown_count = 2 * grid.node_count + 1
        residual = [0.0 for _ in range(unknown_count)]
        _fill_residual(grid, selected_state, residual)
        # Passing an empty Jacobian collection makes the shared domain scan
        # check only the selected state and complete residual.  No Jacobian
        # target is allocated, written, or read on this path.
        _check_complete_domain(selected_state, residual, [], grid.node_count)
        return FrozenCoreResidualEvaluation(
            node_count=grid.node_count,
            unknown_count=unknown_count,
            residual=tuple(residual),
            primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
            primary_numerics_policy_canonical_size_bytes=(
                PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
            spectral_source_size_bytes=SPECTRAL_SOURCE_SIZE_BYTES,
            binary64_environment_source_sha256=(
                BINARY64_ENVIRONMENT_SOURCE_SHA256
            ),
            binary64_environment_source_size_bytes=(
                BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
            ),
            spectral_payload_sha256=SPECTRAL_PAYLOAD_GOLDEN_HASHES[grid.node_count],
            binary64_runtime_family=BINARY64_RUNTIME_FAMILY,
        )


if (
    PRIMARY_NUMERICS_POLICY_SHA256 != SPECTRAL_POLICY_SHA256
    or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != SPECTRAL_POLICY_SIZE
    or len(SPECTRAL_SOURCE_SHA256) != 64
    or SPECTRAL_SOURCE_SIZE_BYTES != 19_045
    or len(BINARY64_ENVIRONMENT_SOURCE_SHA256) != 64
    or BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != 14_980
    or CORE_NODE_COUNTS != (64, 96, 128)
    or tuple(FrozenLobattoSpectralPrimitive.__dataclass_fields__)
    != _SPECTRAL_SNAPSHOT_FIELD_NAMES
    or tuple(SPECTRAL_PAYLOAD_GOLDEN_HASHES) != CORE_NODE_COUNTS
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_core_operator_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "CORE_DOMAIN_GRAPH",
    "CORE_JACOBIAN_OPERATION_GRAPH",
    "CORE_NODE_COUNTS",
    "CORE_OPERATOR_VERSION",
    "CORE_RESIDUAL_OPERATION_GRAPH",
    "CoreOperatorError",
    "FrozenCoreOperatorEvaluation",
    "FrozenCoreResidualEvaluation",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRIMARY_NUMERICS_POLICY_SHA256_DOMAIN",
    "SPECTRAL_SOURCE_SHA256",
    "SPECTRAL_SOURCE_SIZE_BYTES",
    "SPECTRAL_PAYLOAD_GOLDEN_DOMAIN",
    "SPECTRAL_PAYLOAD_GOLDEN_HASHES",
    "evaluate_primary_core_operator",
    "evaluate_primary_core_residual_only",
]
