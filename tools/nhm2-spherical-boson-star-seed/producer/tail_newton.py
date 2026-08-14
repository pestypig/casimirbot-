"""Synthetic-first frozen Newton control for the 65-unknown tail system.

Only the deterministic finite-operation Newton, Armijo, and final residual-gate
graph is implemented.  The combined 65-row tail operator is exact-byte bound
and privately executed.  An internal adapter drives one identity-gated operator
session for every full evaluation and the final residual-only evaluation,
without re-consuming the initializer continuation.  The public production
entry point records the still-unavailable shared-private-instance composition.
This module does not run or accept a candidate, materialize output, or confer
scientific, replay, physical, propulsion, or transport authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Callable, Final


TAIL_NEWTON_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_tail_newton/v1"
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
TAIL_OPERATOR_SOURCE_SHA256: Final[str] = (
    "f72dbcddf60c93508dffc264d575daa58e7a3a29beeb7459eb53e604d4292980"
)
TAIL_OPERATOR_SOURCE_SIZE_BYTES: Final[int] = 94_800
TAIL_OPERATOR_DEPENDENCY_SEALED: Final[bool] = True
TAIL_OPERATOR_SESSION_COMPOSITION_STATUS: Final[str] = (
    "blocked_shared_private_tail_operator_instance_not_composed"
)

UNKNOWN_COUNT: Final[int] = 65
RESIDUAL_ROW_COUNT: Final[int] = 65
MAXIMUM_ACCEPTED_UPDATES: Final[int] = 48
MAXIMUM_BACKTRACK_EXPONENT: Final[int] = 24
BACKTRACK_TRIAL_COUNT: Final[int] = 25
ARMIJO_C: Final[float] = 2.0**-12
EQUATION_LINF_THRESHOLD: Final[float] = 2.0**-40
SCALED_STEP_LINF_THRESHOLD: Final[float] = 2.0**-42
CONSECUTIVE_QUALIFYING_UPDATES: Final[int] = 2

TAIL_NEWTON_OPERATION_GRAPH: Final[str] = (
    "initial_complete_65_F_then_complete_65x65_J;for_update_1_through_48_one_"
    "bound_dense_LU;for_k_0_through_24_form_complete_trial_state_then_complete_"
    "65_F_then_complete_65x65_J_before_C_kappa_domain_and_Armijo;first_accepted_"
    "trial_reclassifies_existing_F_J_and_merit;two_consecutive_thresholds;no_"
    "retry_retune_restart_or_alternate_solver"
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
FINAL_RESIDUAL_GATE_OPERATION_GRAPH: Final[str] = (
    "after_two_consecutive_updates_copy_all_65_accepted_state_bits_without_"
    "projection;evaluate_complete_65_row_residual_only_once;scan_rows_"
    "increasing;reject_nonfinite_or_linf_greater_than_2_pow_negative_40;no_"
    "endpoint_projection_and_no_output_allocation"
)


class TailNewtonError(ValueError):
    """Fail-closed tail Newton error with a deterministic code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


class _EvaluationFailed(Exception):
    """Internal marker for an incomplete numeric evaluation."""

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


@dataclass(frozen=True, slots=True)
class _FullEvaluation:
    residual: tuple[float, ...]
    jacobian: tuple[tuple[float, ...], ...]
    kappa: float


@dataclass(frozen=True, slots=True)
class FrozenTailNewtonResult:
    unknown_count: int
    residual_row_count: int
    current_state: tuple[float, ...]
    accepted_state: tuple[float, ...] | None
    final_residual: tuple[float, ...] | None
    kappa: float | None
    newton_terminated: bool
    final_residual_gate_passed: bool
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
    final_residual_linf: float | None
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    dense_lu_source_sha256: str
    dense_lu_source_size_bytes: int
    tail_operator_source_sha256: str | None
    tail_operator_source_size_bytes: int | None
    tail_operator_dependency_sealed: bool
    binary64_runtime_family: str
    synthetic_evaluator_used: bool
    calculation_implemented: bool = True
    complete_initial_f_and_j: bool = True
    complete_trial_f_and_j: bool = True
    one_dense_lu_per_update: bool = True
    exact_armijo_without_stationary_exception: bool = True
    accepted_state_scaled_step_denominator: bool = True
    final_residual_only_gate_defined: bool = True
    endpoint_projection_used: bool = False
    production_adapter_available: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
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
_TAIL_OPERATOR_PATH: Final[Path] = _HERE / "tail_operator.py"
_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_newton_fenv_8d452abdfa6d9b3e"
)
_PRIVATE_DENSE_LU_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_newton_dense_44d38215a8ebe64a"
)
_PRIVATE_TAIL_OPERATOR_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_newton_operator_f72dbcddf60c9350"
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
        raise TailNewtonError(
            f"{dependency}_source_unavailable", type(error).__name__
        ) from error
    if len(source) != expected_size_bytes:
        raise TailNewtonError(f"{dependency}_source_mismatch", "size")
    if hashlib.sha256(source).hexdigest() != expected_sha256:
        raise TailNewtonError(f"{dependency}_source_mismatch", "sha256")
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


def _read_bound_tail_operator_source() -> bytes:
    return _read_bound_source(
        _TAIL_OPERATOR_PATH,
        TAIL_OPERATOR_SOURCE_SHA256,
        TAIL_OPERATOR_SOURCE_SIZE_BYTES,
        "tail_operator",
    )


def _execute_private_module(
    *,
    source: bytes,
    path: Path,
    private_name: str,
    dependency: str,
) -> ModuleType:
    module = ModuleType(private_name)
    module.__file__ = str(path)
    module.__package__ = ""
    previous = sys.modules.get(private_name, _MISSING_MODULE)
    sys.modules[private_name] = module
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
        raise TailNewtonError(
            f"{dependency}_private_load_failed", type(error).__name__
        ) from error
    finally:
        if previous is _MISSING_MODULE:
            del sys.modules[private_name]
        else:
            sys.modules[private_name] = previous
    return module


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
_tail_operator = _execute_private_module(
    source=_read_bound_tail_operator_source(),
    path=_TAIL_OPERATOR_PATH,
    private_name=_PRIVATE_TAIL_OPERATOR_MODULE_NAME,
    dependency="tail_operator",
)

_TAIL_OPERATOR_EVALUATION_FIELDS: Final[tuple[str, ...]] = (
    "mode", "residual_row_count", "unknown_count", "residual", "jacobian",
    "row_labels", "row_order", "unknown_order", "state_snapshot_bits",
    "state_f64le_sha256", "projected_state_f64le_sha256",
    "state_snapshot_count", "state_component_read_count",
    "state_bitwise_unchanged", "pde_rows_completed", "mass_rows_completed",
    "residual_store_count", "jacobian_target_touched",
    "jacobian_row_store_count", "jacobian_component_store_count",
    "pde_jacobian_field_accessed", "mass_jacobian_field_accessed",
    "chronology_event_count", "chronology_sha256", "synthetic_mass_cell_count",
    "full_tail_cell_count", "mass_row_is_partial",
    "full_tail_mass_execution_observed", "full_tail_mass_golden_verified",
    "tail_pde_operator_source_sha256", "tail_pde_operator_source_size_bytes",
    "tail_mass_operator_source_sha256", "tail_mass_operator_source_size_bytes",
    "binary64_environment_source_sha256",
    "binary64_environment_source_size_bytes", "tail_initializer_source_sha256",
    "tail_initializer_source_size_bytes", "tail_initializer_source_status",
    "production_dependencies_sealed", "binary64_runtime_family",
    "session_id_sha256", "session_evaluation_ordinal",
    "retained_core_get_d_count", "synthetic_dependencies_used",
    "calculation_implemented", "combined_residual_implemented",
    "analytic_jacobian_implemented", "final_residual_only_mode_implemented",
    "production_adapter_available", "initializer_continuation_consumed",
    "implementation_closure_complete", "runtime_closure_complete",
    "newton_implemented", "solve_performed", "candidate_execution_authorized",
    "candidate_executed", "candidate_output_materialized", "output_present",
    "output_accepted", "seed_accepted", "branch_accepted",
    "nondegeneracy_accepted", "replay_authority", "independent_agreement",
    "diagnostic_pass_authority", "candidate_authority",
    "theory_graph_authority", "physical_authority", "propulsion_authority",
    "transport_authority",
)
_TAIL_OPERATOR_SESSION_FIELDS: Final[tuple[str, ...]] = (
    "session_id_sha256", "initial_state", "initial_state_bits",
    "initial_state_f64le_sha256", "projected_state_f64le_sha256",
    "join_barrier_f64le_sha256", "core64", "core64_bits",
    "synthetic_mass_cell_count", "initializer_continuation_consumption_count",
    "retained_core_get_d_count", "tail_initializer_source_sha256",
    "tail_initializer_source_size_bytes", "synthetic_dependencies_used",
    "production_adapter_available", "implementation_closure_complete",
    "runtime_closure_complete", "newton_implemented", "solve_performed",
    "candidate_execution_authorized", "candidate_executed", "output_present",
    "output_accepted", "seed_accepted", "branch_accepted", "replay_authority",
    "independent_agreement", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)


def _verify_dependency_bindings() -> None:
    _read_bound_binary64_environment_source()
    _read_bound_dense_lu_source()
    _read_bound_tail_operator_source()
    if (
        _binary64_environment.BINARY64_ENVIRONMENT_VERSION
        != "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
        or _dense_lu.DENSE_LU_VERSION
        != "nhm2_spherical_boson_star_seed_primary_dense_lu/v1"
        or _dense_lu.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _dense_lu.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or _dense_lu.BINARY64_ENVIRONMENT_SOURCE_SHA256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or _dense_lu.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or _dense_lu.MAXIMUM_SYSTEM_ORDER != 257
        or _tail_operator.TAIL_OPERATOR_VERSION
        != "nhm2_spherical_boson_star_seed_primary_tail_operator/v1"
        or _tail_operator.BINARY64_ENVIRONMENT_SOURCE_SHA256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or _tail_operator.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or _tail_operator.UNKNOWN_COUNT != UNKNOWN_COUNT
        or _tail_operator.RESIDUAL_ROW_COUNT != RESIDUAL_ROW_COUNT
        or _tail_operator.ROW_ORDER != "S[0..31],P[0..31],mass"
        or _tail_operator.UNKNOWN_ORDER != "C,h[0..31],q[0..31]"
        or _tail_operator.EVALUATION_MODES
        != ("Newton", "finalResidualGate")
        or _tail_operator.PRODUCTION_DEPENDENCIES_SEALED is not True
        or _tail_operator.PRODUCTION_SESSION_COMPOSITION_STATUS
        != "blocked_shared_private_initializer_instance_not_composed"
        or tuple(
            _tail_operator.FrozenTailOperatorEvaluation.__dataclass_fields__
        ) != _TAIL_OPERATOR_EVALUATION_FIELDS
        or tuple(
            _tail_operator.FrozenTailOperatorSession.__dataclass_fields__
        ) != _TAIL_OPERATOR_SESSION_FIELDS
        or any(value is not False for value in _binary64_environment.AUTHORITY_LOCKS.values())
        or any(value is not False for value in _dense_lu.AUTHORITY_LOCKS.values())
        or any(value is not False for value in _tail_operator.AUTHORITY_LOCKS.values())
        or _tail_operator._binary64_environment is _binary64_environment
        or not callable(_tail_operator.evaluate_primary_tail_operator)
        or not callable(_tail_operator.open_primary_tail_operator_session)
    ):
        raise TailNewtonError("tail_newton_dependency_binding_invalid", "literal")


def _require_tail_operator_source() -> None:
    if (
        TAIL_OPERATOR_DEPENDENCY_SEALED is not True
        or len(TAIL_OPERATOR_SOURCE_SHA256) != 64
        or TAIL_OPERATOR_SOURCE_SIZE_BYTES != 94_800
    ):
        raise TailNewtonError(
            "tail_operator_source_unsealed",
            "combined_65_row_tail_operator_binding_invalid",
        )
    raise TailNewtonError(
        "tail_newton_shared_tail_operator_instance_composition_blocked",
        TAIL_OPERATOR_SESSION_COMPOSITION_STATUS,
    )


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise TailNewtonError("tail_newton_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise TailNewtonError("tail_newton_nonfinite_input", detail)
    if _negative_zero(value):
        raise TailNewtonError("tail_newton_negative_zero_input", detail)
    return 0.0 if value == 0.0 else value


def _validate_initial_state(initial_state: object) -> tuple[float, ...]:
    if type(initial_state) is not tuple:
        raise TailNewtonError(
            "tail_newton_initial_state_type_invalid", type(initial_state).__name__
        )
    if len(initial_state) != UNKNOWN_COUNT:
        raise TailNewtonError(
            "tail_newton_initial_state_length_invalid",
            f"{len(initial_state)}!={UNKNOWN_COUNT}",
        )
    return tuple(
        _validate_f64(value, f"initial_state[{index}]")
        for index, value in enumerate(initial_state)
    )


def _finish_binary64(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise TailNewtonError("tail_newton_nonfinite_intermediate", operation)
    return 0.0 if value == 0.0 else value


def _add64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left + right, operation)


def _sub64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left - right, operation)


def _mul64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left * right, operation)


def _div64(numerator: float, denominator: float, operation: str) -> float:
    if denominator == 0.0:
        raise TailNewtonError("tail_newton_division_by_zero", operation)
    return _finish_binary64(numerator / denominator, operation)


def _neg64(value: float, operation: str) -> float:
    return _finish_binary64(-value, operation)


def _validate_full_evaluation(evaluation: object) -> _FullEvaluation:
    if type(evaluation) is not _FullEvaluation:
        raise TailNewtonError(
            "tail_newton_full_evaluation_type_invalid", type(evaluation).__name__
        )
    if (
        type(evaluation.residual) is not tuple
        or len(evaluation.residual) != RESIDUAL_ROW_COUNT
    ):
        raise TailNewtonError("tail_newton_residual_shape_invalid", "root")
    if (
        type(evaluation.jacobian) is not tuple
        or len(evaluation.jacobian) != RESIDUAL_ROW_COUNT
    ):
        raise TailNewtonError("tail_newton_jacobian_shape_invalid", "root")
    residual = tuple(
        _validate_f64(value, f"residual[{row}]")
        for row, value in enumerate(evaluation.residual)
    )
    rows: list[tuple[float, ...]] = []
    for row_index, row in enumerate(evaluation.jacobian):
        if type(row) is not tuple or len(row) != UNKNOWN_COUNT:
            raise TailNewtonError(
                "tail_newton_jacobian_row_invalid", str(row_index)
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
        kappa=_validate_f64(evaluation.kappa, "kappa"),
    )


def _validate_residual_only(evaluation: object) -> tuple[float, ...]:
    if type(evaluation) is not tuple or len(evaluation) != RESIDUAL_ROW_COUNT:
        raise TailNewtonError("tail_newton_final_residual_shape_invalid", "root")
    return tuple(
        _validate_f64(value, f"final_residual[{row}]")
        for row, value in enumerate(evaluation)
    )


def _domain_valid(state: tuple[float, ...], evaluation: _FullEvaluation) -> bool:
    return state[0] > 0.0 and evaluation.kappa > 0.0


def _ordered_merit(residual: tuple[float, ...]) -> tuple[float, float]:
    sum_squares = 0.0
    for row, value in enumerate(residual):
        square = _mul64(value, value, f"merit.square[{row}]")
        sum_squares = _add64(sum_squares, square, f"merit.add[{row}]")
    return sum_squares, _div64(sum_squares, 2.0, "merit.phi")


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
    for index in range(UNKNOWN_COUNT):
        denominator = max(1.0, abs(accepted_state[index]))
        scaled = _div64(abs(step[index]), denominator, f"scaled_step[{index}]")
        if scaled > maximum:
            maximum = scaled
    return 0.0 if maximum == 0.0 else maximum


_DENSE_FALSE_FIELDS: Final[tuple[str, ...]] = (
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
)


def _validate_dense_lu_result(result: object) -> tuple[float, ...]:
    if type(result) is not _dense_lu.FrozenDenseLuResult:
        raise TailNewtonError(
            "tail_newton_dense_lu_result_type_invalid", type(result).__name__
        )
    if (
        result.order != UNKNOWN_COUNT
        or type(result.solution) is not tuple
        or len(result.solution) != UNKNOWN_COUNT
        or result.factorization_count != 1
        or result.factored_solve_count != 4
        or result.refinement_passes != 3
        or result.mpfr_residual_evaluation_count != 3
        or result.mpfr_get_d_count != 3 * UNKNOWN_COUNT
        or result.binary64_environment_source_sha256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or result.binary64_environment_source_size_bytes
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or result.primary_numerics_policy_sha256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or result.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise TailNewtonError("tail_newton_dense_lu_result_invalid", "metadata")
    for field in _DENSE_FALSE_FIELDS:
        if getattr(result, field, None) is not False:
            raise TailNewtonError("tail_newton_dense_lu_authority_invalid", field)
    return tuple(
        _validate_f64(value, f"dense_lu.solution[{index}]")
        for index, value in enumerate(result.solution)
    )


_FullEvaluator = Callable[[tuple[float, ...]], _FullEvaluation]
_ResidualOnlyEvaluator = Callable[[tuple[float, ...]], tuple[float, ...]]

_TAIL_OPERATOR_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "implementation_closure_complete", "runtime_closure_complete",
    "newton_implemented", "solve_performed",
    "candidate_execution_authorized", "candidate_executed",
    "candidate_output_materialized", "output_present", "output_accepted",
    "seed_accepted", "branch_accepted", "nondegeneracy_accepted",
    "replay_authority", "independent_agreement", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)


def _validate_tail_operator_session(value: object) -> tuple[object, float]:
    if type(value) is not _tail_operator.FrozenTailOperatorSession:
        raise TailNewtonError(
            "tail_newton_operator_session_type_invalid", type(value).__name__
        )
    try:
        active = _tail_operator._require_active_session(value)
    except _tail_operator.TailOperatorError as error:
        raise TailNewtonError(
            "tail_newton_operator_session_invalid", error.code
        ) from error
    session = value
    if (
        session.tail_initializer_source_sha256
        != _tail_operator.TAIL_INITIALIZER_SOURCE_SHA256
        or session.tail_initializer_source_size_bytes
        != _tail_operator.TAIL_INITIALIZER_SOURCE_SIZE_BYTES
        or session.initializer_continuation_consumption_count != 1
        or session.retained_core_get_d_count != 1
        or type(session.synthetic_dependencies_used) is not bool
        or session.production_adapter_available
        is not (not session.synthetic_dependencies_used)
        or (
            not session.synthetic_dependencies_used
            and session.synthetic_mass_cell_count
            != _tail_operator.FULL_TAIL_CELL_COUNT
        )
        or type(session.session_id_sha256) is not str
        or len(session.session_id_sha256) != 64
        or type(session.core64) is not float
        or session.core64 <= 0.0
        or session.core64_bits != struct.pack("<d", session.core64).hex()
        or any(
            getattr(session, field, None) is not False
            for field in _TAIL_OPERATOR_FALSE_FIELDS
            if hasattr(session, field)
        )
    ):
        raise TailNewtonError("tail_newton_operator_session_invalid", "metadata")
    initializer_token = active.initializer_continuation
    if (
        initializer_token.result is not active.initializer_result
        or active.core_integral_continuation
        is not initializer_token.core_integral_continuation
        or active.core_sum is not initializer_token.core_sum
        or struct.pack("<d", active.core64)
        != struct.pack("<d", initializer_token.core64)
    ):
        raise TailNewtonError(
            "tail_newton_operator_session_invalid", "continuation_identity"
        )
    if not session.synthetic_dependencies_used:
        core_owner = _tail_operator._tail_initializer_module._core_quadrature
        core_token = active.core_integral_continuation
        if (
            type(core_token) is not core_owner._CoreIntegralContinuationToken
            or core_token.core_sum is not active.core_sum
            or core_token.result is not initializer_token.core_integral_result
        ):
            raise TailNewtonError(
                "tail_newton_operator_session_invalid", "owned_core_identity"
            )
    kappa = _validate_f64(active.initializer_result.kappa, "operator.kappa")
    if kappa <= 0.0:
        raise TailNewtonError("tail_newton_operator_session_invalid", "kappa")
    return active, kappa


def _validate_tail_operator_evaluation(
    value: object,
    *,
    session: object,
    active: object,
    state: tuple[float, ...],
    mode: str,
    kappa: float,
    expected_ordinal: int,
) -> _FullEvaluation | tuple[float, ...]:
    if type(value) is not _tail_operator.FrozenTailOperatorEvaluation:
        raise TailNewtonError(
            "tail_newton_operator_evaluation_type_invalid",
            type(value).__name__,
        )
    evaluation = value
    expected_labels = tuple(
        (*(
            f"{kind}[{index}]"
            for kind in ("S", "P")
            for index in range(32)
        ), "mass")
    )
    expected_state_bits = tuple(struct.pack("<d", value).hex() for value in state)
    expected_state_hash = _tail_operator._f64_tuple_sha256(
        _tail_operator.STATE_HASH_DOMAIN, state
    )
    expected_projected_hash = _tail_operator._f64_tuple_sha256(
        _tail_operator.PROJECTED_STATE_HASH_DOMAIN,
        active.projected_l2_state,
    )
    newton_mode = mode == _tail_operator.NEWTON_MODE
    expected_chronology_count = 4_689 if newton_mode else 464
    expected_chronology_hash = (
        "f542af634173577b57985ad089f6a152cb62e54a0d816cc1f64d5e14e539d8ec"
        if newton_mode
        else "bc563b5235ff45699d27a11088e3af35b6130f694f042b445c94e88c4a804987"
    )
    full_mass = session.synthetic_mass_cell_count == _tail_operator.FULL_TAIL_CELL_COUNT
    if (
        evaluation.mode != mode
        or evaluation.residual_row_count != RESIDUAL_ROW_COUNT
        or evaluation.unknown_count != UNKNOWN_COUNT
        or evaluation.row_labels != expected_labels
        or evaluation.row_order != _tail_operator.ROW_ORDER
        or evaluation.unknown_order != _tail_operator.UNKNOWN_ORDER
        or evaluation.state_snapshot_bits != expected_state_bits
        or evaluation.state_f64le_sha256 != expected_state_hash
        or evaluation.projected_state_f64le_sha256 != expected_projected_hash
        or evaluation.state_snapshot_count != 1
        or evaluation.state_component_read_count != UNKNOWN_COUNT
        or evaluation.state_bitwise_unchanged is not True
        or evaluation.pde_rows_completed != 64
        or evaluation.mass_rows_completed != 1
        or evaluation.residual_store_count != RESIDUAL_ROW_COUNT
        or evaluation.jacobian_target_touched is not newton_mode
        or evaluation.jacobian_row_store_count
        != (RESIDUAL_ROW_COUNT if newton_mode else 0)
        or evaluation.jacobian_component_store_count
        != (RESIDUAL_ROW_COUNT * UNKNOWN_COUNT if newton_mode else 0)
        or evaluation.pde_jacobian_field_accessed is not newton_mode
        or evaluation.mass_jacobian_field_accessed is not newton_mode
        or evaluation.chronology_event_count != expected_chronology_count
        or evaluation.chronology_sha256 != expected_chronology_hash
        or evaluation.synthetic_mass_cell_count
        != session.synthetic_mass_cell_count
        or evaluation.full_tail_cell_count != _tail_operator.FULL_TAIL_CELL_COUNT
        or evaluation.mass_row_is_partial is not (not full_mass)
        or evaluation.full_tail_mass_execution_observed is not full_mass
        or evaluation.full_tail_mass_golden_verified is not False
        or evaluation.tail_pde_operator_source_sha256
        != _tail_operator.TAIL_PDE_OPERATOR_SOURCE_SHA256
        or evaluation.tail_pde_operator_source_size_bytes
        != _tail_operator.TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES
        or evaluation.tail_mass_operator_source_sha256
        != _tail_operator.TAIL_MASS_OPERATOR_SOURCE_SHA256
        or evaluation.tail_mass_operator_source_size_bytes
        != _tail_operator.TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES
        or evaluation.binary64_environment_source_sha256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or evaluation.binary64_environment_source_size_bytes
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or evaluation.tail_initializer_source_sha256
        != _tail_operator.TAIL_INITIALIZER_SOURCE_SHA256
        or evaluation.tail_initializer_source_size_bytes
        != _tail_operator.TAIL_INITIALIZER_SOURCE_SIZE_BYTES
        or evaluation.tail_initializer_source_status
        != _tail_operator.TAIL_INITIALIZER_SOURCE_STATUS
        or evaluation.production_dependencies_sealed is not True
        or evaluation.binary64_runtime_family
        != _binary64_environment.BINARY64_RUNTIME_FAMILY
        or evaluation.session_id_sha256 != session.session_id_sha256
        or evaluation.session_evaluation_ordinal != expected_ordinal
        or evaluation.retained_core_get_d_count != 1
        or evaluation.synthetic_dependencies_used
        is not session.synthetic_dependencies_used
        or evaluation.calculation_implemented is not True
        or evaluation.combined_residual_implemented is not True
        or evaluation.analytic_jacobian_implemented is not True
        or evaluation.final_residual_only_mode_implemented is not True
        or evaluation.initializer_continuation_consumed is not True
        or evaluation.production_adapter_available
        is not (not session.synthetic_dependencies_used)
        or any(
            getattr(evaluation, field, None) is not False
            for field in _TAIL_OPERATOR_FALSE_FIELDS
        )
    ):
        raise TailNewtonError("tail_newton_operator_evaluation_invalid", "metadata")
    if type(evaluation.residual) is not tuple or len(evaluation.residual) != 65:
        raise TailNewtonError("tail_newton_operator_residual_shape_invalid", "root")
    residual = tuple(
        _validate_f64(component, f"operator.residual[{row}]")
        for row, component in enumerate(evaluation.residual)
    )
    if not newton_mode:
        if evaluation.jacobian is not None:
            raise TailNewtonError(
                "tail_newton_operator_residual_mode_touched_jacobian", "root"
            )
        return residual
    if type(evaluation.jacobian) is not tuple or len(evaluation.jacobian) != 65:
        raise TailNewtonError("tail_newton_operator_jacobian_shape_invalid", "root")
    rows: list[tuple[float, ...]] = []
    for row_index, row in enumerate(evaluation.jacobian):
        if type(row) is not tuple or len(row) != 65:
            raise TailNewtonError(
                "tail_newton_operator_jacobian_row_invalid", str(row_index)
            )
        rows.append(tuple(
            _validate_f64(component, f"operator.jacobian[{row_index},{column}]")
            for column, component in enumerate(row)
        ))
    return _FullEvaluation(residual=residual, jacobian=tuple(rows), kappa=kappa)


def _open_tail_newton_session_from_core_level_continuation(
    *,
    core_level_continuation: object,
    collocation: object,
) -> object:
    """Transfer the exact consumed core capability down the canonical lineage."""

    _verify_dependency_bindings()
    initializer = _tail_operator._tail_initializer_module
    core_owner = initializer._core_quadrature
    try:
        owner = core_level_continuation.owner_core_quadrature_module
        join_result = core_level_continuation.join_result
        core_integral_result = core_level_continuation.core_integral_result
        core_token = core_level_continuation.core_quadrature_token
        projected = core_level_continuation.projected_l2_archive
        join_values = core_level_continuation.join_barriers
        core64 = core_level_continuation.core64
    except (AttributeError, TypeError) as error:
        raise TailNewtonError(
            "tail_newton_core_level_continuation_shape_invalid",
            type(error).__name__,
        ) from error
    if (
        type(owner) is not ModuleType
        or owner is not core_owner
        or type(core_token) is not core_owner._CoreIntegralContinuationToken
        or core_token.result is not core_integral_result
        or type(join_result)
        is not initializer._join_extraction.FrozenL2JoinBarriers
        or type(core64) is not float
        or struct.pack("<d", core64) != struct.pack("<d", core_token.core64)
        or type(projected) is not tuple
        or type(join_values) is not tuple
        or len(join_values) != 4
        or type(join_result.barrier_values) is not tuple
        or len(join_result.barrier_values) != 4
        or any(
            type(left) is not float
            or type(right) is not float
            or struct.pack("<d", left) != struct.pack("<d", right)
            for left, right in zip(
                join_result.barrier_values, join_values, strict=True
            )
        )
        or core_owner._pending_core_integral_continuation is not None
    ):
        raise TailNewtonError(
            "tail_newton_core_level_continuation_identity_invalid", "root"
        )
    try:
        initializer_result = (
            initializer._materialize_primary_tail_initializer_from_owned_core_continuation(
                owner_core_quadrature_module=owner,
                projected_l2_state=projected,
                join_barriers=join_result,
                core_integral=core_integral_result,
                core_integral_continuation=core_token,
            )
        )
    except initializer.TailInitializerError as error:
        raise TailNewtonError(
            "tail_newton_initializer_continuation_transfer_failed", error.code
        ) from error
    try:
        return _tail_operator._open_bound_tail_operator_session(
            initializer_result=initializer_result,
            collocation=collocation,
            join_barriers=join_result,
            projected_l2_state=projected,
        )
    except Exception as error:
        pending = initializer._pending_tail_initializer_continuation
        if pending is not None and pending.result is initializer_result:
            try:
                initializer._consume_tail_initializer_continuation(
                    initializer_result
                )
            except initializer.TailInitializerError:
                pass
        raise TailNewtonError(
            "tail_newton_operator_session_open_failed",
            (
                error.code
                if type(error) is _tail_operator.TailOperatorError
                else type(error).__name__
            ),
        ) from error


def _solve_tail_newton_with_session(
    *,
    tail_operator_session: object,
    initial_state: tuple[float, ...],
) -> FrozenTailNewtonResult:
    """Internal exact-instance composition used by the future shared producer."""

    _verify_dependency_bindings()
    active, kappa = _validate_tail_operator_session(tail_operator_session)
    try:
        active = _tail_operator._claim_tail_operator_session(
            tail_operator_session, initial_state
        )
    except _tail_operator.TailOperatorError as error:
        raise TailNewtonError(
            "tail_newton_operator_session_claim_failed", error.code
        ) from error
    expected_ordinal = active.evaluation_count + 1

    def full_evaluator(state: tuple[float, ...]) -> _FullEvaluation:
        nonlocal expected_ordinal
        try:
            raw = _tail_operator.evaluate_primary_tail_operator(
                session=tail_operator_session,
                state=state,
                mode=_tail_operator.NEWTON_MODE,
            )
        except _tail_operator.TailOperatorError as error:
            raise _EvaluationFailed(error.code) from error
        try:
            validated = _validate_tail_operator_evaluation(
                raw,
                session=tail_operator_session,
                active=active,
                state=state,
                mode=_tail_operator.NEWTON_MODE,
                kappa=kappa,
                expected_ordinal=expected_ordinal,
            )
        except TailNewtonError as error:
            raise _EvaluationFailed(error.code) from error
        expected_ordinal += 1
        if type(validated) is not _FullEvaluation:
            raise TailNewtonError("tail_newton_operator_mode_invariant", "Newton")
        return validated

    def residual_only_evaluator(state: tuple[float, ...]) -> tuple[float, ...]:
        nonlocal expected_ordinal
        try:
            raw = _tail_operator.evaluate_primary_tail_operator(
                session=tail_operator_session,
                state=state,
                mode=_tail_operator.FINAL_RESIDUAL_GATE_MODE,
            )
        except _tail_operator.TailOperatorError as error:
            raise _EvaluationFailed(error.code) from error
        try:
            validated = _validate_tail_operator_evaluation(
                raw,
                session=tail_operator_session,
                active=active,
                state=state,
                mode=_tail_operator.FINAL_RESIDUAL_GATE_MODE,
                kappa=kappa,
                expected_ordinal=expected_ordinal,
            )
        except TailNewtonError as error:
            raise _EvaluationFailed(error.code) from error
        expected_ordinal += 1
        if type(validated) is not tuple:
            raise TailNewtonError(
                "tail_newton_operator_mode_invariant", "finalResidualGate"
            )
        return validated

    try:
        result = _solve_tail_newton_graph(
            initial_state=initial_state,
            full_evaluator=full_evaluator,
            residual_only_evaluator=residual_only_evaluator,
            synthetic_evaluator_used=(
                tail_operator_session.synthetic_dependencies_used
            ),
            _bound_operator_session_validated=(
                not tail_operator_session.synthetic_dependencies_used
            ),
        )
    except Exception:
        try:
            _tail_operator._abort_tail_operator_session(
                tail_operator_session
            )
        except _tail_operator.TailOperatorError:
            pass
        raise
    try:
        if result.final_residual_gate_passed:
            _tail_operator._complete_tail_operator_session(
                tail_operator_session
            )
        else:
            _tail_operator._abort_tail_operator_session(
                tail_operator_session
            )
    except _tail_operator.TailOperatorError as error:
        raise TailNewtonError(
            "tail_newton_operator_session_terminal_failed", error.code
        ) from error
    return result


def _make_result(
    *,
    current_state: tuple[float, ...],
    accepted_state: tuple[float, ...] | None,
    final_residual: tuple[float, ...] | None,
    kappa: float | None,
    newton_terminated: bool,
    final_residual_gate_passed: bool,
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
    final_residual_linf: float | None,
    synthetic_evaluator_used: bool,
) -> FrozenTailNewtonResult:
    return FrozenTailNewtonResult(
        unknown_count=UNKNOWN_COUNT,
        residual_row_count=RESIDUAL_ROW_COUNT,
        current_state=current_state,
        accepted_state=accepted_state,
        final_residual=final_residual,
        kappa=kappa,
        newton_terminated=newton_terminated,
        final_residual_gate_passed=final_residual_gate_passed,
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
        final_residual_linf=final_residual_linf,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        binary64_environment_source_sha256=BINARY64_ENVIRONMENT_SOURCE_SHA256,
        binary64_environment_source_size_bytes=BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
        dense_lu_source_sha256=DENSE_LU_SOURCE_SHA256,
        dense_lu_source_size_bytes=DENSE_LU_SOURCE_SIZE_BYTES,
        tail_operator_source_sha256=TAIL_OPERATOR_SOURCE_SHA256,
        tail_operator_source_size_bytes=TAIL_OPERATOR_SOURCE_SIZE_BYTES,
        tail_operator_dependency_sealed=TAIL_OPERATOR_DEPENDENCY_SEALED,
        binary64_runtime_family=_binary64_environment.BINARY64_RUNTIME_FAMILY,
        synthetic_evaluator_used=synthetic_evaluator_used,
    )


def _solve_tail_newton_graph(
    *,
    initial_state: tuple[float, ...],
    full_evaluator: _FullEvaluator,
    residual_only_evaluator: _ResidualOnlyEvaluator,
    synthetic_evaluator_used: bool,
    _bound_operator_session_validated: bool = False,
) -> FrozenTailNewtonResult:
    """Execute the finite graph; tests call this only with synthetic maps."""

    if type(synthetic_evaluator_used) is not bool:
        raise TailNewtonError("tail_newton_synthetic_flag_invalid", "type")
    _verify_dependency_bindings()
    if not synthetic_evaluator_used and not _bound_operator_session_validated:
        _require_tail_operator_source()

    with _binary64_environment.nearest_binary64_environment():
        current = _validate_initial_state(initial_state)
        accepted_update_count = 0
        dense_lu_solve_count = 0
        full_evaluation_count = 1
        trial_attempt_count = 0
        trial_full_evaluation_count = 0
        residual_only_evaluation_count = 0
        accepted_exponents: list[int] = []
        equation_linf = 0.0
        last_scaled_step: float | None = None
        consecutive = 0
        frozen_kappa: float | None = None

        def finish(
            failure_code: str | None,
            *,
            newton_terminated: bool = False,
            gate_passed: bool = False,
            accepted_state: tuple[float, ...] | None = None,
            final_residual: tuple[float, ...] | None = None,
            final_residual_linf: float | None = None,
        ) -> FrozenTailNewtonResult:
            return _make_result(
                current_state=current,
                accepted_state=accepted_state,
                final_residual=final_residual,
                kappa=frozen_kappa,
                newton_terminated=newton_terminated,
                final_residual_gate_passed=gate_passed,
                failure_code=failure_code,
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
                final_residual_linf=final_residual_linf,
                synthetic_evaluator_used=synthetic_evaluator_used,
            )

        try:
            raw_initial = full_evaluator(current)
        except _EvaluationFailed:
            return finish("initial_full_evaluation_failed_without_retry")
        except Exception as error:
            raise TailNewtonError(
                "tail_newton_full_evaluator_raised", type(error).__name__
            ) from error
        initial_evaluation = _validate_full_evaluation(raw_initial)
        frozen_kappa = initial_evaluation.kappa
        equation_linf = _equation_linf(initial_evaluation.residual)
        if not _domain_valid(current, initial_evaluation):
            return finish("initial_domain_invalid_without_retry")

        residual = initial_evaluation.residual
        jacobian = initial_evaluation.jacobian
        try:
            current_sum_squares, current_phi = _ordered_merit(residual)
        except TailNewtonError:
            return finish("initial_merit_failed_without_retry")

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
                return finish("dense_lu_failed_without_retry")
            direction = _validate_dense_lu_result(dense_result)

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
                        for index in range(UNKNOWN_COUNT)
                    )
                    trial = tuple(
                        _add64(
                            current[index],
                            step[index],
                            f"update[{update_index}].trial[{exponent}].state[{index}]",
                        )
                        for index in range(UNKNOWN_COUNT)
                    )
                except TailNewtonError:
                    return finish("trial_state_failed_without_retry")

                full_evaluation_count += 1
                trial_full_evaluation_count += 1
                try:
                    raw_trial = full_evaluator(trial)
                except _EvaluationFailed:
                    return finish("trial_full_evaluation_failed_without_retry")
                except Exception as error:
                    raise TailNewtonError(
                        "tail_newton_full_evaluator_raised", type(error).__name__
                    ) from error
                trial_evaluation = _validate_full_evaluation(raw_trial)
                if not _domain_valid(trial, trial_evaluation):
                    continue
                if struct.pack("<d", trial_evaluation.kappa) != struct.pack(
                    "<d", frozen_kappa
                ):
                    return finish("trial_kappa_changed_without_retry")
                try:
                    trial_sum_squares, trial_phi = _ordered_merit(
                        trial_evaluation.residual
                    )
                    rhs = _armijo_rhs(
                        alpha=alpha,
                        current_sum_squares=current_sum_squares,
                        current_phi=current_phi,
                    )
                except TailNewtonError:
                    return finish("trial_merit_or_armijo_failed_without_retry")
                if trial_phi <= rhs:
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
                return finish("armijo_schedule_exhausted_without_retry")

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
            return finish("maximum_updates_reached_without_retry")

        accepted_state = tuple(value for value in current)
        for index in range(UNKNOWN_COUNT):
            if struct.pack("<d", accepted_state[index]) != struct.pack(
                "<d", current[index]
            ):
                raise TailNewtonError("tail_newton_accepted_copy_failed", str(index))

        residual_only_evaluation_count = 1
        try:
            raw_final = residual_only_evaluator(accepted_state)
        except _EvaluationFailed:
            return finish(
                "final_residual_evaluation_failed_without_retry",
                newton_terminated=True,
                accepted_state=accepted_state,
            )
        except Exception as error:
            raise TailNewtonError(
                "tail_newton_residual_evaluator_raised", type(error).__name__
            ) from error
        try:
            final_residual = _validate_residual_only(raw_final)
        except TailNewtonError:
            return finish(
                "final_residual_gate_failed_without_retry",
                newton_terminated=True,
                accepted_state=accepted_state,
            )
        final_linf = _equation_linf(final_residual)
        if final_linf > EQUATION_LINF_THRESHOLD:
            return finish(
                "final_residual_gate_failed_without_retry",
                newton_terminated=True,
                accepted_state=accepted_state,
                final_residual=final_residual,
                final_residual_linf=final_linf,
            )
        return finish(
            None,
            newton_terminated=True,
            gate_passed=True,
            accepted_state=accepted_state,
            final_residual=final_residual,
            final_residual_linf=final_linf,
        )


def solve_primary_tail_newton(
    *,
    operator_input: object,
    initial_state: tuple[float, ...],
) -> FrozenTailNewtonResult:
    """Fail before caller traversal at the shared-instance composition blocker."""

    del operator_input, initial_state
    _verify_dependency_bindings()
    _require_tail_operator_source()


if (
    len(PRIMARY_NUMERICS_POLICY_SHA256) != 64
    or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != 80_055
    or len(BINARY64_ENVIRONMENT_SOURCE_SHA256) != 64
    or BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != 14_980
    or len(DENSE_LU_SOURCE_SHA256) != 64
    or DENSE_LU_SOURCE_SIZE_BYTES != 25_345
    or len(TAIL_OPERATOR_SOURCE_SHA256) != 64
    or TAIL_OPERATOR_SOURCE_SIZE_BYTES != 94_800
    or TAIL_OPERATOR_DEPENDENCY_SEALED is not True
    or TAIL_OPERATOR_SESSION_COMPOSITION_STATUS
    != "blocked_shared_private_tail_operator_instance_not_composed"
    or UNKNOWN_COUNT != 65
    or RESIDUAL_ROW_COUNT != 65
    or MAXIMUM_ACCEPTED_UPDATES != 48
    or MAXIMUM_BACKTRACK_EXPONENT != 24
    or BACKTRACK_TRIAL_COUNT != 25
    or CONSECUTIVE_QUALIFYING_UPDATES != 2
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_tail_newton_invariant")


__all__ = [
    "ARMIJO_C",
    "AUTHORITY_LOCKS",
    "BACKTRACK_TRIAL_COUNT",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "CONSECUTIVE_QUALIFYING_UPDATES",
    "DENSE_LU_SOURCE_SHA256",
    "DENSE_LU_SOURCE_SIZE_BYTES",
    "EQUATION_LINF_THRESHOLD",
    "FINAL_RESIDUAL_GATE_OPERATION_GRAPH",
    "FrozenTailNewtonResult",
    "MAXIMUM_ACCEPTED_UPDATES",
    "MAXIMUM_BACKTRACK_EXPONENT",
    "MERIT_ARMIJO_OPERATION_GRAPH",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "RESIDUAL_ROW_COUNT",
    "SCALED_STEP_LINF_THRESHOLD",
    "STOP_OPERATION_GRAPH",
    "TAIL_NEWTON_OPERATION_GRAPH",
    "TAIL_NEWTON_VERSION",
    "TAIL_OPERATOR_DEPENDENCY_SEALED",
    "TAIL_OPERATOR_SESSION_COMPOSITION_STATUS",
    "TAIL_OPERATOR_SOURCE_SHA256",
    "TAIL_OPERATOR_SOURCE_SIZE_BYTES",
    "TailNewtonError",
    "UNKNOWN_COUNT",
    "solve_primary_tail_newton",
]
