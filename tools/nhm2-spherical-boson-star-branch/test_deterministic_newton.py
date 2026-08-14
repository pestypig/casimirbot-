from __future__ import annotations

import math
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from deterministic_newton import (  # noqa: E402
    CONSECUTIVE_PASS_COUNT,
    MAXIMUM_NEWTON_UPDATES,
    _solve_newton_map,
    solve_spherical_radial_compactified_diagnostic,
)
from radial_collocation_interior import RadialCollocationState  # noqa: E402
from radial_compactified_system import (  # noqa: E402
    CompactifiedDifferentiationData,
)


class DeterministicNewtonTests(unittest.TestCase):
    def test_linear_map_converges_only_after_two_consecutive_full_gates(self) -> None:
        def evaluate(values: tuple[float, ...]):
            return (values[0] - 3.0,), ((1.0,),)

        result = _solve_newton_map(
            initial=(0.0,), evaluator=evaluate, domain=lambda values: len(values) == 1
        )
        self.assertTrue(result.converged)
        self.assertIsNone(result.failure_code)
        self.assertEqual(result.values, (3.0,))
        self.assertEqual(result.consecutive_pass_count, CONSECUTIVE_PASS_COUNT)
        self.assertEqual(result.accepted_alpha_exponents, (0, 0, 0))

    def test_nonlinear_map_uses_exact_jacobian_and_reaches_sqrt_two(self) -> None:
        def evaluate(values: tuple[float, ...]):
            return (values[0] * values[0] - 2.0,), ((2.0 * values[0],),)

        result = _solve_newton_map(
            initial=(1.0,),
            evaluator=evaluate,
            domain=lambda values: len(values) == 1 and values[0] > 0.0,
        )
        self.assertTrue(result.converged)
        self.assertAlmostEqual(result.values[0], math.sqrt(2.0), places=14)
        self.assertEqual(result.accepted_alpha_exponents, (0, 0, 0, 0, 0, 1, 1))

    def test_domain_rejection_exhausts_frozen_schedule_without_retry(self) -> None:
        def evaluate(values: tuple[float, ...]):
            return (values[0] + 1.0,), ((1.0,),)

        result = _solve_newton_map(
            initial=(1.0,),
            evaluator=evaluate,
            domain=lambda values: len(values) == 1 and values[0] == 1.0,
        )
        self.assertFalse(result.converged)
        self.assertEqual(result.failure_code, "armijo_schedule_exhausted_without_retry")
        self.assertEqual(result.accepted_update_count, 0)

    def test_singular_map_fails_once_and_malformed_inputs_raise(self) -> None:
        def singular(values: tuple[float, ...]):
            return (1.0,), ((0.0,),)

        result = _solve_newton_map(
            initial=(0.0,), evaluator=singular, domain=lambda values: True
        )
        self.assertFalse(result.converged)
        self.assertEqual(result.failure_code, "linear_solve_failed_without_retry")
        self.assertLess(result.accepted_update_count, MAXIMUM_NEWTON_UPDATES)
        with self.assertRaises(ValueError):
            _solve_newton_map(
                initial=(), evaluator=singular, domain=lambda values: True
            )
        with self.assertRaises(ValueError):
            _solve_newton_map(
                initial=(0.0,), evaluator=singular, domain=lambda values: False
            )

    def test_spherical_wrapper_rejects_mispartitioned_or_non_tuple_fields(self) -> None:
        grid = CompactifiedDifferentiationData(
            rho=(0.0, 0.5, 1.0),
            first_rho=((0.0, 0.0, 0.0),) * 3,
            second_rho=((0.0, 0.0, 0.0),) * 3,
        )
        malformed = (
            RadialCollocationState(
                F0=(0.0, 0.0),
                F1=(0.0, 0.0, 0.0, 0.0),
                varphi=(2.0**-10, 0.0, 0.0),
                w=0.9,
            ),
            RadialCollocationState(
                F0=[0.0, 0.0, 0.0],  # type: ignore[arg-type]
                F1=(0.0, 0.0, 0.0),
                varphi=(2.0**-10, 0.0, 0.0),
                w=0.9,
            ),
        )
        for state in malformed:
            with self.subTest(state=state), self.assertRaises(ValueError):
                solve_spherical_radial_compactified_diagnostic(
                    grid=grid,
                    initial_state=state,
                )

    def test_spherical_wrapper_threads_exact_origin_amplitude_and_constraint_maximum(
        self,
    ) -> None:
        grid = CompactifiedDifferentiationData(
            rho=(0.0, 0.5, 1.0),
            first_rho=((0.0, 0.0, 0.0),) * 3,
            second_rho=((0.0, 0.0, 0.0),) * 3,
        )
        initial = RadialCollocationState(
            F0=(0.0, 0.0, 0.0),
            F1=(0.0, 0.0, 0.0),
            varphi=(2.0**-16, 2.0**-17, 0.0),
            w=0.9,
        )
        amplitudes: list[float] = []

        def assemble(*, grid, state, origin_amplitude):
            del grid, state
            amplitudes.append(origin_amplitude)
            order = 10
            return SimpleNamespace(
                solved_residual=(0.0,) * order,
                jacobian=tuple(
                    tuple(1.0 if row == column else 0.0 for column in range(order))
                    for row in range(order)
                ),
                unused_constraint=(-0.25, 0.125),
            )

        with patch(
            "deterministic_newton.evaluate_spherical_radial_compactified_system",
            side_effect=assemble,
        ):
            result = solve_spherical_radial_compactified_diagnostic(
                grid=grid,
                initial_state=initial,
                origin_amplitude=2.0**-16,
            )

        self.assertTrue(result.converged)
        self.assertEqual(result.origin_amplitude, 2.0**-16)
        self.assertEqual(result.unused_constraint_linf, 0.25)
        self.assertGreaterEqual(len(amplitudes), 2)
        self.assertEqual(amplitudes, [2.0**-16] * len(amplitudes))

        for hostile in (
            True,
            "amplitude",
            10**10000,
            float("nan"),
            float("inf"),
            -0.0,
        ):
            with self.subTest(hostile=hostile), self.assertRaises(ValueError):
                solve_spherical_radial_compactified_diagnostic(
                    grid=grid,
                    initial_state=initial,
                    origin_amplitude=hostile,  # type: ignore[arg-type]
                )


if __name__ == "__main__":
    unittest.main()
