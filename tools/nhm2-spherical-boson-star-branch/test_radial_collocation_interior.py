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

from radial_collocation_interior import (  # noqa: E402
    MAXIMUM_NODE_COUNT,
    RadialCollocationState,
    RadialDifferentiationData,
    evaluate_spherical_radial_collocation_interior,
)


def _simple_grid() -> RadialDifferentiationData:
    # Three-point quadratic interpolation on x=(0,1,2).
    return RadialDifferentiationData(
        nodes=(0.0, 1.0, 2.0),
        first=(
            (-1.5, 2.0, -0.5),
            (-0.5, 0.0, 0.5),
            (0.5, -2.0, 1.5),
        ),
        second=(
            (1.0, -2.0, 1.0),
            (1.0, -2.0, 1.0),
            (1.0, -2.0, 1.0),
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


class SphericalRadialCollocationInteriorTests(unittest.TestCase):
    def test_zero_state_has_zero_rows_and_exact_shape(self) -> None:
        grid = _simple_grid()
        zero = (0.0, 0.0, 0.0)
        result = evaluate_spherical_radial_collocation_interior(
            grid=grid,
            state=RadialCollocationState(F0=zero, F1=zero, varphi=zero, w=0.5),
        )
        self.assertEqual(result.node_count, 3)
        self.assertEqual(result.unknown_count, 10)
        self.assertEqual(result.interior_node_indices, (1,))
        self.assertEqual(result.solved_residual, (0.0, 0.0, 0.0))
        self.assertEqual(result.unused_constraint, (0.0,))
        self.assertEqual(len(result.jacobian), 3)
        self.assertTrue(all(len(row) == 10 for row in result.jacobian))
        for value in (*result.solved_residual, *result.unused_constraint):
            self.assertEqual(struct.pack("<d", value), bytes(8))
        for field in (
            "grid_selected",
            "boundary_rows_implemented",
            "tail_implemented",
            "discrete_solver_implemented",
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

    def test_global_jacobian_matches_independent_finite_differences(self) -> None:
        grid = _simple_grid()
        generator = random.Random(0xC0110C)
        worst_scaled = 0.0
        for _ in range(20):
            initial = RadialCollocationState(
                F0=tuple(generator.uniform(-0.1, 0.1) for _ in range(3)),
                F1=tuple(generator.uniform(-0.1, 0.1) for _ in range(3)),
                varphi=tuple(generator.uniform(0.02, 0.15) for _ in range(3)),
                w=generator.uniform(0.2, 0.8),
            )
            baseline = evaluate_spherical_radial_collocation_interior(
                grid=grid, state=initial
            )
            values = _flatten(initial)
            for column in range(len(values)):
                step = math.sqrt(math.ulp(1.0)) * max(1.0, abs(values[column]))
                plus = values.copy()
                minus = values.copy()
                plus[column] += step
                minus[column] -= step
                plus_rows = evaluate_spherical_radial_collocation_interior(
                    grid=grid, state=_state(plus, 3)
                ).solved_residual
                minus_rows = evaluate_spherical_radial_collocation_interior(
                    grid=grid, state=_state(minus, 3)
                ).solved_residual
                for row in range(3):
                    numerical = (plus_rows[row] - minus_rows[row]) / (2.0 * step)
                    exact = baseline.jacobian[row][column]
                    scaled = abs(numerical - exact) / max(
                        1.0, abs(numerical), abs(exact)
                    )
                    worst_scaled = max(worst_scaled, scaled)
        self.assertLessEqual(worst_scaled, 3.0e-8)

    def test_polynomial_derivatives_feed_the_exact_pointwise_rows(self) -> None:
        grid = _simple_grid()
        # At x=1: F0=x^2 => (1,2,2); F1=2x => (2,2,0);
        # varphi=1+x+x^2 => (3,3,2).
        state = RadialCollocationState(
            F0=(0.0, 1.0, 4.0),
            F1=(0.0, 2.0, 4.0),
            varphi=(1.0, 3.0, 7.0),
            w=0.5,
        )
        result = evaluate_spherical_radial_collocation_interior(grid=grid, state=state)
        self.assertTrue(all(math.isfinite(value) for value in result.solved_residual))
        self.assertTrue(any(value != 0.0 for value in result.solved_residual))
        self.assertNotEqual(result.unused_constraint, (0.0,))

    def test_hostile_shapes_negative_zero_and_resource_overflow_fail_closed(self) -> None:
        grid = _simple_grid()
        state = RadialCollocationState(
            F0=(0.0, 0.0, 0.0),
            F1=(0.0, 0.0, 0.0),
            varphi=(0.0, 0.0, 0.0),
            w=0.5,
        )
        bad_grids = (
            RadialDifferentiationData(
                nodes=(-0.0, 1.0, 2.0), first=grid.first, second=grid.second
            ),
            RadialDifferentiationData(
                nodes=(0.0, 2.0, 1.0), first=grid.first, second=grid.second
            ),
            RadialDifferentiationData(
                nodes=(0.0, 1.0, 2.0), first=grid.first[:-1], second=grid.second
            ),
        )
        for bad in bad_grids:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                evaluate_spherical_radial_collocation_interior(grid=bad, state=state)
        with self.assertRaises(ValueError):
            evaluate_spherical_radial_collocation_interior(
                grid=grid,
                state=RadialCollocationState(
                    F0=(0.0, 0.0), F1=state.F1, varphi=state.varphi, w=0.5
                ),
            )
        oversized_nodes = tuple(float(index) for index in range(MAXIMUM_NODE_COUNT + 1))
        oversized_rows = tuple(
            tuple(0.0 for _ in oversized_nodes) for _ in oversized_nodes
        )
        with self.assertRaises(ValueError):
            evaluate_spherical_radial_collocation_interior(
                grid=RadialDifferentiationData(
                    nodes=oversized_nodes, first=oversized_rows, second=oversized_rows
                ),
                state=RadialCollocationState(
                    F0=oversized_nodes,
                    F1=oversized_nodes,
                    varphi=oversized_nodes,
                    w=0.5,
                ),
            )


if __name__ == "__main__":
    unittest.main()
