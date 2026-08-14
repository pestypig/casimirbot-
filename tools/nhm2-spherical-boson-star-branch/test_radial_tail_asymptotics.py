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

from radial_tail_asymptotics import (  # noqa: E402
    derive_spherical_radial_leading_tail,
)


class SphericalRadialLeadingTailTests(unittest.TestCase):
    def test_vacuum_metric_coefficients_cancel_leading_einstein_rows(self) -> None:
        generator = random.Random(0x7A11)
        for _ in range(100):
            mass = generator.uniform(1.0e-6, 0.2)
            tail = derive_spherical_radial_leading_tail(
                w=generator.uniform(0.2, 0.999),
                adm_mass_coefficient=mass,
                scalar_principal_amplitude=generator.uniform(1.0e-8, 0.1),
            )
            a1, a2 = tail.F0_x_minus_1, tail.F0_x_minus_2
            b1, b2 = tail.F1_x_minus_1, tail.F1_x_minus_2
            # Coefficients obtained by expanding the exact frozen vacuum rows:
            # Etheta[x^-3]=a1+b1, Et[x^-4]=4*b2+b1^2,
            # Etheta[x^-4]=a1^2+4*(a2+b2).
            self.assertEqual(a1 + b1, 0.0)
            self.assertEqual(4.0 * b2 + b1 * b1, 0.0)
            self.assertEqual(a1 * a1 + 4.0 * (a2 + b2), 0.0)

    def test_scalar_sigma_cancels_constant_and_inverse_x_kg_terms(self) -> None:
        generator = random.Random(0x5CA1A2)
        for _ in range(100):
            w = generator.uniform(0.2, 0.999)
            mass = generator.uniform(1.0e-6, 0.2)
            tail = derive_spherical_radial_leading_tail(
                w=w,
                adm_mass_coefficient=mass,
                scalar_principal_amplitude=0.01,
            )
            k = tail.kappa
            constant = k * k + w * w - 1.0
            inverse_x = (
                -2.0 * k * (tail.scalar_power_sigma + 1.0)
                - 2.0 * tail.F1_x_minus_1 * k * k
                - 2.0 * tail.F0_x_minus_1 * w * w
            )
            self.assertLessEqual(abs(constant), 3.0e-16)
            self.assertLessEqual(abs(inverse_x), 3.0e-16)

    def test_authority_and_missing_remainder_are_explicit(self) -> None:
        tail = derive_spherical_radial_leading_tail(
            w=0.9, adm_mass_coefficient=0.01, scalar_principal_amplitude=0.001
        )
        for field in (
            "finite_tail_representative_implemented",
            "all_order_recurrence_implemented",
            "outward_remainder_bound_implemented",
            "tail_replay_authority",
            "branch_solver_implemented",
            "candidate_executed",
            "branch_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
            "target_or_residual_array_input_read",
            "declared_lever_tensor_read",
        ):
            self.assertIs(getattr(tail, field), False)
        with self.assertRaises(FrozenInstanceError):
            tail.branch_authority = True  # type: ignore[misc]

    def test_invalid_and_nonrepresentable_inputs_fail_closed(self) -> None:
        valid = dict(w=0.9, adm_mass_coefficient=0.01, scalar_principal_amplitude=0.001)
        for replacement in (
            {"w": 0.0},
            {"w": 1.0},
            {"w": math.nan},
            {"adm_mass_coefficient": 0.0},
            {"adm_mass_coefficient": math.inf},
            {"scalar_principal_amplitude": 0.0},
        ):
            args = {**valid, **replacement}
            with self.subTest(args=args), self.assertRaises(ValueError):
                derive_spherical_radial_leading_tail(**args)


if __name__ == "__main__":
    unittest.main()
