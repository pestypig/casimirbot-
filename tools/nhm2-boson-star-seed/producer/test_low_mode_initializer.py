from __future__ import annotations

from pathlib import Path
import sys
import unittest
from unittest import mock

import numpy as np


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from contract import GRID_LEVELS  # noqa: E402
from low_mode_initializer import low_mode_l0_initializer  # noqa: E402
import solver  # noqa: E402


class LowModeInitializerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.level = GRID_LEVELS[0]
        cls.result = low_mode_l0_initializer(cls.level)

    def test_initializer_is_finite_deterministic_and_materially_better(self) -> None:
        result = self.result
        scalar = result.scalar_nodal
        potential = result.potential_nodal
        self.assertEqual(scalar.shape, (64, 32))
        self.assertEqual(potential.shape, (64, 32))
        self.assertTrue(scalar.flags.c_contiguous)
        self.assertTrue(potential.flags.c_contiguous)
        self.assertTrue(np.all(np.isfinite(scalar)))
        self.assertTrue(np.all(np.isfinite(potential)))
        for array in (scalar, potential):
            self.assertFalse(np.any(np.signbit(array[array == 0.0])))

        low_mode_residual = solver.raw_residual(
            solver._pack(scalar, potential),
            self.level,
        )
        low_mode_linf = float(np.max(np.abs(low_mode_residual)))
        analytic = solver._analytic_l0_guess(self.level)
        analytic_linf = float(
            np.max(np.abs(solver.raw_residual(solver._pack(*analytic), self.level)))
        )
        self.assertLess(low_mode_linf, 1.0e-2)
        self.assertLess(low_mode_linf, analytic_linf / 100.0)
        self.assertLessEqual(result.bvp_maximum_rms_residual, 1.01e-8)
        self.assertLessEqual(result.bvp_boundary_linf, 1.0e-12)
        self.assertLessEqual(result.bvp_node_count, 50_000)

        repeated = low_mode_l0_initializer(self.level)
        np.testing.assert_array_equal(repeated.scalar_nodal, scalar)
        np.testing.assert_array_equal(repeated.potential_nodal, potential)
        self.assertEqual(repeated.bvp_iteration_count, result.bvp_iteration_count)
        self.assertEqual(repeated.bvp_node_count, result.bvp_node_count)

    def test_lgmres_callable_binds_inner_dimension_and_one_outer_cycle(self) -> None:
        fake_result = (np.zeros(2, dtype=np.float64), 0)
        with mock.patch("scipy.sparse.linalg.lgmres", return_value=fake_result) as lgmres:
            method = solver._lgmres_method(inner_m=90, outer_k=8)
            operator = np.eye(2, dtype=np.float64)
            right_hand_side = np.ones(2, dtype=np.float64)
            self.assertIs(method(operator, right_hand_side, rtol=0.25, maxiter=777), fake_result)
        kwargs = lgmres.call_args.kwargs
        self.assertEqual(kwargs["inner_m"], 90)
        self.assertEqual(kwargs["outer_k"], 8)
        self.assertEqual(kwargs["maxiter"], 1)
        self.assertEqual(kwargs["rtol"], 0.25)
        self.assertEqual(kwargs["outer_v"], [])

    def test_lgmres_augmentation_state_is_scoped_to_one_newton_solve(self) -> None:
        first = solver._lgmres_method(inner_m=90, outer_k=8)
        second = solver._lgmres_method(inner_m=90, outer_k=8)
        self.assertIsNot(first.outer_vectors, second.outer_vectors)

        observed: list[list[tuple[np.ndarray, np.ndarray | None]]] = []

        def fake_lgmres(*args: object, **kwargs: object) -> tuple[np.ndarray, int]:
            del args
            outer_vectors = kwargs["outer_v"]
            assert isinstance(outer_vectors, list)
            observed.append(outer_vectors)
            outer_vectors.append((np.ones(2, dtype=np.float64), None))
            return np.zeros(2, dtype=np.float64), 0

        operator = np.eye(2, dtype=np.float64)
        right_hand_side = np.ones(2, dtype=np.float64)
        with mock.patch("scipy.sparse.linalg.lgmres", side_effect=fake_lgmres):
            first(operator, right_hand_side)
            first(operator, right_hand_side)
            second(operator, right_hand_side)
        self.assertIs(observed[0], observed[1])
        self.assertIsNot(observed[0], observed[2])
        self.assertEqual(len(first.outer_vectors), 2)
        self.assertEqual(len(second.outer_vectors), 1)

    def test_no_convergence_fails_before_postprojection(self) -> None:
        from scipy.optimize import NoConvergence

        initial = solver._pack(self.result.scalar_nodal, self.result.potential_nodal)
        with (
            mock.patch(
                "low_mode_initializer.low_mode_l0_initializer",
                return_value=self.result,
            ),
            mock.patch("scipy.optimize.newton_krylov", side_effect=NoConvergence(initial)),
            mock.patch.object(solver, "_postproject_fields") as postproject,
        ):
            with self.assertRaisesRegex(
                solver.SeedNewtonKrylovNoConvergence,
                "L0: Newton-Krylov did not converge after 70 iterations",
            ):
                solver.solve_level(self.level, None)
        postproject.assert_not_called()

    def test_converged_result_is_captured_before_projection_without_producer_veto(self) -> None:
        shape = (self.level.radial_count, self.level.angular_count)
        raw_scalar = np.full(shape, 2.0, dtype=np.float64)
        raw_potential = np.full(shape, -3.0, dtype=np.float64)
        packed = solver._pack(raw_scalar, raw_potential)
        projected_scalar = np.full(shape, 7.0, dtype=np.float64)
        projected_potential = np.full(shape, -11.0, dtype=np.float64)
        modes = np.zeros(
            (self.level.radial_count, self.level.angular_count // 2),
            dtype=np.float64,
        )

        with (
            mock.patch(
                "low_mode_initializer.low_mode_l0_initializer",
                return_value=self.result,
            ),
            mock.patch("scipy.optimize.newton_krylov", return_value=packed),
            mock.patch.object(
                solver,
                "_postproject_fields",
                return_value=(
                    projected_scalar,
                    projected_potential,
                    modes,
                    modes,
                ),
            ),
            mock.patch.object(
                solver,
                "_phase_and_sanity",
                return_value=(
                    projected_scalar,
                    projected_potential,
                    modes,
                    modes,
                ),
            ),
            mock.patch.object(
                solver,
                "raw_residual",
                side_effect=AssertionError("producer residual gate must not run"),
            ),
        ):
            solution = solver.solve_level(self.level, None)

        self.assertEqual(
            solution.raw_preprojection.scalar_f64le,
            raw_scalar.astype("<f8", copy=False).tobytes(order="C"),
        )
        self.assertEqual(
            solution.raw_preprojection.potential_f64le,
            raw_potential.astype("<f8", copy=False).tobytes(order="C"),
        )
        np.testing.assert_array_equal(solution.scalar_nodal, projected_scalar)
        np.testing.assert_array_equal(solution.potential_nodal, projected_potential)


if __name__ == "__main__":
    unittest.main()
