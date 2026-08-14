from __future__ import annotations

from dataclasses import FrozenInstanceError
import math
from pathlib import Path
import random
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from radial_collocation_interior import RadialCollocationState  # noqa: E402
from radial_compactified_system import (  # noqa: E402
    CompactifiedDifferentiationData,
    ORIGIN_AMPLITUDE,
    evaluate_spherical_radial_compactified_system,
)


def _three_point_grid() -> CompactifiedDifferentiationData:
    # Quadratic interpolation on rho=(0,1/2,1).
    return CompactifiedDifferentiationData(
        rho=(0.0, 0.5, 1.0),
        first_rho=(
            (-3.0, 4.0, -1.0),
            (-1.0, 0.0, 1.0),
            (1.0, -4.0, 3.0),
        ),
        second_rho=(
            (4.0, -8.0, 4.0),
            (4.0, -8.0, 4.0),
            (4.0, -8.0, 4.0),
        ),
    )


def _flatten(state: RadialCollocationState) -> list[float]:
    return [*state.F0, *state.F1, *state.varphi, state.w]


def _state(values: list[float], count: int) -> RadialCollocationState:
    return RadialCollocationState(
        F0=tuple(values[0:count]),
        F1=tuple(values[count : 2 * count]),
        varphi=tuple(values[2 * count : 3 * count]),
        w=values[-1],
    )


class SphericalRadialCompactifiedSystemTests(unittest.TestCase):
    def test_zero_fields_close_the_square_shape_and_only_miss_amplitude(self) -> None:
        zero = (0.0, 0.0, 0.0)
        result = evaluate_spherical_radial_compactified_system(
            grid=_three_point_grid(),
            state=RadialCollocationState(F0=zero, F1=zero, varphi=zero, w=0.5),
        )
        self.assertEqual(result.node_count, 3)
        self.assertEqual(result.unknown_count, 10)
        self.assertEqual(result.residual_count, 10)
        self.assertEqual(result.boundary_row_count, 7)
        self.assertEqual(result.interior_pde_row_count, 3)
        self.assertEqual(result.interior_node_indices, (1,))
        self.assertEqual(result.origin_amplitude, ORIGIN_AMPLITUDE)
        self.assertEqual(result.solved_residual[:-1], (0.0,) * 9)
        self.assertEqual(result.solved_residual[-1], -ORIGIN_AMPLITUDE)
        self.assertEqual(result.unused_constraint, (0.0,))
        self.assertEqual(len(result.jacobian), 10)
        self.assertTrue(all(len(row) == 10 for row in result.jacobian))
        self.assertEqual(len(result.unused_constraint_jacobian), 1)
        for value in (*result.solved_residual[:-1], *result.unused_constraint):
            self.assertEqual(struct.pack("<d", value), bytes(8))
        for field in (
            "grid_nodes_selected",
            "grid_generation_implemented",
            "nonlinear_solver_implemented",
            "continuation_implemented",
            "origin_remainder_proved",
            "tail_remainder_proved",
            "candidate_executed",
            "replay_authority",
            "diagnostic_pass_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
            "target_or_residual_array_input_read",
            "declared_lever_tensor_read",
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

    def test_origin_amplitude_is_an_exact_finite_parameter_with_frozen_default(
        self,
    ) -> None:
        zero = (0.0, 0.0, 0.0)
        state = RadialCollocationState(F0=zero, F1=zero, varphi=zero, w=0.5)
        default = evaluate_spherical_radial_compactified_system(
            grid=_three_point_grid(), state=state
        )
        explicit_default = evaluate_spherical_radial_compactified_system(
            grid=_three_point_grid(),
            state=state,
            origin_amplitude=2.0**-10,
        )
        self.assertEqual(default.solved_residual, explicit_default.solved_residual)
        self.assertEqual(default.jacobian, explicit_default.jacobian)

        for amplitude in (0.0, -(2.0**-12), 2.0**-16):
            with self.subTest(amplitude=amplitude):
                result = evaluate_spherical_radial_compactified_system(
                    grid=_three_point_grid(),
                    state=state,
                    origin_amplitude=amplitude,
                )
                self.assertEqual(result.origin_amplitude, amplitude)
                self.assertEqual(result.solved_residual[-1], -amplitude)
                self.assertEqual(result.jacobian[-1][6], 1.0)

        for hostile in (
            True,
            "0.001",
            10**10000,
            float("nan"),
            float("inf"),
            -0.0,
        ):
            with self.subTest(hostile=hostile), self.assertRaises(ValueError):
                evaluate_spherical_radial_compactified_system(
                    grid=_three_point_grid(),
                    state=state,
                    origin_amplitude=hostile,  # type: ignore[arg-type]
                )

    def test_global_square_jacobian_matches_independent_finite_differences(self) -> None:
        grid = _three_point_grid()
        generator = random.Random(0xC04A7)
        worst_scaled = 0.0
        for _ in range(16):
            initial = RadialCollocationState(
                F0=tuple(generator.uniform(-0.08, 0.08) for _ in range(3)),
                F1=tuple(generator.uniform(-0.08, 0.08) for _ in range(3)),
                varphi=tuple(generator.uniform(0.001, 0.08) for _ in range(3)),
                w=generator.uniform(0.25, 0.75),
            )
            baseline = evaluate_spherical_radial_compactified_system(
                grid=grid, state=initial
            )
            values = _flatten(initial)
            for column in range(len(values)):
                step = math.sqrt(math.ulp(1.0)) * max(1.0, abs(values[column]))
                plus = values.copy()
                minus = values.copy()
                plus[column] += step
                minus[column] -= step
                plus_rows = evaluate_spherical_radial_compactified_system(
                    grid=grid, state=_state(plus, 3)
                ).solved_residual
                minus_rows = evaluate_spherical_radial_compactified_system(
                    grid=grid, state=_state(minus, 3)
                ).solved_residual
                for row in range(len(plus_rows)):
                    numerical = (plus_rows[row] - minus_rows[row]) / (2.0 * step)
                    exact = baseline.jacobian[row][column]
                    scaled = abs(numerical - exact) / max(
                        1.0, abs(numerical), abs(exact)
                    )
                    worst_scaled = max(worst_scaled, scaled)
        self.assertLessEqual(worst_scaled, 4.0e-8)

    def test_compactification_chain_rule_is_used_at_the_interior(self) -> None:
        grid = _three_point_grid()
        # For q=rho: at rho=1/2, q_x=(1-rho)^2=1/4 and
        # q_xx=-2*(1-rho)^3=-1/4.
        state = RadialCollocationState(
            F0=grid.rho,
            F1=(0.0, 0.0, 0.0),
            varphi=(ORIGIN_AMPLITUDE, ORIGIN_AMPLITUDE / 2.0, 0.0),
            w=0.5,
        )
        result = evaluate_spherical_radial_compactified_system(grid=grid, state=state)
        self.assertTrue(all(math.isfinite(value) for value in result.solved_residual))
        self.assertTrue(any(value != 0.0 for value in result.solved_residual))
        self.assertTrue(any(value != 0.0 for value in result.unused_constraint))

    def test_endpoint_shape_negative_zero_and_state_mismatch_fail_closed(self) -> None:
        grid = _three_point_grid()
        state = RadialCollocationState(
            F0=(0.0, 0.0, 0.0),
            F1=(0.0, 0.0, 0.0),
            varphi=(ORIGIN_AMPLITUDE, 0.0, 0.0),
            w=0.5,
        )
        bad_grids = (
            CompactifiedDifferentiationData(
                rho=(-0.0, 0.5, 1.0),
                first_rho=grid.first_rho,
                second_rho=grid.second_rho,
            ),
            CompactifiedDifferentiationData(
                rho=(0.0, 0.5, 0.999),
                first_rho=grid.first_rho,
                second_rho=grid.second_rho,
            ),
            CompactifiedDifferentiationData(
                rho=(0.0, 0.75, 0.5),
                first_rho=grid.first_rho,
                second_rho=grid.second_rho,
            ),
            CompactifiedDifferentiationData(
                rho=grid.rho,
                first_rho=grid.first_rho[:-1],
                second_rho=grid.second_rho,
            ),
        )
        for bad in bad_grids:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                evaluate_spherical_radial_compactified_system(grid=bad, state=state)
        with self.assertRaises(ValueError):
            evaluate_spherical_radial_compactified_system(
                grid=grid,
                state=RadialCollocationState(
                    F0=(0.0, 0.0), F1=state.F1, varphi=state.varphi, w=0.5
                ),
            )


if __name__ == "__main__":
    unittest.main()
