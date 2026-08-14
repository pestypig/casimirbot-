from __future__ import annotations

from dataclasses import FrozenInstanceError
import math
from pathlib import Path
import random
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from deterministic_dense_lu import (  # noqa: E402
    MAXIMUM_SYSTEM_ORDER,
    REFINEMENT_PASSES,
    solve_deterministic_dense_lu,
)


class DeterministicDenseLuTests(unittest.TestCase):
    def test_known_system_and_exact_refinement_count(self) -> None:
        result = solve_deterministic_dense_lu(
            matrix=((3.0, 2.0, -1.0), (2.0, -2.0, 4.0), (-1.0, 0.5, -1.0)),
            rhs=(1.0, -2.0, 0.0),
        )
        expected = (1.0, -2.0, -2.0)
        for observed, wanted in zip(result.solution, expected, strict=True):
            self.assertAlmostEqual(observed, wanted, places=14)
        self.assertEqual(result.refinement_passes, REFINEMENT_PASSES)
        self.assertLessEqual(result.final_residual_linf, 2.0e-15)

    def test_absolute_tie_keeps_lowest_row(self) -> None:
        result = solve_deterministic_dense_lu(
            matrix=((1.0, 1.0), (-1.0, 2.0)), rhs=(2.0, 1.0)
        )
        self.assertEqual(result.pivot_row_at_step[0], 0)
        self.assertAlmostEqual(result.solution[0], 1.0, places=15)
        self.assertAlmostEqual(result.solution[1], 1.0, places=15)

    def test_random_diagonally_dominant_systems_replay_to_small_residual(self) -> None:
        generator = random.Random(0xD3E53)
        for order in (2, 3, 5, 8):
            for _ in range(8):
                matrix_rows: list[tuple[float, ...]] = []
                for row in range(order):
                    values = [generator.uniform(-0.25, 0.25) for _ in range(order)]
                    values[row] = math.fsum(abs(value) for value in values) + 1.0
                    matrix_rows.append(tuple(values))
                rhs = tuple(generator.uniform(-1.0, 1.0) for _ in range(order))
                result = solve_deterministic_dense_lu(
                    matrix=tuple(matrix_rows), rhs=rhs
                )
                self.assertLessEqual(result.final_residual_linf, 8.0e-16)

    def test_singular_hostile_shapes_and_authority_fail_closed(self) -> None:
        for matrix, rhs in (
            (((1.0, 2.0), (2.0, 4.0)), (1.0, 2.0)),
            (((1.0, -0.0), (0.0, 1.0)), (1.0, 2.0)),
            (((1.0, math.inf), (0.0, 1.0)), (1.0, 2.0)),
            (((1.0, 2.0),), (1.0,)),
            (((1.0,),), (1.0, 2.0)),
        ):
            with self.subTest(matrix=matrix, rhs=rhs), self.assertRaises(ValueError):
                solve_deterministic_dense_lu(matrix=matrix, rhs=rhs)
        oversized = tuple(
            tuple(1.0 if row == column else 0.0 for column in range(MAXIMUM_SYSTEM_ORDER + 1))
            for row in range(MAXIMUM_SYSTEM_ORDER + 1)
        )
        with self.assertRaises(ValueError):
            solve_deterministic_dense_lu(
                matrix=oversized, rhs=(0.0,) * (MAXIMUM_SYSTEM_ORDER + 1)
            )
        result = solve_deterministic_dense_lu(matrix=((1.0,),), rhs=(1.0,))
        for field in (
            "blas_used",
            "fma_requested",
            "equilibration_used",
            "alternate_pivot_retry_allowed",
            "candidate_executed",
            "solver_policy_authority",
            "replay_authority",
            "diagnostic_pass_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
            "declared_lever_tensor_read",
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]


if __name__ == "__main__":
    unittest.main()
