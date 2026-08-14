from __future__ import annotations

import math
from pathlib import Path
import sys
import unittest

import numpy as np


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from covariant_residual import (  # noqa: E402
    COORDINATE_ORDER,
    FIELD_ORDER,
    SOLVED_RESIDUAL_ORDER,
    UNUSED_CONSTRAINT_ORDER,
    FieldJet,
    evaluate_interior_covariant_residual,
)


ZERO = FieldJet(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)


class CovariantResidualTests(unittest.TestCase):
    def test_frozen_orders_and_authority_boundary_are_exact(self) -> None:
        self.assertEqual(COORDINATE_ORDER, ("tau", "x", "theta", "phi"))
        self.assertEqual(FIELD_ORDER, ("F0", "F1", "F2", "varphi"))
        self.assertEqual(
            SOLVED_RESIDUAL_ORDER,
            (
                "einstein_Et_t",
                "einstein_Er_r_plus_Etheta_theta",
                "einstein_Ephi_phi",
                "klein_gordon",
            ),
        )
        self.assertEqual(
            UNUSED_CONSTRAINT_ORDER,
            (
                "einstein_Er_theta",
                "einstein_Er_r_minus_Etheta_theta",
            ),
        )
        result = evaluate_interior_covariant_residual(
            x=1.25,
            theta=0.7,
            F0=ZERO,
            F1=ZERO,
            F2=ZERO,
            varphi=ZERO,
            w=0.9,
        )
        self.assertEqual(result.authority, "diagnostic_interior_residual_only")
        self.assertFalse(result.branch_solved)
        self.assertFalse(result.candidate_admissible)
        self.assertFalse(result.physical_authority)
        self.assertFalse(result.propulsion_authority)
        self.assertFalse(result.transport_authority)

    def test_minkowski_vacuum_cancels_coordinate_connection_exactly(self) -> None:
        for x, theta in ((0.125, 0.2), (1.0, 0.7), (19.0, 1.3)):
            result = evaluate_interior_covariant_residual(
                x=x,
                theta=theta,
                F0=ZERO,
                F1=ZERO,
                F2=ZERO,
                varphi=ZERO,
                w=0.75,
            )
            # The x=1/8, theta=0.2 case carries coordinate connection terms
            # of order 1/x^2 and csc(theta)^2.  This scale-aware bound is 512
            # binary64 epsilons per maximum analytic coordinate scale; it is
            # about 1.5e-11 for that hostile point and ~1e-13 at unit scale.
            # It is only an analytic vacuum identity test, not a branch rail.
            coordinate_scale = max(
                1.0,
                1.0 / (x * x),
                1.0 / (math.sin(theta) ** 2),
            )
            cancellation_bound = (
                512.0 * np.finfo(np.float64).eps * coordinate_scale
            )
            np.testing.assert_allclose(
                result.solved,
                0.0,
                rtol=0.0,
                atol=cancellation_bound,
            )
            np.testing.assert_allclose(
                result.unused_constraints,
                0.0,
                rtol=0.0,
                atol=cancellation_bound,
            )
            np.testing.assert_allclose(
                result.einstein_covariant,
                0.0,
                rtol=0.0,
                atol=cancellation_bound,
            )

    def test_constant_lapse_and_spatial_rescaling_remain_flat(self) -> None:
        constant_f0 = FieldJet(0.17, 0.0, 0.0, 0.0, 0.0, 0.0)
        constant_f1 = FieldJet(-0.11, 0.0, 0.0, 0.0, 0.0, 0.0)
        result = evaluate_interior_covariant_residual(
            x=2.75,
            theta=0.81,
            F0=constant_f0,
            F1=constant_f1,
            F2=constant_f1,
            varphi=ZERO,
            w=0.82,
        )
        np.testing.assert_allclose(result.solved, 0.0, rtol=0.0, atol=2e-14)
        np.testing.assert_allclose(
            result.unused_constraints,
            0.0,
            rtol=0.0,
            atol=2e-14,
        )

    def test_linear_lapse_matches_independent_symbolic_curvature(self) -> None:
        # SymPy's direct coordinate definition for
        # ds^2=-exp(2*a*x)dt^2+dx^2+x^2*dOmega^2 gives
        # G^a_b=diag(0,2a/x,a(ax+1)/x,a(ax+1)/x).
        x = 1.3
        theta = 0.61
        a = 0.07
        result = evaluate_interior_covariant_residual(
            x=x,
            theta=theta,
            F0=FieldJet(a * x, a, 0.0, 0.0, 0.0, 0.0),
            F1=ZERO,
            F2=ZERO,
            varphi=ZERO,
            w=0.83,
        )
        radial = 2.0 * a / x
        angular = a * (a * x + 1.0) / x
        np.testing.assert_allclose(
            result.solved,
            (0.0, radial + angular, angular, 0.0),
            rtol=2e-13,
            atol=3e-15,
        )
        np.testing.assert_allclose(
            result.unused_constraints,
            (0.0, radial - angular),
            rtol=2e-13,
            atol=3e-15,
        )

    def test_constant_complex_scalar_has_frozen_stress_multiplicity(self) -> None:
        amplitude = 0.031
        w = 0.72
        result = evaluate_interior_covariant_residual(
            x=1.4,
            theta=0.74,
            F0=ZERO,
            F1=ZERO,
            F2=ZERO,
            varphi=FieldJet(amplitude, 0.0, 0.0, 0.0, 0.0, 0.0),
            w=w,
        )
        amplitude_squared = amplitude * amplitude
        expected_time = (1.0 + w * w) * amplitude_squared
        expected_spatial = (1.0 - w * w) * amplitude_squared
        np.testing.assert_allclose(
            result.solved,
            (
                expected_time,
                2.0 * expected_spatial,
                expected_spatial,
                (w * w - 1.0) * amplitude,
            ),
            rtol=2e-13,
            atol=3e-15,
        )
        np.testing.assert_allclose(
            result.unused_constraints,
            0.0,
            rtol=0.0,
            atol=3e-15,
        )

    def test_minkowski_l1_scalar_has_expected_kg_residual(self) -> None:
        x = 1.7
        theta = 0.63
        w = 0.6
        scalar = FieldJet(
            value=x * math.cos(theta),
            dx=math.cos(theta),
            dtheta=-x * math.sin(theta),
            dxx=0.0,
            dxtheta=-math.sin(theta),
            dthetatheta=-x * math.cos(theta),
        )
        result = evaluate_interior_covariant_residual(
            x=x,
            theta=theta,
            F0=ZERO,
            F1=ZERO,
            F2=ZERO,
            varphi=scalar,
            w=w,
        )
        expected_box = w * w * scalar.value
        expected_kg = (w * w - 1.0) * scalar.value
        self.assertAlmostEqual(result.box_w_varphi, expected_box, places=13)
        self.assertAlmostEqual(result.solved[3], expected_kg, places=13)
        self.assertGreater(abs(result.solved[0]), 0.0)
        self.assertGreater(abs(result.unused_constraints[0]), 0.0)
        self.assertTrue(all(value >= 0.0 for value in result.normalized_solved))
        self.assertTrue(
            all(value >= 0.0 for value in result.normalized_unused_constraints),
        )

    def test_covariant_tensors_are_symmetric(self) -> None:
        result = evaluate_interior_covariant_residual(
            x=0.91,
            theta=0.48,
            F0=FieldJet(0.02, 0.03, -0.01, 0.04, 0.005, -0.02),
            F1=FieldJet(-0.04, 0.02, 0.015, -0.03, -0.004, 0.01),
            F2=FieldJet(0.01, -0.025, 0.02, 0.015, 0.006, -0.018),
            varphi=FieldJet(0.03, 0.02, -0.015, 0.01, -0.003, 0.008),
            w=0.97,
        )
        np.testing.assert_allclose(
            result.einstein_covariant,
            np.asarray(result.einstein_covariant).T,
            rtol=0.0,
            atol=5e-14,
        )
        np.testing.assert_allclose(
            result.stress_covariant,
            np.asarray(result.stress_covariant).T,
            rtol=0.0,
            atol=0.0,
        )

    def test_rejects_boundaries_nonfinite_values_and_nonexact_jets(self) -> None:
        valid = dict(
            x=1.0,
            theta=0.5,
            F0=ZERO,
            F1=ZERO,
            F2=ZERO,
            varphi=ZERO,
            w=0.9,
        )
        for replacement in (
            {"x": 0.0},
            {"theta": 0.0},
            {"theta": math.pi / 2.0},
            {"w": 0.0},
            {"w": 1.0},
            {"x": math.inf},
            {"x": np.nextafter(0.0, 1.0)},
            {"x": np.finfo(np.float64).max},
            {"F0": (0.0,) * 6},
            {"F1": FieldJet(1000.0, 0.0, 0.0, 0.0, 0.0, 0.0)},
            {"varphi": FieldJet(math.nan, 0.0, 0.0, 0.0, 0.0, 0.0)},
            {
                "varphi": FieldJet(
                    np.finfo(np.float64).max,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                ),
            },
        ):
            with self.subTest(replacement=replacement):
                with self.assertRaises(ValueError):
                    evaluate_interior_covariant_residual(
                        **(valid | replacement),
                    )


if __name__ == "__main__":
    unittest.main()
