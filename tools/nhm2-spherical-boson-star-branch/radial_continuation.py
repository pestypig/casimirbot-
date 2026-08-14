"""Deterministic finite-amplitude continuation diagnostic.

The schedule is the seven exact binary64 powers of two from ``2^-16`` through
the frozen target ``2^-10``.  The caller supplies the initializer for the
lowest stage.  A converged stage state is the sole predictor for the next
stage, and each stage receives exactly one deterministic Newton attempt.
Failure stops the chronology immediately: there is no retry, retuning,
interpolation, extrapolation, alternate grid, or alternate initializer.

This finite diagnostic does not prove a continuous connection to the vacuum:
its first amplitude is nonzero and it performs no interval proof.  Recorded
nodal signs, nodal ordering, and frequency progression also do not establish a
no-fold result without a tangent proof.  It has no candidate, replay,
viability, physical, propulsion, or transport authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
import struct
from typing import Final

from binary64_environment import nearest_binary64
from deterministic_newton import (
    DeterministicNewtonResult,
    solve_spherical_radial_compactified_diagnostic,
)
from radial_collocation_interior import RadialCollocationState
from radial_compactified_system import (
    CompactifiedDifferentiationData,
    ORIGIN_AMPLITUDE,
    _validated_grid,
    _validated_state,
)


RADIAL_CONTINUATION_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_radial_amplitude_continuation/v1"
)
_FROZEN_ORIGIN_AMPLITUDE_SCHEDULE: Final[tuple[float, ...]] = (
    2.0**-16,
    2.0**-15,
    2.0**-14,
    2.0**-13,
    2.0**-12,
    2.0**-11,
    2.0**-10,
)
ORIGIN_AMPLITUDE_SCHEDULE: Final[tuple[float, ...]] = (
    _FROZEN_ORIGIN_AMPLITUDE_SCHEDULE
)
LOWEST_STAGE_PREDICTOR_SOURCE: Final[str] = "lowest_stage_caller_initializer"
LATER_STAGE_PREDICTOR_SOURCE: Final[str] = "previous_accepted_solution"
STAGE_CHRONOLOGY: Final[str] = (
    "validate_frozen_schedule_and_caller_shape_then_for_each_amplitude_ascending:"
    "one_newton_attempt_then_record_diagnostics_then_accept_or_stop"
)


@dataclass(frozen=True, slots=True)
class RadialContinuationStage:
    stage_index: int
    origin_amplitude: float
    predictor_source: str
    state: RadialCollocationState
    accepted: bool
    newton_failure_code: str | None
    newton_accepted_update_count: int
    newton_residual_linf: float
    newton_scaled_step_linf: float | None
    newton_consecutive_pass_count: int
    newton_accepted_alpha_exponents: tuple[int, ...]
    unused_constraint_linf: float
    w: float
    varphi_nodes_nonnegative: bool
    varphi_finite_nodes_strictly_positive: bool
    varphi_nodes_nonincreasing: bool
    newton_attempt_count: int = 1


@dataclass(frozen=True, slots=True)
class RadialAmplitudeContinuationResult:
    origin_amplitude_schedule: tuple[float, ...]
    stages: tuple[RadialContinuationStage, ...]
    completed: bool
    failure_stage_index: int | None
    failure_code: str | None
    attempted_stage_count: int
    accepted_stage_count: int
    final_accepted_state: RadialCollocationState | None
    w_progression: tuple[float, ...]
    unused_constraint_linf_progression: tuple[float, ...]
    varphi_nodes_nonnegative_progression: tuple[bool, ...]
    varphi_finite_nodes_strictly_positive_progression: tuple[bool, ...]
    varphi_nodes_nonincreasing_progression: tuple[bool, ...]
    stage_chronology: str = STAGE_CHRONOLOGY
    operation_version: str = RADIAL_CONTINUATION_VERSION
    calculation_implemented: bool = True
    deterministic_finite_continuation_implemented: bool = True
    one_newton_attempt_per_stage: bool = True
    retry_allowed: bool = False
    retune_allowed: bool = False
    alternate_initializer_allowed: bool = False
    alternate_grid_allowed: bool = False
    interpolation_predictor_allowed: bool = False
    extrapolation_predictor_allowed: bool = False
    continuous_vacuum_connection_established: bool = False
    interval_proof_performed: bool = False
    tangent_proof_performed: bool = False
    no_fold_established: bool = False
    first_branch_established: bool = False
    candidate_execution_authority: bool = False
    frozen_candidate_execution_observed: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _same_binary64(left: float, right: float) -> bool:
    return struct.pack(">d", left) == struct.pack(">d", right)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and _same_binary64(value, -0.0)


def _validated_frozen_schedule() -> tuple[float, ...]:
    observed = ORIGIN_AMPLITUDE_SCHEDULE
    expected = _FROZEN_ORIGIN_AMPLITUDE_SCHEDULE
    if type(observed) is not tuple or len(observed) != len(expected):
        raise RuntimeError("origin-amplitude schedule shape invariant failed")
    for index, (value, frozen) in enumerate(zip(observed, expected, strict=True)):
        if type(value) is not float or not _same_binary64(value, frozen):
            raise RuntimeError(
                f"origin-amplitude schedule value invariant failed at stage {index}"
            )
        if index > 0 and not _same_binary64(value, 2.0 * observed[index - 1]):
            raise RuntimeError(
                f"origin-amplitude schedule doubling invariant failed at stage {index}"
            )
    if not _same_binary64(observed[-1], ORIGIN_AMPLITUDE):
        raise RuntimeError("origin-amplitude target invariant failed")
    return observed


def _validate_caller_shape(
    grid: object, lowest_stage_initial_state: object
) -> tuple[CompactifiedDifferentiationData, RadialCollocationState]:
    if type(grid) is not CompactifiedDifferentiationData:
        raise ValueError("grid must be an exact CompactifiedDifferentiationData")
    if type(lowest_stage_initial_state) is not RadialCollocationState:
        raise ValueError("lowest_stage_initial_state must be an exact state")
    frozen_grid = _validated_grid(grid)
    _validated_state(lowest_stage_initial_state, len(frozen_grid.rho))
    return grid, lowest_stage_initial_state


def _validate_newton_result(
    result: object, *, origin_amplitude: float, node_count: int
) -> DeterministicNewtonResult:
    if type(result) is not DeterministicNewtonResult:
        raise RuntimeError("Newton stage returned an invalid result type")
    if type(result.origin_amplitude) is not float or not _same_binary64(
        result.origin_amplitude, origin_amplitude
    ):
        raise RuntimeError("Newton stage returned the wrong origin amplitude")
    _validated_state(result.state, node_count)
    if type(result.converged) is not bool:
        raise RuntimeError("Newton stage convergence flag is invalid")
    if result.converged:
        if result.failure_code is not None:
            raise RuntimeError("converged Newton stage returned a failure code")
    elif type(result.failure_code) is not str or not result.failure_code:
        raise RuntimeError("failed Newton stage omitted its failure code")
    if type(result.unused_constraint_linf) not in (int, float):
        raise RuntimeError("Newton stage unused-constraint maximum is invalid")
    try:
        unused_constraint_linf = float(result.unused_constraint_linf)
    except (OverflowError, ValueError) as error:
        raise RuntimeError(
            "Newton stage unused-constraint maximum is invalid"
        ) from error
    if (
        not math.isfinite(unused_constraint_linf)
        or unused_constraint_linf < 0.0
        or _negative_zero(unused_constraint_linf)
    ):
        raise RuntimeError("Newton stage unused-constraint maximum is invalid")
    return result


def _stage_record(
    *,
    stage_index: int,
    origin_amplitude: float,
    predictor_source: str,
    result: DeterministicNewtonResult,
) -> RadialContinuationStage:
    varphi = result.state.varphi
    nonnegative = all(value >= 0.0 for value in varphi)
    finite_positive = all(value > 0.0 for value in varphi[:-1])
    nonincreasing = all(
        varphi[index] >= varphi[index + 1] for index in range(len(varphi) - 1)
    )
    return RadialContinuationStage(
        stage_index=stage_index,
        origin_amplitude=origin_amplitude,
        predictor_source=predictor_source,
        state=result.state,
        accepted=result.converged,
        newton_failure_code=result.failure_code,
        newton_accepted_update_count=result.accepted_update_count,
        newton_residual_linf=result.residual_linf,
        newton_scaled_step_linf=result.scaled_step_linf,
        newton_consecutive_pass_count=result.consecutive_pass_count,
        newton_accepted_alpha_exponents=result.accepted_alpha_exponents,
        unused_constraint_linf=float(result.unused_constraint_linf),
        w=result.state.w,
        varphi_nodes_nonnegative=nonnegative,
        varphi_finite_nodes_strictly_positive=finite_positive,
        varphi_nodes_nonincreasing=nonincreasing,
    )


@nearest_binary64
def continue_spherical_radial_compactified_diagnostic(
    *,
    grid: CompactifiedDifferentiationData,
    lowest_stage_initial_state: RadialCollocationState,
) -> RadialAmplitudeContinuationResult:
    """Execute the frozen finite schedule once, stopping at the first failure."""

    schedule = _validated_frozen_schedule()
    frozen_grid, predictor = _validate_caller_shape(
        grid, lowest_stage_initial_state
    )
    node_count = len(frozen_grid.rho)
    stages: list[RadialContinuationStage] = []
    final_accepted_state: RadialCollocationState | None = None
    failure_stage_index: int | None = None
    failure_code: str | None = None

    for stage_index, origin_amplitude in enumerate(schedule):
        predictor_source = (
            LOWEST_STAGE_PREDICTOR_SOURCE
            if stage_index == 0
            else LATER_STAGE_PREDICTOR_SOURCE
        )
        newton = solve_spherical_radial_compactified_diagnostic(
            grid=frozen_grid,
            initial_state=predictor,
            origin_amplitude=origin_amplitude,
        )
        newton = _validate_newton_result(
            newton,
            origin_amplitude=origin_amplitude,
            node_count=node_count,
        )
        stage = _stage_record(
            stage_index=stage_index,
            origin_amplitude=origin_amplitude,
            predictor_source=predictor_source,
            result=newton,
        )
        stages.append(stage)
        if not newton.converged:
            failure_stage_index = stage_index
            failure_code = newton.failure_code
            break
        final_accepted_state = newton.state
        predictor = newton.state

    frozen_stages = tuple(stages)
    accepted_stage_count = sum(stage.accepted for stage in frozen_stages)
    completed = len(frozen_stages) == len(schedule) and failure_code is None
    return RadialAmplitudeContinuationResult(
        origin_amplitude_schedule=schedule,
        stages=frozen_stages,
        completed=completed,
        failure_stage_index=failure_stage_index,
        failure_code=failure_code,
        attempted_stage_count=len(frozen_stages),
        accepted_stage_count=accepted_stage_count,
        final_accepted_state=final_accepted_state,
        w_progression=tuple(stage.w for stage in frozen_stages),
        unused_constraint_linf_progression=tuple(
            stage.unused_constraint_linf for stage in frozen_stages
        ),
        varphi_nodes_nonnegative_progression=tuple(
            stage.varphi_nodes_nonnegative for stage in frozen_stages
        ),
        varphi_finite_nodes_strictly_positive_progression=tuple(
            stage.varphi_finite_nodes_strictly_positive for stage in frozen_stages
        ),
        varphi_nodes_nonincreasing_progression=tuple(
            stage.varphi_nodes_nonincreasing for stage in frozen_stages
        ),
    )


__all__ = [
    "LATER_STAGE_PREDICTOR_SOURCE",
    "LOWEST_STAGE_PREDICTOR_SOURCE",
    "ORIGIN_AMPLITUDE_SCHEDULE",
    "RADIAL_CONTINUATION_VERSION",
    "RadialAmplitudeContinuationResult",
    "RadialContinuationStage",
    "STAGE_CHRONOLOGY",
    "continue_spherical_radial_compactified_diagnostic",
]
