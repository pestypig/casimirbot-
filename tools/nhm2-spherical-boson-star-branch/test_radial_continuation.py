from __future__ import annotations

from dataclasses import FrozenInstanceError
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import radial_continuation as continuation  # noqa: E402
from deterministic_newton import DeterministicNewtonResult  # noqa: E402
from radial_collocation_interior import RadialCollocationState  # noqa: E402
from radial_compactified_system import (  # noqa: E402
    CompactifiedDifferentiationData,
    ORIGIN_AMPLITUDE,
)
from radial_continuation import (  # noqa: E402
    LATER_STAGE_PREDICTOR_SOURCE,
    LOWEST_STAGE_PREDICTOR_SOURCE,
    ORIGIN_AMPLITUDE_SCHEDULE,
    continue_spherical_radial_compactified_diagnostic,
)


def _grid() -> CompactifiedDifferentiationData:
    return CompactifiedDifferentiationData(
        rho=(0.0, 0.5, 1.0),
        first_rho=(
            (-3.0, 4.0, -1.0),
            (-1.0, 0.0, 1.0),
            (1.0, -4.0, 3.0),
        ),
        second_rho=((4.0, -8.0, 4.0),) * 3,
    )


def _state(
    amplitude: float,
    w: float,
    *,
    middle_scale: float = 0.5,
) -> RadialCollocationState:
    return RadialCollocationState(
        F0=(0.01, 0.005, 0.0),
        F1=(-0.01, -0.005, 0.0),
        varphi=(amplitude, middle_scale * amplitude, 0.0),
        w=w,
    )


def _newton_result(
    *,
    amplitude: float,
    state: RadialCollocationState,
    converged: bool = True,
    failure_code: str | None = None,
    unused_constraint_linf: float = 0.0,
) -> DeterministicNewtonResult:
    return DeterministicNewtonResult(
        state=state,
        origin_amplitude=amplitude,
        converged=converged,
        failure_code=failure_code,
        accepted_update_count=2 if converged else 1,
        residual_linf=2.0**-44,
        scaled_step_linf=2.0**-45,
        consecutive_pass_count=2 if converged else 0,
        accepted_alpha_exponents=(0, 1) if converged else (0,),
        unused_constraint_linf=unused_constraint_linf,
    )


class RadialContinuationTests(unittest.TestCase):
    def test_frozen_schedule_predictor_chain_and_diagnostic_chronology(self) -> None:
        self.assertIs(type(ORIGIN_AMPLITUDE_SCHEDULE), tuple)
        self.assertEqual(
            ORIGIN_AMPLITUDE_SCHEDULE,
            (
                2.0**-16,
                2.0**-15,
                2.0**-14,
                2.0**-13,
                2.0**-12,
                2.0**-11,
                2.0**-10,
            ),
        )
        self.assertEqual(ORIGIN_AMPLITUDE_SCHEDULE[-1], ORIGIN_AMPLITUDE)
        self.assertTrue(
            all(type(value) is float for value in ORIGIN_AMPLITUDE_SCHEDULE)
        )
        for previous, following in zip(
            ORIGIN_AMPLITUDE_SCHEDULE[:-1],
            ORIGIN_AMPLITUDE_SCHEDULE[1:],
            strict=True,
        ):
            self.assertEqual(following, 2.0 * previous)

        grid = _grid()
        caller = _state(2.0**-16, 0.99)
        stage_states = [
            _state(amplitude, 0.99 - index * 0.01)
            for index, amplitude in enumerate(ORIGIN_AMPLITUDE_SCHEDULE)
        ]
        # These are observations, not acceptance gates: record one rising
        # profile and one negative profile while the mocked Newton chronology
        # remains converged.
        stage_states[2] = _state(ORIGIN_AMPLITUDE_SCHEDULE[2], 0.98, middle_scale=1.5)
        stage_states[3] = _state(ORIGIN_AMPLITUDE_SCHEDULE[3], 0.985, middle_scale=-0.5)
        stage_results = tuple(
            _newton_result(
                amplitude=amplitude,
                state=stage_states[index],
                unused_constraint_linf=float(index) * 2.0**-30,
            )
            for index, amplitude in enumerate(ORIGIN_AMPLITUDE_SCHEDULE)
        )
        calls: list[tuple[object, object, float]] = []

        def solve(*, grid, initial_state, origin_amplitude):
            calls.append((grid, initial_state, origin_amplitude))
            return stage_results[len(calls) - 1]

        with patch.object(
            continuation,
            "solve_spherical_radial_compactified_diagnostic",
            side_effect=solve,
        ):
            result = continue_spherical_radial_compactified_diagnostic(
                grid=grid,
                lowest_stage_initial_state=caller,
            )

        self.assertTrue(result.completed)
        self.assertIsNone(result.failure_stage_index)
        self.assertIsNone(result.failure_code)
        self.assertEqual(result.attempted_stage_count, 7)
        self.assertEqual(result.accepted_stage_count, 7)
        self.assertEqual(tuple(call[2] for call in calls), ORIGIN_AMPLITUDE_SCHEDULE)
        self.assertTrue(all(call[0] is grid for call in calls))
        self.assertIs(calls[0][1], caller)
        for index in range(1, len(calls)):
            self.assertIs(calls[index][1], stage_results[index - 1].state)
        self.assertEqual(
            tuple(stage.predictor_source for stage in result.stages),
            (LOWEST_STAGE_PREDICTOR_SOURCE,)
            + (LATER_STAGE_PREDICTOR_SOURCE,) * 6,
        )
        self.assertEqual(
            result.w_progression,
            tuple(state.w for state in stage_states),
        )
        self.assertEqual(
            result.unused_constraint_linf_progression,
            tuple(float(index) * 2.0**-30 for index in range(7)),
        )
        self.assertFalse(result.varphi_nodes_nonincreasing_progression[2])
        self.assertFalse(result.varphi_nodes_nonnegative_progression[3])
        self.assertFalse(
            result.varphi_finite_nodes_strictly_positive_progression[3]
        )
        self.assertIs(result.final_accepted_state, stage_results[-1].state)
        for field in (
            "retry_allowed",
            "retune_allowed",
            "alternate_initializer_allowed",
            "alternate_grid_allowed",
            "interpolation_predictor_allowed",
            "extrapolation_predictor_allowed",
            "continuous_vacuum_connection_established",
            "interval_proof_performed",
            "tangent_proof_performed",
            "no_fold_established",
            "first_branch_established",
            "candidate_execution_authority",
            "replay_authority",
            "diagnostic_pass_authority",
            "physical_authority",
        ):
            self.assertIs(getattr(result, field), False)
        self.assertTrue(result.one_newton_attempt_per_stage)
        self.assertTrue(all(stage.newton_attempt_count == 1 for stage in result.stages))
        self.assertTrue(
            hasattr(continue_spherical_radial_compactified_diagnostic, "__wrapped__")
        )
        with self.assertRaises(FrozenInstanceError):
            result.completed = False  # type: ignore[misc]

    def test_first_newton_failure_stops_before_any_later_stage_or_retry(self) -> None:
        caller = _state(2.0**-16, 0.99)
        accepted = _newton_result(
            amplitude=ORIGIN_AMPLITUDE_SCHEDULE[0],
            state=_state(ORIGIN_AMPLITUDE_SCHEDULE[0], 0.98),
            unused_constraint_linf=2.0**-30,
        )
        failed = _newton_result(
            amplitude=ORIGIN_AMPLITUDE_SCHEDULE[1],
            state=_state(ORIGIN_AMPLITUDE_SCHEDULE[1], 0.97),
            converged=False,
            failure_code="armijo_schedule_exhausted_without_retry",
            unused_constraint_linf=2.0**-29,
        )
        calls: list[tuple[RadialCollocationState, float]] = []

        def solve(*, grid, initial_state, origin_amplitude):
            del grid
            calls.append((initial_state, origin_amplitude))
            if len(calls) == 1:
                return accepted
            if len(calls) == 2:
                return failed
            self.fail("continuation retried or advanced after the first failure")

        with patch.object(
            continuation,
            "solve_spherical_radial_compactified_diagnostic",
            side_effect=solve,
        ):
            result = continue_spherical_radial_compactified_diagnostic(
                grid=_grid(),
                lowest_stage_initial_state=caller,
            )

        self.assertFalse(result.completed)
        self.assertEqual(len(calls), 2)
        self.assertIs(calls[0][0], caller)
        self.assertIs(calls[1][0], accepted.state)
        self.assertEqual(result.attempted_stage_count, 2)
        self.assertEqual(result.accepted_stage_count, 1)
        self.assertEqual(result.failure_stage_index, 1)
        self.assertEqual(
            result.failure_code,
            "armijo_schedule_exhausted_without_retry",
        )
        self.assertEqual(
            tuple(stage.accepted for stage in result.stages),
            (True, False),
        )
        self.assertIs(result.final_accepted_state, accepted.state)

    def test_hostile_shape_and_schedule_fail_before_the_first_newton_attempt(
        self,
    ) -> None:
        solve_target = (
            "radial_continuation.solve_spherical_radial_compactified_diagnostic"
        )
        caller = _state(2.0**-16, 0.99)
        malformed_inputs = (
            (object(), caller),
            (_grid(), object()),
            (
                _grid(),
                RadialCollocationState(
                    F0=(0.0, 0.0),
                    F1=(0.0, 0.0, 0.0),
                    varphi=(2.0**-16, 0.0, 0.0),
                    w=0.9,
                ),
            ),
            (
                CompactifiedDifferentiationData(
                    rho=[0.0, 0.5, 1.0],  # type: ignore[arg-type]
                    first_rho=_grid().first_rho,
                    second_rho=_grid().second_rho,
                ),
                caller,
            ),
        )
        for grid, initial in malformed_inputs:
            with (
                self.subTest(grid=grid, initial=initial),
                patch(solve_target) as solve,
                self.assertRaises(ValueError),
            ):
                continue_spherical_radial_compactified_diagnostic(
                    grid=grid,  # type: ignore[arg-type]
                    lowest_stage_initial_state=initial,  # type: ignore[arg-type]
                )
            solve.assert_not_called()

        hostile_schedules = (
            list(ORIGIN_AMPLITUDE_SCHEDULE),
            ORIGIN_AMPLITUDE_SCHEDULE[:-1],
            ORIGIN_AMPLITUDE_SCHEDULE[:-1] + (2.0**-9,),
            tuple(reversed(ORIGIN_AMPLITUDE_SCHEDULE)),
        )
        for hostile in hostile_schedules:
            with (
                self.subTest(hostile=hostile),
                patch.object(continuation, "ORIGIN_AMPLITUDE_SCHEDULE", hostile),
                patch(solve_target) as solve,
                self.assertRaises(RuntimeError),
            ):
                continue_spherical_radial_compactified_diagnostic(
                    grid=_grid(),
                    lowest_stage_initial_state=caller,
                )
            solve.assert_not_called()

    def test_malformed_newton_receipt_fails_closed_without_retry(self) -> None:
        wrong_amplitude = _newton_result(
            amplitude=2.0**-15,
            state=_state(2.0**-16, 0.98),
        )
        with patch.object(
            continuation,
            "solve_spherical_radial_compactified_diagnostic",
            return_value=wrong_amplitude,
        ) as solve:
            with self.assertRaisesRegex(RuntimeError, "wrong origin amplitude"):
                continue_spherical_radial_compactified_diagnostic(
                    grid=_grid(),
                    lowest_stage_initial_state=_state(2.0**-16, 0.99),
                )
        solve.assert_called_once()


if __name__ == "__main__":
    unittest.main()
