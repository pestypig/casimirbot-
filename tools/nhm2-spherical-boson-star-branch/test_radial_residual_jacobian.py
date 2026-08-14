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

from radial_residual import RadialJet, evaluate_spherical_radial_residual  # noqa: E402
from radial_residual_jacobian import (  # noqa: E402
    LOCAL_RESIDUAL_ORDER,
    LOCAL_VARIABLE_ORDER,
    evaluate_spherical_radial_residual_jacobian,
)


def _residual_vector(values: list[float]) -> tuple[float, float, float, float]:
    result = evaluate_spherical_radial_residual(
        x=values[0],
        F0=RadialJet(values[1], values[2], values[3]),
        F1=RadialJet(values[4], values[5], values[6]),
        varphi=RadialJet(values[7], values[8], values[9]),
        w=values[10],
    )
    return (*result.solved, *result.unused_constraints)


class SphericalRadialResidualJacobianTests(unittest.TestCase):
    def test_orders_and_flat_zero_bits_are_exact(self) -> None:
        self.assertEqual(
            LOCAL_VARIABLE_ORDER,
            (
                "F0",
                "F0_prime",
                "F0_double_prime",
                "F1",
                "F1_prime",
                "F1_double_prime",
                "varphi",
                "varphi_prime",
                "varphi_double_prime",
                "w",
            ),
        )
        self.assertEqual(
            LOCAL_RESIDUAL_ORDER,
            (
                "einstein_Et_t",
                "einstein_Etheta_theta",
                "klein_gordon",
                "einstein_Ex_x",
            ),
        )
        zero = RadialJet(0.0, 0.0, 0.0)
        result = evaluate_spherical_radial_residual_jacobian(
            x=1.0,
            F0=zero,
            F1=zero,
            varphi=zero,
            w=0.5,
        )
        expected = (
            (0.0, 0.0, 0.0, 0.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0),
            (0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0),
            (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.75, 2.0, 1.0, 0.0),
            (0.0, 2.0, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0),
        )
        self.assertEqual(result.rows, expected)
        # Every exact zero must be canonical +0.
        for row_index, row in enumerate(result.rows):
            for column_index, value in enumerate(row):
                if expected[row_index][column_index] != 0.0:
                    continue
                self.assertEqual(struct.pack("<d", value), bytes(8))
        self.assertTrue(result.calculation_implemented)
        for field in (
            "discrete_jacobian_implemented",
            "branch_solver_implemented",
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

    def test_matches_independent_central_differences_on_nonsingular_fixtures(self) -> None:
        generator = random.Random(0xA11A6)
        worst_scaled = 0.0
        for _ in range(40):
            values = [
                generator.uniform(0.2, 2.0),
                generator.uniform(-0.2, 0.2),
                generator.uniform(-0.3, 0.3),
                generator.uniform(-0.4, 0.4),
                generator.uniform(-0.2, 0.2),
                generator.uniform(-0.3, 0.3),
                generator.uniform(-0.4, 0.4),
                generator.uniform(0.02, 0.2),
                generator.uniform(-0.2, 0.2),
                generator.uniform(-0.3, 0.3),
                generator.uniform(0.2, 0.8),
            ]
            analytic = evaluate_spherical_radial_residual_jacobian(
                x=values[0],
                F0=RadialJet(values[1], values[2], values[3]),
                F1=RadialJet(values[4], values[5], values[6]),
                varphi=RadialJet(values[7], values[8], values[9]),
                w=values[10],
            ).rows
            # x is a coordinate, not a differentiated local variable.  The
            # analytic columns correspond to values[1:] in exact order.
            for column in range(10):
                source_index = column + 1
                step = math.sqrt(math.ulp(1.0)) * max(1.0, abs(values[source_index]))
                plus = values.copy()
                minus = values.copy()
                plus[source_index] += step
                minus[source_index] -= step
                plus_residual = _residual_vector(plus)
                minus_residual = _residual_vector(minus)
                for row in range(4):
                    numerical = (plus_residual[row] - minus_residual[row]) / (
                        2.0 * step
                    )
                    exact = analytic[row][column]
                    scaled = abs(numerical - exact) / max(
                        1.0, abs(numerical), abs(exact)
                    )
                    worst_scaled = max(worst_scaled, scaled)
        self.assertLessEqual(worst_scaled, 2.5e-8)

    def test_matches_hand_derived_fixture(self) -> None:
        result = evaluate_spherical_radial_residual_jacobian(
            x=2.0,
            F0=RadialJet(0.0, 0.0, 0.0),
            F1=RadialJet(0.0, 0.0, 0.0),
            varphi=RadialJet(0.25, -0.5, 0.75),
            w=0.5,
        )
        self.assertEqual(result.rows[0][0], -0.03125)
        self.assertEqual(result.rows[0][3], -0.5)
        self.assertEqual(result.rows[0][6], 0.625)
        self.assertEqual(result.rows[1][6], 0.375)
        self.assertEqual(result.rows[2][6], -0.75)
        self.assertEqual(result.rows[2][7], 1.0)
        self.assertEqual(result.rows[2][8], 1.0)
        self.assertEqual(result.rows[3][6], 0.375)
        self.assertEqual(result.rows[3][7], 1.0)

    def test_reuses_the_exact_fail_closed_input_boundary(self) -> None:
        zero = RadialJet(0.0, 0.0, 0.0)
        for args in (
            dict(x=0.0, F0=zero, F1=zero, varphi=zero, w=0.5),
            dict(x=1.0, F0=zero, F1=zero, varphi=zero, w=1.0),
            dict(
                x=1.0,
                F0=RadialJet(math.inf, 0.0, 0.0),
                F1=zero,
                varphi=zero,
                w=0.5,
            ),
        ):
            with self.subTest(args=args), self.assertRaises(ValueError):
                evaluate_spherical_radial_residual_jacobian(**args)


if __name__ == "__main__":
    unittest.main()
