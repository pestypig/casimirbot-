"""Deterministic Newton/Armijo chronology for the compactified radial map.

The finite update graph is implemented and covered with synthetic equations,
but this module is not a frozen candidate executor.  In particular it has no
candidate source/runtime/preseal binding, does not itself choose a continuation
schedule, and has no authority to interpret a converged diagnostic calculation
as the requested branch or as replay evidence.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Callable, Final

from binary64_environment import nearest_binary64

from deterministic_dense_lu import solve_deterministic_dense_lu
from radial_collocation_interior import RadialCollocationState
from radial_compactified_system import (
    CompactifiedDifferentiationData,
    ORIGIN_AMPLITUDE,
    _validated_origin_amplitude,
    evaluate_spherical_radial_compactified_system,
)


DETERMINISTIC_NEWTON_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_deterministic_newton_armijo/v2"
)
MAXIMUM_NEWTON_UPDATES: Final[int] = 48
MAXIMUM_BACKTRACK_EXPONENT: Final[int] = 24
ARMIJO_C: Final[float] = 2.0**-12
RESIDUAL_LINF_THRESHOLD: Final[float] = 2.0**-40
SCALED_STEP_LINF_THRESHOLD: Final[float] = 2.0**-42
CONSECUTIVE_PASS_COUNT: Final[int] = 2


@dataclass(frozen=True, slots=True)
class DeterministicNewtonResult:
    state: RadialCollocationState
    origin_amplitude: float
    converged: bool
    failure_code: str | None
    accepted_update_count: int
    residual_linf: float
    scaled_step_linf: float | None
    consecutive_pass_count: int
    accepted_alpha_exponents: tuple[int, ...]
    unused_constraint_linf: float
    operation_version: str = DETERMINISTIC_NEWTON_VERSION
    calculation_implemented: bool = True
    numerical_attempt_performed: bool = True
    one_attempt_only: bool = True
    retry_allowed: bool = False
    retune_allowed: bool = False
    alternate_initializer_allowed: bool = False
    alternate_grid_allowed: bool = False
    candidate_execution_authority: bool = False
    frozen_candidate_execution_observed: bool = False
    first_branch_established: bool = False
    no_fold_established: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


@dataclass(frozen=True, slots=True)
class _NewtonCoreResult:
    values: tuple[float, ...]
    converged: bool
    failure_code: str | None
    accepted_update_count: int
    residual_linf: float
    scaled_step_linf: float | None
    consecutive_pass_count: int
    accepted_alpha_exponents: tuple[int, ...]


_Evaluation = Callable[
    [tuple[float, ...]],
    tuple[tuple[float, ...], tuple[tuple[float, ...], ...]],
]
_Domain = Callable[[tuple[float, ...]], bool]


def _canonical(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


def _linf(values: tuple[float, ...]) -> float:
    return _canonical(max((abs(value) for value in values), default=0.0), "linf")


def _l2(values: tuple[float, ...]) -> float:
    result = 0.0
    for value in values:
        result = math.hypot(result, value)
    return _canonical(result, "l2")


def _validate_evaluation(
    values: tuple[float, ...],
    residual: object,
    jacobian: object,
) -> tuple[tuple[float, ...], tuple[tuple[float, ...], ...]]:
    order = len(values)
    if type(residual) is not tuple or len(residual) != order:
        raise ValueError("Newton residual must be an exact square tuple")
    if type(jacobian) is not tuple or len(jacobian) != order:
        raise ValueError("Newton Jacobian must be an exact square tuple")
    residual_values = tuple(
        _canonical(float(value), f"residual[{index}]")
        if type(value) in (int, float)
        else (_ for _ in ()).throw(ValueError(f"residual[{index}] is not real"))
        for index, value in enumerate(residual)
    )
    rows: list[tuple[float, ...]] = []
    for row_index, row in enumerate(jacobian):
        if type(row) is not tuple or len(row) != order:
            raise ValueError(f"Jacobian row {row_index} is invalid")
        rows.append(
            tuple(
                _canonical(float(value), f"jacobian[{row_index},{column_index}]")
                if type(value) in (int, float)
                else (_ for _ in ()).throw(
                    ValueError(f"jacobian[{row_index},{column_index}] is not real")
                )
                for column_index, value in enumerate(row)
            )
        )
    return residual_values, tuple(rows)


def _evaluate(
    evaluator: _Evaluation, values: tuple[float, ...]
) -> tuple[tuple[float, ...], tuple[tuple[float, ...], ...]]:
    residual, jacobian = evaluator(values)
    return _validate_evaluation(values, residual, jacobian)


@nearest_binary64
def _solve_newton_map(
    *, initial: tuple[float, ...], evaluator: _Evaluation, domain: _Domain
) -> _NewtonCoreResult:
    if type(initial) is not tuple or len(initial) < 1:
        raise ValueError("Newton initial state must be a nonempty exact tuple")
    current = tuple(
        _canonical(float(value), f"initial[{index}]")
        if type(value) in (int, float)
        else (_ for _ in ()).throw(ValueError(f"initial[{index}] is not real"))
        for index, value in enumerate(initial)
    )
    if not domain(current):
        raise ValueError("Newton initial state is outside the frozen domain")
    residual, jacobian = _evaluate(evaluator, current)
    residual_linf = _linf(residual)
    pass_count = 0
    accepted_exponents: list[int] = []
    last_scaled_step: float | None = None

    for update in range(MAXIMUM_NEWTON_UPDATES):
        try:
            direction_result = solve_deterministic_dense_lu(
                matrix=jacobian,
                rhs=tuple(0.0 if value == 0.0 else -value for value in residual),
            )
        except ValueError:
            return _NewtonCoreResult(
                values=current,
                converged=False,
                failure_code="linear_solve_failed_without_retry",
                accepted_update_count=update,
                residual_linf=residual_linf,
                scaled_step_linf=last_scaled_step,
                consecutive_pass_count=pass_count,
                accepted_alpha_exponents=tuple(accepted_exponents),
            )
        direction = direction_result.solution
        current_merit = _l2(residual)
        accepted: tuple[
            tuple[float, ...],
            tuple[float, ...],
            tuple[tuple[float, ...], ...],
            int,
            float,
        ] | None = None
        for exponent in range(MAXIMUM_BACKTRACK_EXPONENT + 1):
            alpha = 2.0**-exponent
            try:
                trial = tuple(
                    _canonical(
                        current[index] + alpha * direction[index],
                        f"trial[{exponent},{index}]",
                    )
                    for index in range(len(current))
                )
            except ValueError:
                continue
            if not domain(trial):
                continue
            try:
                trial_residual, trial_jacobian = _evaluate(evaluator, trial)
                trial_merit = _l2(trial_residual)
            except ValueError:
                continue
            scaled_step = _linf(
                tuple(
                    abs(alpha * direction[index]) / max(1.0, abs(trial[index]))
                    for index in range(len(trial))
                )
            )
            armijo_bound = (1.0 - ARMIJO_C * alpha) * current_merit
            stationary_gate = (
                trial == current
                and residual_linf <= RESIDUAL_LINF_THRESHOLD
                and scaled_step <= SCALED_STEP_LINF_THRESHOLD
            )
            if trial_merit <= armijo_bound or stationary_gate:
                accepted = (
                    trial,
                    trial_residual,
                    trial_jacobian,
                    exponent,
                    scaled_step,
                )
                break
        if accepted is None:
            return _NewtonCoreResult(
                values=current,
                converged=False,
                failure_code="armijo_schedule_exhausted_without_retry",
                accepted_update_count=update,
                residual_linf=residual_linf,
                scaled_step_linf=last_scaled_step,
                consecutive_pass_count=pass_count,
                accepted_alpha_exponents=tuple(accepted_exponents),
            )
        current, residual, jacobian, exponent, last_scaled_step = accepted
        accepted_exponents.append(exponent)
        residual_linf = _linf(residual)
        if (
            residual_linf <= RESIDUAL_LINF_THRESHOLD
            and last_scaled_step <= SCALED_STEP_LINF_THRESHOLD
        ):
            pass_count += 1
        else:
            pass_count = 0
        if pass_count == CONSECUTIVE_PASS_COUNT:
            return _NewtonCoreResult(
                values=current,
                converged=True,
                failure_code=None,
                accepted_update_count=update + 1,
                residual_linf=residual_linf,
                scaled_step_linf=last_scaled_step,
                consecutive_pass_count=pass_count,
                accepted_alpha_exponents=tuple(accepted_exponents),
            )
    return _NewtonCoreResult(
        values=current,
        converged=False,
        failure_code="maximum_newton_updates_reached_without_retry",
        accepted_update_count=MAXIMUM_NEWTON_UPDATES,
        residual_linf=residual_linf,
        scaled_step_linf=last_scaled_step,
        consecutive_pass_count=pass_count,
        accepted_alpha_exponents=tuple(accepted_exponents),
    )


@nearest_binary64
def solve_spherical_radial_compactified_diagnostic(
    *,
    grid: CompactifiedDifferentiationData,
    initial_state: RadialCollocationState,
    origin_amplitude: float = ORIGIN_AMPLITUDE,
) -> DeterministicNewtonResult:
    """Run the finite map once as a non-authoritative diagnostic calculation."""

    count = len(grid.rho) if type(grid) is CompactifiedDifferentiationData else -1
    if type(initial_state) is not RadialCollocationState or count < 1:
        raise ValueError("exact grid and initial state types are required")
    frozen_origin_amplitude = _validated_origin_amplitude(origin_amplitude)
    fields: list[tuple[float, ...]] = []
    for field_name, field in (
        ("F0", initial_state.F0),
        ("F1", initial_state.F1),
        ("varphi", initial_state.varphi),
    ):
        if type(field) is not tuple or len(field) != count:
            raise ValueError(
                f"initial_state.{field_name} must be an exact tuple of grid length"
            )
        fields.append(
            tuple(
                _canonical(float(value), f"initial_state.{field_name}[{index}]")
                if type(value) in (int, float)
                else (_ for _ in ()).throw(
                    ValueError(
                        f"initial_state.{field_name}[{index}] is not an exact real scalar"
                    )
                )
                for index, value in enumerate(field)
            )
        )
    if type(initial_state.w) not in (int, float):
        raise ValueError("initial_state.w must be an exact real scalar")
    w = _canonical(float(initial_state.w), "initial_state.w")
    if not 0.0 < w < 1.0:
        raise ValueError("initial_state.w must satisfy 0<w<1")
    initial = (*fields[0], *fields[1], *fields[2], w)

    def domain(values: tuple[float, ...]) -> bool:
        return len(values) == 3 * count + 1 and all(
            math.isfinite(value) for value in values
        ) and 0.0 < values[-1] < 1.0

    def evaluator(
        values: tuple[float, ...]
    ) -> tuple[tuple[float, ...], tuple[tuple[float, ...], ...]]:
        state = RadialCollocationState(
            F0=values[0:count],
            F1=values[count : 2 * count],
            varphi=values[2 * count : 3 * count],
            w=values[-1],
        )
        assembly = evaluate_spherical_radial_compactified_system(
            grid=grid,
            state=state,
            origin_amplitude=frozen_origin_amplitude,
        )
        return assembly.solved_residual, assembly.jacobian

    core = _solve_newton_map(initial=tuple(initial), evaluator=evaluator, domain=domain)
    state = RadialCollocationState(
        F0=core.values[0:count],
        F1=core.values[count : 2 * count],
        varphi=core.values[2 * count : 3 * count],
        w=core.values[-1],
    )
    final_assembly = evaluate_spherical_radial_compactified_system(
        grid=grid,
        state=state,
        origin_amplitude=frozen_origin_amplitude,
    )
    return DeterministicNewtonResult(
        state=state,
        origin_amplitude=frozen_origin_amplitude,
        converged=core.converged,
        failure_code=core.failure_code,
        accepted_update_count=core.accepted_update_count,
        residual_linf=core.residual_linf,
        scaled_step_linf=core.scaled_step_linf,
        consecutive_pass_count=core.consecutive_pass_count,
        accepted_alpha_exponents=core.accepted_alpha_exponents,
        unused_constraint_linf=_linf(final_assembly.unused_constraint),
    )


__all__ = [
    "ARMIJO_C",
    "CONSECUTIVE_PASS_COUNT",
    "DETERMINISTIC_NEWTON_VERSION",
    "DeterministicNewtonResult",
    "MAXIMUM_BACKTRACK_EXPONENT",
    "MAXIMUM_NEWTON_UPDATES",
    "RESIDUAL_LINF_THRESHOLD",
    "SCALED_STEP_LINF_THRESHOLD",
    "solve_spherical_radial_compactified_diagnostic",
]
