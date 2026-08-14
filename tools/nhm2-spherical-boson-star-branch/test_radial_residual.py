from __future__ import annotations

from dataclasses import FrozenInstanceError
import math
from pathlib import Path
import random
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
PROLATE = HERE.parent / "nhm2-boson-star-branch"
for source_root in (HERE, PROLATE):
    if str(source_root) not in sys.path:
        sys.path.insert(0, str(source_root))

from covariant_residual import FieldJet  # noqa: E402
from radial_residual import (  # noqa: E402
    RadialJet,
    SOLVED_RESIDUAL_ORDER,
    UNUSED_CONSTRAINT_ORDER,
    evaluate_spherical_radial_residual,
)
from regular_residual import evaluate_interior_regular_residual  # noqa: E402


def _field(jet: RadialJet) -> FieldJet:
    return FieldJet(
        value=jet.value,
        dx=jet.dx,
        dtheta=0.0,
        dxx=jet.dxx,
        dxtheta=0.0,
        dthetatheta=0.0,
    )


class SphericalRadialResidualTests(unittest.TestCase):
    def test_exact_orders_and_flat_positive_zero_fixture(self) -> None:
        self.assertEqual(
            SOLVED_RESIDUAL_ORDER,
            ("einstein_Et_t", "einstein_Etheta_theta", "klein_gordon"),
        )
        self.assertEqual(UNUSED_CONSTRAINT_ORDER, ("einstein_Ex_x",))
        zero = RadialJet(0.0, 0.0, 0.0)
        result = evaluate_spherical_radial_residual(
            x=0.25,
            F0=zero,
            F1=zero,
            varphi=zero,
            w=0.5,
        )
        numeric = (
            *result.solved,
            *result.unused_constraints,
            *result.normalized_solved,
            *result.normalized_unused_constraints,
            *result.einstein_mixed_diagonal,
            *result.stress_mixed_diagonal,
            result.box_w_varphi,
        )
        self.assertTrue(all(struct.pack("<d", value) == bytes(8) for value in numeric))
        self.assertTrue(result.calculation_implemented)
        for field in (
            "branch_solver_implemented",
            "branch_solved",
            "candidate_admissible",
            "metric_demand_non_degeneracy_established",
            "execution_authority",
            "diagnostic_pass_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
            "target_or_residual_array_input_read",
            "declared_lever_tensor_read",
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaises(FrozenInstanceError):
            result.branch_solved = True  # type: ignore[misc]

    def test_constant_rescaled_flat_metric_is_exact_zero(self) -> None:
        result = evaluate_spherical_radial_residual(
            x=0.8,
            F0=RadialJet(0.1, 0.0, 0.0),
            F1=RadialJet(-0.2, 0.0, 0.0),
            varphi=RadialJet(0.0, 0.0, 0.0),
            w=0.75,
        )
        self.assertEqual(result.solved, (0.0, 0.0, 0.0))
        self.assertEqual(result.unused_constraints, (0.0,))

    def test_matches_the_independent_two_dimensional_regular_kernel(self) -> None:
        generator = random.Random(0x51A1)
        worst_scaled = 0.0
        for _ in range(250):
            x = generator.uniform(0.08, 3.0)
            f0 = RadialJet(
                generator.uniform(-0.3, 0.3),
                generator.uniform(-0.4, 0.4),
                generator.uniform(-0.5, 0.5),
            )
            f1 = RadialJet(
                generator.uniform(-0.3, 0.3),
                generator.uniform(-0.4, 0.4),
                generator.uniform(-0.5, 0.5),
            )
            scalar = RadialJet(
                generator.uniform(-0.2, 0.2),
                generator.uniform(-0.3, 0.3),
                generator.uniform(-0.4, 0.4),
            )
            w = generator.uniform(0.1, 0.9)
            radial = evaluate_spherical_radial_residual(
                x=x,
                F0=f0,
                F1=f1,
                varphi=scalar,
                w=w,
            )
            reference = evaluate_interior_regular_residual(
                x=x,
                theta=0.731,
                F0=_field(f0),
                F1=_field(f1),
                F2=_field(f1),
                varphi=_field(scalar),
                w=w,
            )
            reference_radial = (
                reference.unused_constraints[1] + reference.solved[2]
            )
            expected = (
                reference.solved[0],
                reference.solved[2],
                reference.solved[3],
                reference_radial,
            )
            observed = (*radial.solved, *radial.unused_constraints)
            for left, right in zip(observed, expected, strict=True):
                scaled = abs(left - right) / max(1.0, abs(left), abs(right))
                worst_scaled = max(worst_scaled, scaled)
        self.assertLessEqual(worst_scaled, 8.0e-15)

    def test_equation_fixture_is_not_an_all_zero_stub(self) -> None:
        result = evaluate_spherical_radial_residual(
            x=0.7,
            F0=RadialJet(0.1, -0.05, 0.02),
            F1=RadialJet(-0.07, 0.03, -0.04),
            varphi=RadialJet(0.08, -0.06, 0.05),
            w=0.63,
        )
        self.assertTrue(any(value != 0.0 for value in result.solved))
        self.assertNotEqual(result.unused_constraints, (0.0,))
        self.assertTrue(all(math.isfinite(value) for value in result.solved))

    def test_hostile_and_nonrepresentable_inputs_fail_closed(self) -> None:
        zero = RadialJet(0.0, 0.0, 0.0)
        cases = (
            dict(x=0.0, F0=zero, F1=zero, varphi=zero, w=0.5),
            dict(x=1.0e-200, F0=zero, F1=zero, varphi=zero, w=0.5),
            dict(x=1.0, F0=zero, F1=zero, varphi=zero, w=0.0),
            dict(x=1.0, F0=zero, F1=zero, varphi=zero, w=1.0),
            dict(
                x=1.0,
                F0=RadialJet(math.inf, 0.0, 0.0),
                F1=zero,
                varphi=zero,
                w=0.5,
            ),
            dict(
                x=1.0,
                F0=zero,
                F1=RadialJet(400.0, 0.0, 0.0),
                varphi=zero,
                w=0.5,
            ),
        )
        for case in cases:
            with self.subTest(case=case), self.assertRaises(ValueError):
                evaluate_spherical_radial_residual(**case)
        with self.assertRaisesRegex(ValueError, "exact RadialJet"):
            evaluate_spherical_radial_residual(
                x=1.0,
                F0=object(),  # type: ignore[arg-type]
                F1=zero,
                varphi=zero,
                w=0.5,
            )


if __name__ == "__main__":
    unittest.main()
