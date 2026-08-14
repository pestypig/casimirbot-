from __future__ import annotations

import inspect
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
from regular_residual import (  # noqa: E402
    ANALYTIC_FORM_VERSION,
    DERIVATION_ARTIFACT,
    evaluate_interior_regular_residual,
)


ZERO = FieldJet(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
LEVEL_SHAPES = ((16, 12), (32, 24), (64, 48))
SOLVED_PDE_MAXIMUM = 1.0e-9
UNUSED_CONSTRAINT_MAXIMUM = 1.0e-6


def strict_interior_points(shape: tuple[int, int]):
    radial_count, angular_count = shape
    for radial_index in range(1, radial_count - 1):
        rho = (
            1.0
            - math.cos(math.pi * radial_index / (radial_count - 1))
        ) / 2.0
        x = rho / (1.0 - rho)
        for angular_index in range(1, angular_count - 1):
            theta = (math.pi / 4.0) * (
                1.0
                - math.cos(
                    math.pi * angular_index / (angular_count - 1),
                )
            )
            yield x, theta


def evaluate(
    *,
    x: float = 1.1,
    theta: float = 0.63,
    F0: FieldJet = ZERO,
    F1: FieldJet = ZERO,
    F2: FieldJet = ZERO,
    varphi: FieldJet = ZERO,
    w: float = 0.79,
):
    return evaluate_interior_regular_residual(
        x=x,
        theta=theta,
        F0=F0,
        F1=F1,
        F2=F2,
        varphi=varphi,
        w=w,
    )


class RegularResidualTests(unittest.TestCase):
    def test_frozen_orders_signature_derivation_and_authority_locks(self) -> None:
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
        self.assertEqual(
            tuple(inspect.signature(evaluate_interior_regular_residual).parameters),
            ("x", "theta", "F0", "F1", "F2", "varphi", "w"),
        )
        self.assertNotIn("lever", inspect.getsource(evaluate_interior_regular_residual))
        self.assertNotIn("target", inspect.getsource(evaluate_interior_regular_residual))
        result = evaluate()
        self.assertEqual(
            result.analytic_form_version,
            "nhm2_prolate_boson_star_coordinate_regular_ekg_residual/v1",
        )
        self.assertEqual(ANALYTIC_FORM_VERSION, result.analytic_form_version)
        self.assertEqual(
            DERIVATION_ARTIFACT,
            "tools/nhm2-boson-star-branch/derive_regular_residual.py",
        )
        self.assertEqual(
            result.authority,
            "diagnostic_coordinate_regular_interior_residual_only",
        )
        self.assertFalse(result.solver_implemented)
        self.assertFalse(result.branch_solved)
        self.assertFalse(result.candidate_admissible)
        self.assertFalse(result.diagnostic_pass_authority)
        self.assertFalse(result.physical_authority)
        self.assertFalse(result.propulsion_authority)
        self.assertFalse(result.transport_authority)
        self.assertFalse(result.target_or_residual_array_input_read)
        self.assertFalse(result.declared_lever_tensor_read)

    def test_flat_vacuum_is_exact_zero_at_every_frozen_strict_interior_node(
        self,
    ) -> None:
        for shape in LEVEL_SHAPES:
            solved_linf = 0.0
            unused_linf = 0.0
            point_count = 0
            for x, theta in strict_interior_points(shape):
                point_count += 1
                result = evaluate(x=x, theta=theta, w=0.5)
                solved_linf = max(solved_linf, *result.normalized_solved)
                unused_linf = max(
                    unused_linf,
                    *result.normalized_unused_constraints,
                )
                self.assertEqual(result.solved, (0.0, 0.0, 0.0, 0.0))
                self.assertEqual(result.unused_constraints, (0.0, 0.0))
                self.assertFalse(any(math.copysign(1.0, value) < 0.0 for value in result.solved))
            self.assertEqual(
                point_count,
                (shape[0] - 2) * (shape[1] - 2),
            )
            self.assertEqual(solved_linf, 0.0)
            self.assertEqual(unused_linf, 0.0)
            self.assertLessEqual(solved_linf, SOLVED_PDE_MAXIMUM)
            self.assertLessEqual(unused_linf, UNUSED_CONSTRAINT_MAXIMUM)

    def test_constant_rescaled_flat_metric_is_exact_zero_on_fine_grid(self) -> None:
        lapse = FieldJet(0.17, 0.0, 0.0, 0.0, 0.0, 0.0)
        spatial = FieldJet(-0.11, 0.0, 0.0, 0.0, 0.0, 0.0)
        for x, theta in strict_interior_points(LEVEL_SHAPES[-1]):
            result = evaluate(
                x=x,
                theta=theta,
                F0=lapse,
                F1=spatial,
                F2=spatial,
            )
            self.assertEqual(result.solved, (0.0, 0.0, 0.0, 0.0))
            self.assertEqual(result.unused_constraints, (0.0, 0.0))
            self.assertEqual(result.einstein_mixed, ((0.0,) * 4,) * 4)

    def test_removes_observed_first_fine_node_coordinate_cancellation_floor(
        self,
    ) -> None:
        radial_count, angular_count = LEVEL_SHAPES[-1]
        rho = (1.0 - math.cos(math.pi / (radial_count - 1))) / 2.0
        x = rho / (1.0 - rho)
        theta = (math.pi / 4.0) * (
            1.0 - math.cos(math.pi / (angular_count - 1))
        )
        reference = evaluate_interior_covariant_residual(
            x=x,
            theta=theta,
            F0=ZERO,
            F1=ZERO,
            F2=ZERO,
            varphi=ZERO,
            w=0.5,
        )
        regular = evaluate(x=x, theta=theta, w=0.5)
        self.assertGreater(max(reference.normalized_solved), SOLVED_PDE_MAXIMUM)
        self.assertGreater(
            max(reference.normalized_unused_constraints),
            UNUSED_CONSTRAINT_MAXIMUM,
        )
        self.assertEqual(regular.normalized_solved, (0.0, 0.0, 0.0, 0.0))
        self.assertEqual(regular.normalized_unused_constraints, (0.0, 0.0))

    def test_matches_generic_covariant_reference_at_well_conditioned_points(
        self,
    ) -> None:
        cases = (
            (
                0.91,
                0.48,
                0.97,
                (
                    FieldJet(0.02, 0.03, -0.01, 0.04, 0.005, -0.02),
                    FieldJet(-0.04, 0.02, 0.015, -0.03, -0.004, 0.01),
                    FieldJet(0.01, -0.025, 0.02, 0.015, 0.006, -0.018),
                    FieldJet(0.03, 0.02, -0.015, 0.01, -0.003, 0.008),
                ),
            ),
            (
                1.73,
                0.77,
                0.61,
                (
                    FieldJet(-0.08, 0.11, 0.05, -0.07, 0.012, 0.09),
                    FieldJet(0.06, -0.04, -0.03, 0.02, -0.015, -0.05),
                    FieldJet(-0.02, 0.07, -0.08, -0.03, 0.01, 0.04),
                    FieldJet(0.04, -0.025, 0.021, 0.017, -0.009, -0.014),
                ),
            ),
            (
                3.2,
                1.13,
                0.83,
                (
                    FieldJet(0.03, -0.02, 0.04, 0.01, -0.006, 0.02),
                    FieldJet(-0.01, 0.05, -0.02, -0.04, 0.004, 0.03),
                    FieldJet(0.04, -0.03, 0.01, 0.02, 0.008, -0.01),
                    FieldJet(0.02, 0.011, -0.017, -0.006, 0.003, 0.009),
                ),
            ),
        )
        for x, theta, w, jets in cases:
            with self.subTest(x=x, theta=theta):
                kwargs = dict(
                    x=x,
                    theta=theta,
                    F0=jets[0],
                    F1=jets[1],
                    F2=jets[2],
                    varphi=jets[3],
                    w=w,
                )
                reference = evaluate_interior_covariant_residual(**kwargs)
                regular = evaluate_interior_regular_residual(**kwargs)
                for left, right in (
                    (reference.solved, regular.solved),
                    (reference.unused_constraints, regular.unused_constraints),
                    (reference.normalized_solved, regular.normalized_solved),
                    (
                        reference.normalized_unused_constraints,
                        regular.normalized_unused_constraints,
                    ),
                    (reference.einstein_mixed, regular.einstein_mixed),
                    (reference.stress_mixed, regular.stress_mixed),
                    (reference.einstein_covariant, regular.einstein_covariant),
                    (reference.stress_covariant, regular.stress_covariant),
                ):
                    np.testing.assert_allclose(
                        left,
                        right,
                        rtol=5.0e-12,
                        atol=8.0e-14,
                    )
                self.assertAlmostEqual(
                    reference.box_w_varphi,
                    regular.box_w_varphi,
                    places=13,
                )

    def test_independent_linear_lapse_and_l1_kg_identities(self) -> None:
        x = 1.3
        theta = 0.61
        a = 0.07
        lapse_result = evaluate(
            x=x,
            theta=theta,
            F0=FieldJet(a * x, a, 0.0, 0.0, 0.0, 0.0),
            w=0.83,
        )
        radial = 2.0 * a / x
        angular = a * (a * x + 1.0) / x
        np.testing.assert_allclose(
            lapse_result.solved,
            (0.0, radial + angular, angular, 0.0),
            rtol=2.0e-14,
            atol=3.0e-15,
        )
        np.testing.assert_allclose(
            lapse_result.unused_constraints,
            (0.0, radial - angular),
            rtol=2.0e-14,
            atol=3.0e-15,
        )

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
        kg_result = evaluate(x=x, theta=theta, varphi=scalar, w=w)
        expected_box = w * w * scalar.value
        self.assertAlmostEqual(kg_result.box_w_varphi, expected_box, places=13)
        self.assertAlmostEqual(
            kg_result.solved[3],
            (w * w - 1.0) * scalar.value,
            places=13,
        )

    def test_rejects_boundaries_nonfinite_unrepresentable_and_hostile_inputs(
        self,
    ) -> None:
        valid = dict(
            x=1.0,
            theta=0.5,
            F0=ZERO,
            F1=ZERO,
            F2=ZERO,
            varphi=ZERO,
            w=0.9,
        )
        hostile = (
            {"x": 0.0},
            {"x": np.nextafter(0.0, 1.0)},
            {"x": np.finfo(np.float64).max},
            {"theta": 0.0},
            {"theta": math.pi / 2.0},
            {"theta": np.nextafter(0.0, 1.0)},
            {"w": 0.0},
            {"w": 1.0},
            {"x": math.inf},
            {"theta": math.nan},
            {"F0": (0.0,) * 6},
            {"F0": FieldJet(400.0, 0.0, 0.0, 0.0, 0.0, 0.0)},
            {"F1": FieldJet(-400.0, 0.0, 0.0, 0.0, 0.0, 0.0)},
            {"F2": FieldJet(400.0, 0.0, 0.0, 0.0, 0.0, 0.0)},
            {"varphi": FieldJet(math.nan, 0.0, 0.0, 0.0, 0.0, 0.0)},
            {
                "F0": FieldJet(
                    0.0,
                    np.finfo(np.float64).max,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                ),
                "F1": FieldJet(
                    0.0,
                    np.finfo(np.float64).max,
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                ),
            },
        )
        for replacement in hostile:
            with self.subTest(replacement=replacement):
                with self.assertRaises(ValueError):
                    evaluate_interior_regular_residual(**(valid | replacement))

    def test_rejects_full_inverse_metric_scales_outside_reference_domain(
        self,
    ) -> None:
        for x, theta in ((1.0e-154, 0.5), (1.0, 1.0e-154)):
            kwargs = dict(
                x=x,
                theta=theta,
                F0=ZERO,
                F1=ZERO,
                F2=ZERO,
                varphi=ZERO,
                w=0.5,
            )
            with self.subTest(x=x, theta=theta):
                with self.assertRaises(ValueError):
                    evaluate_interior_covariant_residual(**kwargs)
                with self.assertRaises(ValueError):
                    evaluate_interior_regular_residual(**kwargs)


if __name__ == "__main__":
    unittest.main()
