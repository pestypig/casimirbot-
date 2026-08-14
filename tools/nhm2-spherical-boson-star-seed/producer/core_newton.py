"""Frozen producer-side core Newton, Armijo, and endpoint-projection graph.

The implementation closes only the deterministic finite-operation control graph.
It is not a candidate launcher, does not select a seed or level, and confers no
scientific, replay, acceptance, physical, propulsion, or transport authority.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import hashlib
import math
from pathlib import Path
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Callable, Final


CORE_NEWTON_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_core_newton/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980
DENSE_LU_SOURCE_SHA256: Final[str] = (
    "44d38215a8ebe64a03b12b314211ccbe35001e3f963a6f6974631f9c1f07df0e"
)
DENSE_LU_SOURCE_SIZE_BYTES: Final[int] = 25_345
SPECTRAL_SOURCE_SHA256: Final[str] = (
    "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7"
)
SPECTRAL_SOURCE_SIZE_BYTES: Final[int] = 19_045

CORE_OPERATOR_SOURCE_SHA256: Final[str | None] = (
    "b5333cb145ed42e443ac6e122ae77cd4ae4c05e8053cf305c91fdc3572dd6189"
)
CORE_OPERATOR_SOURCE_SIZE_BYTES: Final[int | None] = 32_114
CORE_OPERATOR_DEPENDENCY_SEALED: Final[bool] = True

CORE_NODE_COUNTS: Final[tuple[int, ...]] = (64, 96, 128)
MAXIMUM_SYSTEM_ORDER: Final[int] = 257
MAXIMUM_ACCEPTED_UPDATES: Final[int] = 48
MAXIMUM_BACKTRACK_EXPONENT: Final[int] = 24
BACKTRACK_TRIAL_COUNT: Final[int] = 25
ARMIJO_C: Final[float] = 2.0**-12
EQUATION_LINF_THRESHOLD: Final[float] = 2.0**-40
SCALED_STEP_LINF_THRESHOLD: Final[float] = 2.0**-42
CONSECUTIVE_QUALIFYING_UPDATES: Final[int] = 2

NEWTON_OPERATION_GRAPH: Final[str] = (
    "initial_complete_F_then_complete_J;for_update_1_through_48_one_bound_dense_"
    "LU_of_J_delta_equals_canonical_negative_F;for_k_0_through_24_alpha_exact_"
    "2_pow_negative_k_step_i_increasing_then_trial_i_increasing;every_formed_"
    "trial_complete_F_then_complete_J_before_domain_and_Armijo;ordered_"
    "sumSquares_then_phi;literal_Armijo_only_no_stationary_exception;first_"
    "accepted_trial_reclassifies_existing_F_J_and_merit"
)
MERIT_ARMIJO_OPERATION_GRAPH: Final[str] = (
    "sumSquares_positive_zero;rows_increasing_square_then_add;phi_divide_by_2;"
    "cAlpha_multiply_2_pow_negative_12_by_alpha;decrease_multiply_cAlpha_by_"
    "currentSumSquares;rhs_subtract_decrease_from_currentPhi;accept_trialPhi_"
    "less_than_or_equal_rhs"
)
STOP_OPERATION_GRAPH: Final[str] = (
    "after_acceptance_equation_linf_rows_increasing;scaled_step_indices_"
    "increasing_abs_step_divide_max_1_abs_accepted_state;qualify_at_2_pow_"
    "negative_40_and_2_pow_negative_42;exactly_two_consecutive;initial_state_"
    "cannot_terminate;check_update_48_then_fail_without_update_49"
)
PROJECTION_OPERATION_GRAPH: Final[str] = (
    "after_two_consecutive_updates_retain_raw_state;copy_then_write_exact_"
    "positive_zero_to_u_N_minus_1_and_V_N_minus_1;evaluate_complete_residual_"
    "only_once;scan_rows_increasing;require_linf_at_most_2_pow_negative_40;"
    "require_only_the_two_endpoint_bits_may_change"
)


class CoreNewtonError(ValueError):
    """Fail-closed producer Newton error with a deterministic code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


class _EvaluationRejected(Exception):
    """Internal marker for a fully attempted but domain-invalid evaluation."""

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class _EvaluationFailed(Exception):
    """Internal marker for an incomplete numeric evaluation: fail, never retry."""

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


@dataclass(frozen=True, slots=True)
class _FullEvaluation:
    residual: tuple[float, ...]
    jacobian: tuple[tuple[float, ...], ...]
    domain_valid: bool


@dataclass(frozen=True, slots=True)
class FrozenCoreNewtonResult:
    node_count: int
    unknown_count: int
    current_state: tuple[float, ...]
    raw_accepted_state: tuple[float, ...] | None
    projected_state: tuple[float, ...] | None
    projected_residual: tuple[float, ...] | None
    newton_terminated: bool
    projection_gate_passed: bool
    failure_code: str | None
    accepted_update_count: int
    dense_lu_solve_count: int
    full_evaluation_count: int
    trial_attempt_count: int
    trial_full_evaluation_count: int
    residual_only_evaluation_count: int
    accepted_alpha_exponents: tuple[int, ...]
    equation_linf: float
    scaled_step_linf: float | None
    consecutive_qualifying_count: int
    projection_residual_linf: float | None
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    dense_lu_source_sha256: str
    dense_lu_source_size_bytes: int
    core_operator_source_sha256: str | None
    core_operator_source_size_bytes: int | None
    core_operator_dependency_sealed: bool
    binary64_runtime_family: str
    synthetic_evaluator_used: bool
    calculation_implemented: bool = True
    complete_initial_f_and_j: bool = True
    complete_trial_f_and_j: bool = True
    one_dense_lu_per_update: bool = True
    exact_armijo_without_stationary_exception: bool = True
    accepted_state_scaled_step_denominator: bool = True
    endpoint_projection_implemented: bool = True
    retry_allowed: bool = False
    retune_allowed: bool = False
    alternate_solver_allowed: bool = False
    newton_restart_allowed: bool = False
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


_HERE: Final[Path] = Path(__file__).resolve().parent
_BINARY64_ENVIRONMENT_PATH: Final[Path] = _HERE / "binary64_environment.py"
_DENSE_LU_PATH: Final[Path] = _HERE / "dense_lu.py"
_SPECTRAL_PATH: Final[Path] = _HERE / "spectral.py"
_CORE_OPERATOR_PATH: Final[Path] = _HERE / "core_operator.py"
_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME: Final[str] = (
    "_nhm2_seed_core_newton_fenv_8d452abdfa6d9b3e"
)
_PRIVATE_DENSE_LU_MODULE_NAME: Final[str] = (
    "_nhm2_seed_core_newton_dense_44d38215a8ebe64a"
)
_PRIVATE_SPECTRAL_MODULE_NAME: Final[str] = (
    "_nhm2_seed_core_newton_spectral_e9b2509b0c4a5d41"
)
_PRIVATE_CORE_OPERATOR_MODULE_NAME: Final[str] = (
    "_nhm2_seed_core_newton_operator_b5333cb145ed42e4"
)
_MISSING_MODULE: Final[object] = object()


def _read_bound_source(
    path: Path,
    expected_sha256: str,
    expected_size_bytes: int,
    dependency: str,
) -> bytes:
    try:
        source = path.read_bytes()
    except OSError as error:
        raise CoreNewtonError(
            f"{dependency}_source_unavailable", type(error).__name__
        ) from error
    if len(source) != expected_size_bytes:
        raise CoreNewtonError(f"{dependency}_source_mismatch", "size")
    if hashlib.sha256(source).hexdigest() != expected_sha256:
        raise CoreNewtonError(f"{dependency}_source_mismatch", "sha256")
    return source


def _read_bound_binary64_environment_source() -> bytes:
    return _read_bound_source(
        _BINARY64_ENVIRONMENT_PATH,
        BINARY64_ENVIRONMENT_SOURCE_SHA256,
        BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
        "binary64_environment",
    )


def _read_bound_dense_lu_source() -> bytes:
    return _read_bound_source(
        _DENSE_LU_PATH,
        DENSE_LU_SOURCE_SHA256,
        DENSE_LU_SOURCE_SIZE_BYTES,
        "dense_lu",
    )


def _read_bound_spectral_source() -> bytes:
    return _read_bound_source(
        _SPECTRAL_PATH,
        SPECTRAL_SOURCE_SHA256,
        SPECTRAL_SOURCE_SIZE_BYTES,
        "spectral",
    )


def _read_bound_core_operator_source() -> bytes:
    if (
        not CORE_OPERATOR_DEPENDENCY_SEALED
        or CORE_OPERATOR_SOURCE_SHA256 is None
        or CORE_OPERATOR_SOURCE_SIZE_BYTES is None
    ):
        raise CoreNewtonError("core_operator_source_unsealed", "pending_final_repair")
    return _read_bound_source(
        _CORE_OPERATOR_PATH,
        CORE_OPERATOR_SOURCE_SHA256,
        CORE_OPERATOR_SOURCE_SIZE_BYTES,
        "core_operator",
    )


def _execute_private_module(
    *,
    source: bytes,
    path: Path,
    private_name: str,
    dependency: str,
    temporary_public_modules: tuple[tuple[str, ModuleType], ...] = (),
) -> ModuleType:
    module = ModuleType(private_name)
    module.__file__ = str(path)
    module.__package__ = ""
    previous = sys.modules.get(private_name, _MISSING_MODULE)
    previous_public = tuple(
        (name, sys.modules.get(name, _MISSING_MODULE))
        for name, _bound_module in temporary_public_modules
    )
    sys.modules[private_name] = module
    for name, bound_module in temporary_public_modules:
        sys.modules[name] = bound_module
    try:
        code = compile(
            source,
            str(path),
            "exec",
            dont_inherit=True,
            optimize=0,
        )
        exec(code, module.__dict__)
    except Exception as error:
        raise CoreNewtonError(
            f"{dependency}_private_load_failed", type(error).__name__
        ) from error
    finally:
        for name, prior in reversed(previous_public):
            if prior is _MISSING_MODULE:
                del sys.modules[name]
            else:
                sys.modules[name] = prior
        if previous is _MISSING_MODULE:
            del sys.modules[private_name]
        else:
            sys.modules[private_name] = previous
    return module


# Execute only authenticated bytes in private, nonpersistent namespaces. Public
# dependency entries are ignored.  The repaired operator also executes its own
# authenticated spectral bytes in a separate private namespace.
_binary64_environment = _execute_private_module(
    source=_read_bound_binary64_environment_source(),
    path=_BINARY64_ENVIRONMENT_PATH,
    private_name=_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME,
    dependency="binary64_environment",
)
_dense_lu = _execute_private_module(
    source=_read_bound_dense_lu_source(),
    path=_DENSE_LU_PATH,
    private_name=_PRIVATE_DENSE_LU_MODULE_NAME,
    dependency="dense_lu",
)
_spectral = _execute_private_module(
    source=_read_bound_spectral_source(),
    path=_SPECTRAL_PATH,
    private_name=_PRIVATE_SPECTRAL_MODULE_NAME,
    dependency="spectral",
)


_CORE_OPERATOR_MODULE: ModuleType | None = _execute_private_module(
    source=_read_bound_core_operator_source(),
    path=_CORE_OPERATOR_PATH,
    private_name=_PRIVATE_CORE_OPERATOR_MODULE_NAME,
    dependency="core_operator",
    temporary_public_modules=(("spectral", _spectral),),
)


def _load_bound_core_operator() -> ModuleType:
    global _CORE_OPERATOR_MODULE
    source = _read_bound_core_operator_source()
    if _CORE_OPERATOR_MODULE is None:
        _CORE_OPERATOR_MODULE = _execute_private_module(
            source=source,
            path=_CORE_OPERATOR_PATH,
            private_name=_PRIVATE_CORE_OPERATOR_MODULE_NAME,
            dependency="core_operator",
            temporary_public_modules=(("spectral", _spectral),),
        )
    return _CORE_OPERATOR_MODULE


def _verify_dependency_bindings(*, require_core_operator: bool) -> None:
    _read_bound_binary64_environment_source()
    _read_bound_dense_lu_source()
    _read_bound_spectral_source()
    if (
        _dense_lu.BINARY64_ENVIRONMENT_SOURCE_SHA256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or _dense_lu.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or _dense_lu.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _dense_lu.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or _dense_lu.DENSE_LU_VERSION
        != "nhm2_spherical_boson_star_seed_primary_dense_lu/v1"
        or _dense_lu.MAXIMUM_SYSTEM_ORDER != MAXIMUM_SYSTEM_ORDER
        or _binary64_environment.BINARY64_ENVIRONMENT_VERSION
        != "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
    ):
        raise CoreNewtonError("dense_lu_fenv_binding_mismatch", "literal")
    if any(value is not False for value in _binary64_environment.AUTHORITY_LOCKS.values()):
        raise CoreNewtonError("binary64_environment_authority_lock_invalid", "root")
    if any(value is not False for value in _dense_lu.AUTHORITY_LOCKS.values()):
        raise CoreNewtonError("dense_lu_authority_lock_invalid", "root")
    if (
        _spectral.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _spectral.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or _spectral.SPECTRAL_PRIMITIVE_VERSION
        != "nhm2_spherical_boson_star_seed_primary_spectral/v1"
        or tuple(_spectral.ADMITTED_NODE_COUNTS) != (64, 96, 128, 256)
        or any(value is not False for value in _spectral.AUTHORITY_LOCKS.values())
    ):
        raise CoreNewtonError("spectral_binding_mismatch", "literal")
    if require_core_operator:
        module = _load_bound_core_operator()
        if (
            module.PRIMARY_NUMERICS_POLICY_SHA256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            or module.BINARY64_ENVIRONMENT_SOURCE_SHA256
            != BINARY64_ENVIRONMENT_SOURCE_SHA256
            or module.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
            != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
            or module.SPECTRAL_SOURCE_SHA256 != SPECTRAL_SOURCE_SHA256
            or module.SPECTRAL_SOURCE_SIZE_BYTES != SPECTRAL_SOURCE_SIZE_BYTES
            or tuple(module.CORE_NODE_COUNTS) != CORE_NODE_COUNTS
            or module.FrozenLobattoSpectralPrimitive
            is not module._spectral_module.FrozenLobattoSpectralPrimitive
            or module._spectral_module is _spectral
            or module._spectral_module.PRIMARY_NUMERICS_POLICY_SHA256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or module._spectral_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            or any(
                value is not False
                for value in module._spectral_module.AUTHORITY_LOCKS.values()
            )
        ):
            raise CoreNewtonError("core_operator_literal_binding_invalid", "root")
        if any(value is not False for value in module.AUTHORITY_LOCKS.values()):
            raise CoreNewtonError("core_operator_authority_lock_invalid", "root")


_SPECTRAL_PRIMITIVE_FIELD_NAMES: Final[tuple[str, ...]] = tuple(
    field.name for field in fields(_spectral.FrozenLobattoSpectralPrimitive)
)


def _bind_spectral_payload(module: ModuleType, spectral: object) -> object:
    """Copy an untrusted payload once into the authenticated frozen ABI."""

    bound_type = module.FrozenLobattoSpectralPrimitive
    if type(spectral) is bound_type:
        bound = spectral
    else:
        try:
            values = {
                name: getattr(spectral, name)
                for name in _SPECTRAL_PRIMITIVE_FIELD_NAMES
            }
        except Exception as error:
            raise CoreNewtonError(
                "core_newton_spectral_payload_unavailable", type(error).__name__
            ) from error
        try:
            bound = bound_type(**values)
        except Exception as error:
            raise CoreNewtonError(
                "core_newton_spectral_payload_rebind_failed", type(error).__name__
            ) from error
    try:
        snapshot = module._snapshot_spectral_primitive(bound)
        validated = module._validate_spectral_primitive(snapshot)
    except module.CoreOperatorError as error:
        raise CoreNewtonError(
            "core_newton_spectral_payload_invalid",
            getattr(error, "code", "core_operator_error"),
        ) from error
    if type(validated) is not module._FrozenSpectralSnapshot:
        raise CoreNewtonError("core_newton_spectral_payload_invalid", "return_type")
    return bound


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise CoreNewtonError("core_newton_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise CoreNewtonError("core_newton_nonfinite_input", detail)
    if _negative_zero(value):
        raise CoreNewtonError("core_newton_negative_zero_input", detail)
    return 0.0 if value == 0.0 else value


def _validate_initial_state(
    node_count: object,
    initial_state: object,
    *,
    production: bool,
) -> tuple[float, ...]:
    if type(node_count) is not int:
        raise CoreNewtonError("core_newton_node_count_type_invalid", type(node_count).__name__)
    if node_count < 1 or 2 * node_count + 1 > MAXIMUM_SYSTEM_ORDER:
        raise CoreNewtonError("core_newton_node_count_invalid", str(node_count))
    if production and node_count not in CORE_NODE_COUNTS:
        raise CoreNewtonError("core_newton_node_count_not_frozen", str(node_count))
    if type(initial_state) is not tuple:
        raise CoreNewtonError(
            "core_newton_initial_state_type_invalid", type(initial_state).__name__
        )
    expected = 2 * node_count + 1
    if len(initial_state) != expected:
        raise CoreNewtonError(
            "core_newton_initial_state_length_invalid", f"{len(initial_state)}!={expected}"
        )
    return tuple(
        _validate_f64(value, f"initial_state[{index}]")
        for index, value in enumerate(initial_state)
    )


def _finish_binary64(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise CoreNewtonError("core_newton_nonfinite_intermediate", operation)
    return 0.0 if value == 0.0 else value


def _add64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left + right, operation)


def _sub64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left - right, operation)


def _mul64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left * right, operation)


def _div64(numerator: float, denominator: float, operation: str) -> float:
    if denominator == 0.0:
        raise CoreNewtonError("core_newton_division_by_zero", operation)
    return _finish_binary64(numerator / denominator, operation)


def _neg64(value: float, operation: str) -> float:
    return _finish_binary64(-value, operation)


def _validate_full_evaluation(
    evaluation: object,
    order: int,
) -> _FullEvaluation:
    if type(evaluation) is not _FullEvaluation:
        raise CoreNewtonError(
            "core_newton_full_evaluation_type_invalid", type(evaluation).__name__
        )
    if type(evaluation.domain_valid) is not bool:
        raise CoreNewtonError("core_newton_domain_flag_invalid", "type")
    if type(evaluation.residual) is not tuple or len(evaluation.residual) != order:
        raise CoreNewtonError("core_newton_residual_shape_invalid", "root")
    if type(evaluation.jacobian) is not tuple or len(evaluation.jacobian) != order:
        raise CoreNewtonError("core_newton_jacobian_shape_invalid", "root")
    residual = tuple(
        _validate_f64(value, f"residual[{row}]")
        for row, value in enumerate(evaluation.residual)
    )
    rows: list[tuple[float, ...]] = []
    for row_index, row in enumerate(evaluation.jacobian):
        if type(row) is not tuple or len(row) != order:
            raise CoreNewtonError(
                "core_newton_jacobian_row_invalid", str(row_index)
            )
        rows.append(
            tuple(
                _validate_f64(value, f"jacobian[{row_index},{column_index}]")
                for column_index, value in enumerate(row)
            )
        )
    return _FullEvaluation(
        residual=residual,
        jacobian=tuple(rows),
        domain_valid=evaluation.domain_valid,
    )


def _validate_residual_only(evaluation: object, order: int) -> tuple[float, ...]:
    if type(evaluation) is not tuple or len(evaluation) != order:
        raise CoreNewtonError("core_newton_projection_residual_shape_invalid", "root")
    return tuple(
        _validate_f64(value, f"projected_residual[{row}]")
        for row, value in enumerate(evaluation)
    )


def _ordered_merit(residual: tuple[float, ...]) -> tuple[float, float]:
    sum_squares = 0.0
    for row, value in enumerate(residual):
        square = _mul64(value, value, f"merit.square[{row}]")
        sum_squares = _add64(sum_squares, square, f"merit.add[{row}]")
    phi = _div64(sum_squares, 2.0, "merit.phi")
    return sum_squares, phi


def _armijo_rhs(
    *,
    alpha: float,
    current_sum_squares: float,
    current_phi: float,
) -> float:
    c_alpha = _mul64(ARMIJO_C, alpha, "armijo.c_alpha")
    decrease = _mul64(c_alpha, current_sum_squares, "armijo.decrease")
    return _sub64(current_phi, decrease, "armijo.rhs")


def _equation_linf(residual: tuple[float, ...]) -> float:
    maximum = 0.0
    for value in residual:
        magnitude = abs(value)
        if magnitude > maximum:
            maximum = magnitude
    return 0.0 if maximum == 0.0 else maximum


def _scaled_step_linf(
    step: tuple[float, ...],
    accepted_state: tuple[float, ...],
) -> float:
    maximum = 0.0
    for index in range(len(step)):
        denominator = max(1.0, abs(accepted_state[index]))
        scaled = _div64(
            abs(step[index]),
            denominator,
            f"scaled_step[{index}]",
        )
        if scaled > maximum:
            maximum = scaled
    return 0.0 if maximum == 0.0 else maximum


def _validate_dense_lu_result(result: object, order: int) -> tuple[float, ...]:
    if type(result) is not _dense_lu.FrozenDenseLuResult:
        raise CoreNewtonError("core_newton_dense_lu_result_type_invalid", type(result).__name__)
    if (
        result.order != order
        or type(result.solution) is not tuple
        or len(result.solution) != order
        or result.factorization_count != 1
        or result.factored_solve_count != 4
        or result.refinement_passes != 3
        or result.mpfr_residual_evaluation_count != 3
        or result.mpfr_get_d_count != 3 * order
        or result.binary64_environment_source_sha256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or result.binary64_environment_source_size_bytes
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or result.primary_numerics_policy_sha256 != PRIMARY_NUMERICS_POLICY_SHA256
        or result.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise CoreNewtonError("core_newton_dense_lu_result_invalid", "metadata")
    for field in (
        "equilibration_used",
        "fma_used",
        "blas_used",
        "retry_allowed",
        "early_exit_allowed",
        "newton_implemented",
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
        "semiclassical_stress_noise_lamp",
        "semiclassical_constraint_algebra_lamp",
        "diagnostic_pass_authority",
        "candidate_authority",
        "theory_graph_authority",
        "physical_authority",
        "propulsion_authority",
        "transport_authority",
    ):
        if getattr(result, field, None) is not False:
            raise CoreNewtonError("core_newton_dense_lu_authority_invalid", field)
    return tuple(
        _validate_f64(value, f"dense_lu.solution[{index}]")
        for index, value in enumerate(result.solution)
    )


_FullEvaluator = Callable[[tuple[float, ...]], _FullEvaluation]
_ResidualOnlyEvaluator = Callable[[tuple[float, ...]], tuple[float, ...]]


def _make_result(
    *,
    node_count: int,
    current_state: tuple[float, ...],
    raw_accepted_state: tuple[float, ...] | None,
    projected_state: tuple[float, ...] | None,
    projected_residual: tuple[float, ...] | None,
    newton_terminated: bool,
    projection_gate_passed: bool,
    failure_code: str | None,
    accepted_update_count: int,
    dense_lu_solve_count: int,
    full_evaluation_count: int,
    trial_attempt_count: int,
    trial_full_evaluation_count: int,
    residual_only_evaluation_count: int,
    accepted_alpha_exponents: list[int],
    equation_linf: float,
    scaled_step_linf: float | None,
    consecutive_qualifying_count: int,
    projection_residual_linf: float | None,
    synthetic_evaluator_used: bool,
) -> FrozenCoreNewtonResult:
    return FrozenCoreNewtonResult(
        node_count=node_count,
        unknown_count=2 * node_count + 1,
        current_state=current_state,
        raw_accepted_state=raw_accepted_state,
        projected_state=projected_state,
        projected_residual=projected_residual,
        newton_terminated=newton_terminated,
        projection_gate_passed=projection_gate_passed,
        failure_code=failure_code,
        accepted_update_count=accepted_update_count,
        dense_lu_solve_count=dense_lu_solve_count,
        full_evaluation_count=full_evaluation_count,
        trial_attempt_count=trial_attempt_count,
        trial_full_evaluation_count=trial_full_evaluation_count,
        residual_only_evaluation_count=residual_only_evaluation_count,
        accepted_alpha_exponents=tuple(accepted_alpha_exponents),
        equation_linf=equation_linf,
        scaled_step_linf=scaled_step_linf,
        consecutive_qualifying_count=consecutive_qualifying_count,
        projection_residual_linf=projection_residual_linf,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        binary64_environment_source_sha256=BINARY64_ENVIRONMENT_SOURCE_SHA256,
        binary64_environment_source_size_bytes=(
            BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        ),
        dense_lu_source_sha256=DENSE_LU_SOURCE_SHA256,
        dense_lu_source_size_bytes=DENSE_LU_SOURCE_SIZE_BYTES,
        core_operator_source_sha256=CORE_OPERATOR_SOURCE_SHA256,
        core_operator_source_size_bytes=CORE_OPERATOR_SOURCE_SIZE_BYTES,
        core_operator_dependency_sealed=CORE_OPERATOR_DEPENDENCY_SEALED,
        binary64_runtime_family=_binary64_environment.BINARY64_RUNTIME_FAMILY,
        synthetic_evaluator_used=synthetic_evaluator_used,
    )


def _solve_core_newton_graph(
    *,
    node_count: int,
    initial_state: tuple[float, ...],
    full_evaluator: _FullEvaluator,
    residual_only_evaluator: _ResidualOnlyEvaluator,
    synthetic_evaluator_used: bool,
) -> FrozenCoreNewtonResult:
    """Execute the finite graph; tests call this only with synthetic maps."""

    if type(synthetic_evaluator_used) is not bool:
        raise CoreNewtonError("core_newton_synthetic_flag_invalid", "type")
    _verify_dependency_bindings(require_core_operator=not synthetic_evaluator_used)
    with _binary64_environment.nearest_binary64_environment():
        current = _validate_initial_state(
            node_count,
            initial_state,
            production=not synthetic_evaluator_used,
        )
        order = len(current)
        full_evaluation_count = 1
        trial_attempt_count = 0
        trial_full_evaluation_count = 0
        dense_lu_solve_count = 0
        residual_only_evaluation_count = 0
        accepted_exponents: list[int] = []
        accepted_update_count = 0
        consecutive = 0
        last_scaled_step: float | None = None

        try:
            initial_evaluation = _validate_full_evaluation(
                full_evaluator(current), order
            )
        except (_EvaluationRejected, _EvaluationFailed):
            return _make_result(
                node_count=node_count,
                current_state=current,
                raw_accepted_state=None,
                projected_state=None,
                projected_residual=None,
                newton_terminated=False,
                projection_gate_passed=False,
                failure_code="initial_full_evaluation_failed_without_retry",
                accepted_update_count=0,
                dense_lu_solve_count=0,
                full_evaluation_count=full_evaluation_count,
                trial_attempt_count=0,
                trial_full_evaluation_count=0,
                residual_only_evaluation_count=0,
                accepted_alpha_exponents=accepted_exponents,
                equation_linf=0.0,
                scaled_step_linf=None,
                consecutive_qualifying_count=0,
                projection_residual_linf=None,
                synthetic_evaluator_used=synthetic_evaluator_used,
            )
        if not initial_evaluation.domain_valid:
            return _make_result(
                node_count=node_count,
                current_state=current,
                raw_accepted_state=None,
                projected_state=None,
                projected_residual=None,
                newton_terminated=False,
                projection_gate_passed=False,
                failure_code="initial_domain_invalid_without_retry",
                accepted_update_count=0,
                dense_lu_solve_count=0,
                full_evaluation_count=full_evaluation_count,
                trial_attempt_count=0,
                trial_full_evaluation_count=0,
                residual_only_evaluation_count=0,
                accepted_alpha_exponents=accepted_exponents,
                equation_linf=_equation_linf(initial_evaluation.residual),
                scaled_step_linf=None,
                consecutive_qualifying_count=0,
                projection_residual_linf=None,
                synthetic_evaluator_used=synthetic_evaluator_used,
            )

        residual = initial_evaluation.residual
        jacobian = initial_evaluation.jacobian
        try:
            current_sum_squares, current_phi = _ordered_merit(residual)
        except CoreNewtonError:
            return _make_result(
                node_count=node_count,
                current_state=current,
                raw_accepted_state=None,
                projected_state=None,
                projected_residual=None,
                newton_terminated=False,
                projection_gate_passed=False,
                failure_code="initial_merit_failed_without_retry",
                accepted_update_count=0,
                dense_lu_solve_count=0,
                full_evaluation_count=full_evaluation_count,
                trial_attempt_count=0,
                trial_full_evaluation_count=0,
                residual_only_evaluation_count=0,
                accepted_alpha_exponents=accepted_exponents,
                equation_linf=_equation_linf(residual),
                scaled_step_linf=None,
                consecutive_qualifying_count=0,
                projection_residual_linf=None,
                synthetic_evaluator_used=synthetic_evaluator_used,
            )
        equation_linf = _equation_linf(residual)

        for update_index in range(MAXIMUM_ACCEPTED_UPDATES):
            right_hand_side = tuple(
                _neg64(value, f"update[{update_index}].rhs[{row}]")
                for row, value in enumerate(residual)
            )
            dense_lu_solve_count += 1
            try:
                dense_result = _dense_lu.solve_frozen_dense_lu(
                    matrix=jacobian,
                    right_hand_side=right_hand_side,
                )
            except _dense_lu.DenseLuError:
                return _make_result(
                    node_count=node_count,
                    current_state=current,
                    raw_accepted_state=None,
                    projected_state=None,
                    projected_residual=None,
                    newton_terminated=False,
                    projection_gate_passed=False,
                    failure_code="dense_lu_failed_without_retry",
                    accepted_update_count=accepted_update_count,
                    dense_lu_solve_count=dense_lu_solve_count,
                    full_evaluation_count=full_evaluation_count,
                    trial_attempt_count=trial_attempt_count,
                    trial_full_evaluation_count=trial_full_evaluation_count,
                    residual_only_evaluation_count=0,
                    accepted_alpha_exponents=accepted_exponents,
                    equation_linf=equation_linf,
                    scaled_step_linf=last_scaled_step,
                    consecutive_qualifying_count=consecutive,
                    projection_residual_linf=None,
                    synthetic_evaluator_used=synthetic_evaluator_used,
                )
            direction = _validate_dense_lu_result(dense_result, order)

            accepted: tuple[
                tuple[float, ...],
                tuple[float, ...],
                _FullEvaluation,
                float,
                float,
                int,
            ] | None = None
            for exponent in range(BACKTRACK_TRIAL_COUNT):
                trial_attempt_count += 1
                alpha = math.ldexp(1.0, -exponent)
                try:
                    step = tuple(
                        _mul64(
                            alpha,
                            direction[index],
                            f"update[{update_index}].trial[{exponent}].step[{index}]",
                        )
                        for index in range(order)
                    )
                    trial = tuple(
                        _add64(
                            current[index],
                            step[index],
                            f"update[{update_index}].trial[{exponent}].state[{index}]",
                        )
                        for index in range(order)
                    )
                except CoreNewtonError:
                    return _make_result(
                        node_count=node_count,
                        current_state=current,
                        raw_accepted_state=None,
                        projected_state=None,
                        projected_residual=None,
                        newton_terminated=False,
                        projection_gate_passed=False,
                        failure_code="trial_state_failed_without_retry",
                        accepted_update_count=accepted_update_count,
                        dense_lu_solve_count=dense_lu_solve_count,
                        full_evaluation_count=full_evaluation_count,
                        trial_attempt_count=trial_attempt_count,
                        trial_full_evaluation_count=trial_full_evaluation_count,
                        residual_only_evaluation_count=0,
                        accepted_alpha_exponents=accepted_exponents,
                        equation_linf=equation_linf,
                        scaled_step_linf=last_scaled_step,
                        consecutive_qualifying_count=consecutive,
                        projection_residual_linf=None,
                        synthetic_evaluator_used=synthetic_evaluator_used,
                    )

                full_evaluation_count += 1
                trial_full_evaluation_count += 1
                try:
                    trial_evaluation = _validate_full_evaluation(
                        full_evaluator(trial), order
                    )
                except _EvaluationRejected:
                    continue
                except _EvaluationFailed:
                    return _make_result(
                        node_count=node_count,
                        current_state=current,
                        raw_accepted_state=None,
                        projected_state=None,
                        projected_residual=None,
                        newton_terminated=False,
                        projection_gate_passed=False,
                        failure_code="trial_full_evaluation_failed_without_retry",
                        accepted_update_count=accepted_update_count,
                        dense_lu_solve_count=dense_lu_solve_count,
                        full_evaluation_count=full_evaluation_count,
                        trial_attempt_count=trial_attempt_count,
                        trial_full_evaluation_count=trial_full_evaluation_count,
                        residual_only_evaluation_count=0,
                        accepted_alpha_exponents=accepted_exponents,
                        equation_linf=equation_linf,
                        scaled_step_linf=last_scaled_step,
                        consecutive_qualifying_count=consecutive,
                        projection_residual_linf=None,
                        synthetic_evaluator_used=synthetic_evaluator_used,
                    )
                if not trial_evaluation.domain_valid:
                    continue
                try:
                    trial_sum_squares, trial_phi = _ordered_merit(
                        trial_evaluation.residual
                    )
                    armijo_rhs = _armijo_rhs(
                        alpha=alpha,
                        current_sum_squares=current_sum_squares,
                        current_phi=current_phi,
                    )
                except CoreNewtonError:
                    return _make_result(
                        node_count=node_count,
                        current_state=current,
                        raw_accepted_state=None,
                        projected_state=None,
                        projected_residual=None,
                        newton_terminated=False,
                        projection_gate_passed=False,
                        failure_code="trial_merit_or_armijo_failed_without_retry",
                        accepted_update_count=accepted_update_count,
                        dense_lu_solve_count=dense_lu_solve_count,
                        full_evaluation_count=full_evaluation_count,
                        trial_attempt_count=trial_attempt_count,
                        trial_full_evaluation_count=trial_full_evaluation_count,
                        residual_only_evaluation_count=0,
                        accepted_alpha_exponents=accepted_exponents,
                        equation_linf=equation_linf,
                        scaled_step_linf=last_scaled_step,
                        consecutive_qualifying_count=consecutive,
                        projection_residual_linf=None,
                        synthetic_evaluator_used=synthetic_evaluator_used,
                    )
                if trial_phi <= armijo_rhs:
                    accepted = (
                        trial,
                        step,
                        trial_evaluation,
                        trial_sum_squares,
                        trial_phi,
                        exponent,
                    )
                    break

            if accepted is None:
                return _make_result(
                    node_count=node_count,
                    current_state=current,
                    raw_accepted_state=None,
                    projected_state=None,
                    projected_residual=None,
                    newton_terminated=False,
                    projection_gate_passed=False,
                    failure_code="armijo_schedule_exhausted_without_retry",
                    accepted_update_count=accepted_update_count,
                    dense_lu_solve_count=dense_lu_solve_count,
                    full_evaluation_count=full_evaluation_count,
                    trial_attempt_count=trial_attempt_count,
                    trial_full_evaluation_count=trial_full_evaluation_count,
                    residual_only_evaluation_count=0,
                    accepted_alpha_exponents=accepted_exponents,
                    equation_linf=equation_linf,
                    scaled_step_linf=last_scaled_step,
                    consecutive_qualifying_count=consecutive,
                    projection_residual_linf=None,
                    synthetic_evaluator_used=synthetic_evaluator_used,
                )

            (
                current,
                accepted_step,
                accepted_evaluation,
                current_sum_squares,
                current_phi,
                accepted_exponent,
            ) = accepted
            residual = accepted_evaluation.residual
            jacobian = accepted_evaluation.jacobian
            accepted_exponents.append(accepted_exponent)
            accepted_update_count += 1
            equation_linf = _equation_linf(residual)
            last_scaled_step = _scaled_step_linf(accepted_step, current)
            if (
                equation_linf <= EQUATION_LINF_THRESHOLD
                and last_scaled_step <= SCALED_STEP_LINF_THRESHOLD
            ):
                consecutive += 1
            else:
                consecutive = 0
            if consecutive == CONSECUTIVE_QUALIFYING_UPDATES:
                break
        else:
            return _make_result(
                node_count=node_count,
                current_state=current,
                raw_accepted_state=None,
                projected_state=None,
                projected_residual=None,
                newton_terminated=False,
                projection_gate_passed=False,
                failure_code="maximum_updates_reached_without_retry",
                accepted_update_count=accepted_update_count,
                dense_lu_solve_count=dense_lu_solve_count,
                full_evaluation_count=full_evaluation_count,
                trial_attempt_count=trial_attempt_count,
                trial_full_evaluation_count=trial_full_evaluation_count,
                residual_only_evaluation_count=0,
                accepted_alpha_exponents=accepted_exponents,
                equation_linf=equation_linf,
                scaled_step_linf=last_scaled_step,
                consecutive_qualifying_count=consecutive,
                projection_residual_linf=None,
                synthetic_evaluator_used=synthetic_evaluator_used,
            )

        raw_accepted_state = current
        projected = list(raw_accepted_state)
        projected[node_count - 1] = 0.0
        projected[2 * node_count - 1] = 0.0
        projected_state = tuple(projected)
        residual_only_evaluation_count = 1
        try:
            projected_residual = _validate_residual_only(
                residual_only_evaluator(projected_state), order
            )
        except (_EvaluationRejected, _EvaluationFailed):
            return _make_result(
                node_count=node_count,
                current_state=current,
                raw_accepted_state=raw_accepted_state,
                projected_state=projected_state,
                projected_residual=None,
                newton_terminated=True,
                projection_gate_passed=False,
                failure_code="projection_evaluation_failed_without_retry",
                accepted_update_count=accepted_update_count,
                dense_lu_solve_count=dense_lu_solve_count,
                full_evaluation_count=full_evaluation_count,
                trial_attempt_count=trial_attempt_count,
                trial_full_evaluation_count=trial_full_evaluation_count,
                residual_only_evaluation_count=residual_only_evaluation_count,
                accepted_alpha_exponents=accepted_exponents,
                equation_linf=equation_linf,
                scaled_step_linf=last_scaled_step,
                consecutive_qualifying_count=consecutive,
                projection_residual_linf=None,
                synthetic_evaluator_used=synthetic_evaluator_used,
            )
        projection_linf = _equation_linf(projected_residual)
        if projection_linf > EQUATION_LINF_THRESHOLD:
            return _make_result(
                node_count=node_count,
                current_state=current,
                raw_accepted_state=raw_accepted_state,
                projected_state=projected_state,
                projected_residual=projected_residual,
                newton_terminated=True,
                projection_gate_passed=False,
                failure_code="projection_residual_gate_failed_without_retry",
                accepted_update_count=accepted_update_count,
                dense_lu_solve_count=dense_lu_solve_count,
                full_evaluation_count=full_evaluation_count,
                trial_attempt_count=trial_attempt_count,
                trial_full_evaluation_count=trial_full_evaluation_count,
                residual_only_evaluation_count=residual_only_evaluation_count,
                accepted_alpha_exponents=accepted_exponents,
                equation_linf=equation_linf,
                scaled_step_linf=last_scaled_step,
                consecutive_qualifying_count=consecutive,
                projection_residual_linf=projection_linf,
                synthetic_evaluator_used=synthetic_evaluator_used,
            )
        endpoint_indices = (node_count - 1, 2 * node_count - 1)
        for index in range(order):
            if index in endpoint_indices:
                if struct.pack("<d", projected_state[index]) != bytes(8):
                    raise CoreNewtonError("core_newton_projection_integrity_failed", str(index))
            elif struct.pack("<d", projected_state[index]) != struct.pack(
                "<d", raw_accepted_state[index]
            ):
                raise CoreNewtonError("core_newton_projection_integrity_failed", str(index))

        return _make_result(
            node_count=node_count,
            current_state=current,
            raw_accepted_state=raw_accepted_state,
            projected_state=projected_state,
            projected_residual=projected_residual,
            newton_terminated=True,
            projection_gate_passed=True,
            failure_code=None,
            accepted_update_count=accepted_update_count,
            dense_lu_solve_count=dense_lu_solve_count,
            full_evaluation_count=full_evaluation_count,
            trial_attempt_count=trial_attempt_count,
            trial_full_evaluation_count=trial_full_evaluation_count,
            residual_only_evaluation_count=residual_only_evaluation_count,
            accepted_alpha_exponents=accepted_exponents,
            equation_linf=equation_linf,
            scaled_step_linf=last_scaled_step,
            consecutive_qualifying_count=consecutive,
            projection_residual_linf=projection_linf,
            synthetic_evaluator_used=synthetic_evaluator_used,
        )


_CORE_OPERATOR_FULL_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "newton_implemented",
    "solve_performed",
    "candidate_execution_authorized",
    "candidate_executed",
    "candidate_output_materialized",
    "output_present",
    "output_accepted",
    "seed_accepted",
    "branch_accepted",
    "replay_authority",
    "independent_agreement",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)
_CORE_OPERATOR_RESIDUAL_FALSE_FIELDS: Final[tuple[str, ...]] = tuple(
    field
    for field in _CORE_OPERATOR_FULL_FALSE_FIELDS
    if field not in ("newton_implemented", "candidate_output_materialized")
)


def solve_primary_core_newton(
    *,
    spectral: object,
    initial_state: tuple[float, ...],
) -> FrozenCoreNewtonResult:
    """Run the bound core Newton graph; blocked until the operator pin is sealed."""

    _verify_dependency_bindings(require_core_operator=True)
    module = _load_bound_core_operator()
    if type(initial_state) is not tuple or len(initial_state) < 3 or len(initial_state) % 2 != 1:
        raise CoreNewtonError("core_newton_initial_state_shape_invalid", "production")
    node_count = (len(initial_state) - 1) // 2
    if node_count not in CORE_NODE_COUNTS:
        raise CoreNewtonError("core_newton_node_count_invalid", str(node_count))
    bound_spectral = _bind_spectral_payload(module, spectral)

    def full_evaluator(state: tuple[float, ...]) -> _FullEvaluation:
        try:
            evaluation = module.evaluate_primary_core_operator(bound_spectral, state)
        except module.CoreOperatorError as error:
            code = getattr(error, "code", "core_operator_error")
            if (
                code.startswith("core_domain_")
            ):
                raise _EvaluationRejected(code) from error
            if code.startswith("core_binary64_"):
                raise _EvaluationFailed(code) from error
            raise CoreNewtonError("core_operator_full_evaluation_failed", code) from error
        if any(
            getattr(evaluation, field, None) is not False
            for field in _CORE_OPERATOR_FULL_FALSE_FIELDS
        ):
            raise CoreNewtonError("core_operator_result_authority_invalid", "full")
        if (
            evaluation.primary_numerics_policy_sha256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or evaluation.primary_numerics_policy_canonical_size_bytes
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            or evaluation.node_count != node_count
            or evaluation.unknown_count != len(state)
            or evaluation.binary64_environment_source_sha256
            != BINARY64_ENVIRONMENT_SOURCE_SHA256
            or evaluation.binary64_environment_source_size_bytes
            != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
            or evaluation.spectral_source_sha256 != SPECTRAL_SOURCE_SHA256
            or evaluation.spectral_source_size_bytes != SPECTRAL_SOURCE_SIZE_BYTES
            or evaluation.spectral_payload_sha256
            != module.SPECTRAL_PAYLOAD_GOLDEN_HASHES[node_count]
            or evaluation.binary64_runtime_family
            != _binary64_environment.BINARY64_RUNTIME_FAMILY
            or evaluation.analytic_jacobian is not True
            or evaluation.calculation_implemented is not True
            or evaluation.domain_valid is not True
        ):
            raise CoreNewtonError("core_operator_result_binding_invalid", "full")
        return _FullEvaluation(
            residual=evaluation.residual,
            jacobian=evaluation.jacobian,
            domain_valid=True,
        )

    def residual_only_evaluator(state: tuple[float, ...]) -> tuple[float, ...]:
        try:
            evaluation = module.evaluate_primary_core_residual_only(
                bound_spectral, state
            )
        except module.CoreOperatorError as error:
            code = getattr(error, "code", "core_operator_error")
            if (
                code.startswith("core_domain_")
            ):
                raise _EvaluationRejected(code) from error
            if code.startswith("core_binary64_"):
                raise _EvaluationFailed(code) from error
            raise CoreNewtonError("core_operator_residual_evaluation_failed", code) from error
        if any(
            getattr(evaluation, field, None) is not False
            for field in _CORE_OPERATOR_RESIDUAL_FALSE_FIELDS
        ):
            raise CoreNewtonError("core_operator_result_authority_invalid", "residual_only")
        if (
            evaluation.primary_numerics_policy_sha256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or evaluation.primary_numerics_policy_canonical_size_bytes
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            or evaluation.node_count != node_count
            or evaluation.unknown_count != len(state)
            or evaluation.binary64_environment_source_sha256
            != BINARY64_ENVIRONMENT_SOURCE_SHA256
            or evaluation.binary64_environment_source_size_bytes
            != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
            or evaluation.spectral_source_sha256 != SPECTRAL_SOURCE_SHA256
            or evaluation.spectral_source_size_bytes != SPECTRAL_SOURCE_SIZE_BYTES
            or evaluation.spectral_payload_sha256
            != module.SPECTRAL_PAYLOAD_GOLDEN_HASHES[node_count]
            or evaluation.binary64_runtime_family
            != _binary64_environment.BINARY64_RUNTIME_FAMILY
            or evaluation.projected_gate_only is not True
            or evaluation.jacobian_materialized is not False
            or evaluation.calculation_implemented is not True
        ):
            raise CoreNewtonError("core_operator_result_binding_invalid", "residual_only")
        return evaluation.residual

    return _solve_core_newton_graph(
        node_count=node_count,
        initial_state=initial_state,
        full_evaluator=full_evaluator,
        residual_only_evaluator=residual_only_evaluator,
        synthetic_evaluator_used=False,
    )


if (
    len(PRIMARY_NUMERICS_POLICY_SHA256) != 64
    or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != 80_055
    or len(BINARY64_ENVIRONMENT_SOURCE_SHA256) != 64
    or BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != 14_980
    or len(DENSE_LU_SOURCE_SHA256) != 64
    or DENSE_LU_SOURCE_SIZE_BYTES != 25_345
    or len(SPECTRAL_SOURCE_SHA256) != 64
    or SPECTRAL_SOURCE_SIZE_BYTES != 19_045
    or (CORE_OPERATOR_SOURCE_SHA256 is None)
    != (CORE_OPERATOR_SOURCE_SIZE_BYTES is None)
    or CORE_OPERATOR_DEPENDENCY_SEALED
    != (CORE_OPERATOR_SOURCE_SHA256 is not None)
    or CORE_OPERATOR_SOURCE_SHA256
    != "b5333cb145ed42e443ac6e122ae77cd4ae4c05e8053cf305c91fdc3572dd6189"
    or CORE_OPERATOR_SOURCE_SIZE_BYTES != 32_114
    or CORE_NODE_COUNTS != (64, 96, 128)
    or MAXIMUM_SYSTEM_ORDER != 257
    or MAXIMUM_ACCEPTED_UPDATES != 48
    or MAXIMUM_BACKTRACK_EXPONENT != 24
    or BACKTRACK_TRIAL_COUNT != 25
    or CONSECUTIVE_QUALIFYING_UPDATES != 2
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_core_newton_invariant")


__all__ = [
    "ARMIJO_C",
    "AUTHORITY_LOCKS",
    "BACKTRACK_TRIAL_COUNT",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "CONSECUTIVE_QUALIFYING_UPDATES",
    "CORE_NEWTON_VERSION",
    "CORE_NODE_COUNTS",
    "CORE_OPERATOR_DEPENDENCY_SEALED",
    "CORE_OPERATOR_SOURCE_SHA256",
    "CORE_OPERATOR_SOURCE_SIZE_BYTES",
    "CoreNewtonError",
    "DENSE_LU_SOURCE_SHA256",
    "DENSE_LU_SOURCE_SIZE_BYTES",
    "EQUATION_LINF_THRESHOLD",
    "FrozenCoreNewtonResult",
    "MAXIMUM_ACCEPTED_UPDATES",
    "MAXIMUM_BACKTRACK_EXPONENT",
    "MERIT_ARMIJO_OPERATION_GRAPH",
    "NEWTON_OPERATION_GRAPH",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PROJECTION_OPERATION_GRAPH",
    "SCALED_STEP_LINF_THRESHOLD",
    "SPECTRAL_SOURCE_SHA256",
    "SPECTRAL_SOURCE_SIZE_BYTES",
    "STOP_OPERATION_GRAPH",
    "solve_primary_core_newton",
]
