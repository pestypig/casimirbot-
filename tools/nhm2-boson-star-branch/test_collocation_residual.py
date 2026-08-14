from __future__ import annotations

import math
from pathlib import Path
import sys
import unittest
from unittest import mock

import numpy as np


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import collocation_residual as collocation_module  # noqa: E402
from collocation_residual import (  # noqa: E402
    AMPLITUDE_STAGES,
    BOUNDARY_ROW_KIND_ORDER,
    LEVEL_SHAPES,
    PEAK_EQUATION_ORDER,
    TAU_ROW_FIELD_ORDER,
    _SPECTRAL,
    assemble_collocation_residual,
)


SHAPE = LEVEL_SHAPES[0]
A = AMPLITUDE_STAGES[-1]


def zeros() -> np.ndarray:
    return np.zeros(SHAPE, dtype=np.float64, order="C")


def assemble(
    fields: tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray] | None = None,
    *,
    w: float = 0.75,
    rho_peak: float = 0.5,
    target_amplitude: float = A,
):
    selected = fields if fields is not None else (zeros(), zeros(), zeros(), zeros())
    return assemble_collocation_residual(
        F0=selected[0],
        F1=selected[1],
        F2=selected[2],
        varphi=selected[3],
        w=w,
        rho_peak=rho_peak,
        target_amplitude=target_amplitude,
    )


class CollocationResidualTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        rho, _ = _SPECTRAL.mapped_nodes(SHAPE[0])
        theta, _ = _SPECTRAL.mapped_nodes(SHAPE[1], angular=True)
        cls.rho = np.asarray(rho)
        cls.theta = np.asarray(theta)

    def test_structured_sizes_orders_and_all_authority_locks(self) -> None:
        result = assemble()
        self.assertEqual(result.level_shape, SHAPE)
        self.assertEqual(result.solved_tau_rows.shape, (4, *SHAPE))
        self.assertEqual(result.solved_pde_raw.shape, (4, 14, 10))
        self.assertEqual(result.solved_pde_normalized.shape, (4, 14, 10))
        self.assertEqual(result.unused_constraints_raw.shape, (2, 14, 10))
        self.assertEqual(result.unused_constraints_normalized.shape, (2, 14, 10))
        self.assertEqual(TAU_ROW_FIELD_ORDER, ("F0", "F1", "F2", "varphi"))
        self.assertEqual(
            PEAK_EQUATION_ORDER,
            (
                "varphi_at_rho_peak_theta_zero_minus_amplitude",
                "partial_rho_varphi_at_rho_peak_theta_zero",
            ),
        )
        self.assertEqual(
            BOUNDARY_ROW_KIND_ORDER,
            (
                "origin_rho_zero",
                "infinity_rho_one",
                "north_axis_theta_zero",
                "equator_theta_pi_over_two",
            ),
        )
        self.assertFalse(result.flattened_newton_abi_present)
        self.assertFalse(result.newton_update_present)
        self.assertFalse(result.continuation_present)
        self.assertFalse(result.candidate_output_present)
        self.assertFalse(result.target_or_residual_array_input_read)
        self.assertFalse(result.declared_lever_tensor_read)
        self.assertFalse(result.diagnostic_pass_authority)
        self.assertFalse(result.branch_solved)
        self.assertFalse(result.candidate_admissible)
        self.assertFalse(result.physical_authority)
        self.assertFalse(result.propulsion_authority)
        self.assertFalse(result.transport_authority)
        self.assertFalse(result.report.oversampled_covariant_grid_evaluated)
        self.assertFalse(result.report.continuous_global_maximum_uniqueness_evaluated)
        self.assertFalse(result.report.full_domain_parity_evaluated)
        self.assertFalse(result.report.adjacent_resolution_convergence_evaluated)
        self.assertFalse(result.report.branch_identity_replayed)
        self.assertFalse(result.report.no_fold_replayed)
        self.assertFalse(result.report.all_preregistered_rails_evaluated)
        self.assertFalse(result.report.diagnostic_pass_authority)
        self.assertTrue(result.report.flat_space_control_evaluated)
        self.assertFalse(result.report.flat_space_floor_subtracted)
        self.assertEqual(result.report.boundary_condition_linf, 0.0)
        self.assertEqual(result.report.solved_normalized_pde_linf, 0.0)
        self.assertEqual(result.report.unused_constraint_normalized_linf, 0.0)
        self.assertEqual(
            result.report.flat_space_solved_normalized_pde_linf,
            result.report.solved_normalized_pde_linf,
        )
        self.assertEqual(
            result.report.flat_space_unused_constraint_normalized_linf,
            result.report.unused_constraint_normalized_linf,
        )
        self.assertTrue(result.report.flat_space_floor_below_frozen_pde_rails)

    def test_every_frozen_level_has_real_exact_flat_zero_and_bounded_shapes(
        self,
    ) -> None:
        # A prior test spies on the point evaluator while forwarding to the
        # real implementation.  Clear the diagnostic cache here so this
        # all-level proof has no mocked call boundary at all.
        collocation_module._flat_space_numerical_floor.cache_clear()
        for radial_count, angular_count in LEVEL_SHAPES:
            with self.subTest(shape=(radial_count, angular_count)):
                zero = np.zeros(
                    (radial_count, angular_count),
                    dtype=np.float64,
                    order="C",
                )
                result = assemble_collocation_residual(
                    F0=zero,
                    F1=zero,
                    F2=zero,
                    varphi=zero,
                    w=0.75,
                    rho_peak=0.5,
                    target_amplitude=A,
                )
                self.assertEqual(
                    result.solved_tau_rows.shape,
                    (4, radial_count, angular_count),
                )
                self.assertEqual(
                    result.solved_pde_raw.shape,
                    (4, radial_count - 2, angular_count - 2),
                )
                self.assertEqual(
                    result.unused_constraints_raw.shape,
                    (2, radial_count - 2, angular_count - 2),
                )
                for array in (
                    result.solved_tau_rows,
                    result.solved_pde_raw,
                    result.solved_pde_normalized,
                    result.unused_constraints_raw,
                    result.unused_constraints_normalized,
                ):
                    self.assertTrue(np.all(array == 0.0))
                    self.assertFalse(np.any(np.signbit(array)))
                self.assertEqual(
                    result.report.flat_space_solved_normalized_pde_linf,
                    0.0,
                )
                self.assertEqual(
                    result.report.flat_space_unused_constraint_normalized_linf,
                    0.0,
                )
                self.assertTrue(
                    result.report.flat_space_floor_below_frozen_pde_rails,
                )
                self.assertTrue(result.report.flat_space_control_evaluated)
                self.assertFalse(result.report.flat_space_floor_subtracted)
                self.assertFalse(result.report.diagnostic_pass_authority)
                self.assertFalse(result.diagnostic_pass_authority)
                self.assertFalse(result.branch_solved)
                self.assertFalse(result.candidate_admissible)
                self.assertFalse(result.physical_authority)
                self.assertFalse(result.propulsion_authority)
                self.assertFalse(result.transport_authority)

    def test_radial_angular_boundary_rows_and_literal_corner_precedence(self) -> None:
        rho = self.rho[:, None]
        theta = self.theta[None, :]
        f0 = np.array(rho**2 + 2.0 * theta, dtype=np.float64, order="C")
        f1 = np.array(3.0 * rho**2 - theta, dtype=np.float64, order="C")
        f2 = np.array(-rho**2 + 0.5 * theta, dtype=np.float64, order="C")
        scalar = np.array(rho + 3.0 * theta, dtype=np.float64, order="C")
        result = assemble((f0, f1, f2, scalar))
        tau = result.solved_tau_rows

        # Origin radial rows: metric d/drho and scalar value.  These remain
        # radial, not angular, at both corners.
        np.testing.assert_allclose(tau[0:3, 0, :], 0.0, rtol=0.0, atol=2e-12)
        np.testing.assert_allclose(tau[3, 0, :], scalar[0, :], rtol=0.0, atol=0.0)

        # Infinity radial rows: direct values, including both corners.
        np.testing.assert_allclose(tau[0, -1, :], f0[-1, :], rtol=0.0, atol=0.0)
        np.testing.assert_allclose(tau[1, -1, :], f1[-1, :], rtol=0.0, atol=0.0)
        np.testing.assert_allclose(tau[2, -1, :], f2[-1, :], rtol=0.0, atol=0.0)
        np.testing.assert_allclose(tau[3, -1, :], scalar[-1, :], rtol=0.0, atol=0.0)

        # Angular rows apply only at strict radial indices.
        np.testing.assert_allclose(tau[0, 1:-1, 0], 2.0, rtol=0.0, atol=3e-12)
        np.testing.assert_allclose(tau[1, 1:-1, 0], -1.0, rtol=0.0, atol=3e-12)
        np.testing.assert_allclose(tau[2, 1:-1, 0], 0.5, rtol=0.0, atol=3e-12)
        np.testing.assert_allclose(tau[3, 1:-1, 0], 3.0, rtol=0.0, atol=3e-12)
        np.testing.assert_allclose(tau[0, 1:-1, -1], 2.0, rtol=0.0, atol=3e-12)
        np.testing.assert_allclose(tau[1, 1:-1, -1], -1.0, rtol=0.0, atol=3e-12)
        np.testing.assert_allclose(tau[2, 1:-1, -1], 0.5, rtol=0.0, atol=3e-12)
        np.testing.assert_allclose(
            tau[3, 1:-1, -1],
            scalar[1:-1, -1],
            rtol=0.0,
            atol=0.0,
        )
        self.assertEqual(
            result.boundary_corner_precedence,
            "radial_boundary_rows_replace_all_angular_rows_at_corners",
        )

    def test_compactification_and_tensor_derivatives_match_analytic_jet(self) -> None:
        rho = self.rho[:, None]
        theta = self.theta[None, :]
        polynomial = np.array(
            rho**3 + 2.0 * rho * theta + theta**2,
            dtype=np.float64,
            order="C",
        )
        captured = []
        original = collocation_module.evaluate_interior_regular_residual

        def capture(**kwargs):
            captured.append(kwargs)
            return original(**kwargs)

        with mock.patch.object(
            collocation_module,
            "evaluate_interior_regular_residual",
            side_effect=capture,
        ):
            result = assemble((polynomial, zeros(), zeros(), zeros()), w=0.6)

        first = captured[0]
        r = float(self.rho[1])
        t = float(self.theta[1])
        one_minus = 1.0 - r
        jet = first["F0"]
        self.assertAlmostEqual(first["x"], r / one_minus, places=15)
        self.assertAlmostEqual(jet.value, r**3 + 2.0 * r * t + t**2, places=14)
        self.assertAlmostEqual(
            jet.dx,
            one_minus**2 * (3.0 * r**2 + 2.0 * t),
            places=12,
        )
        self.assertAlmostEqual(jet.dtheta, 2.0 * r + 2.0 * t, places=12)
        self.assertAlmostEqual(
            jet.dxx,
            one_minus**4 * 6.0 * r
            - 2.0 * one_minus**3 * (3.0 * r**2 + 2.0 * t),
            places=10,
        )
        self.assertAlmostEqual(jet.dxtheta, one_minus**2 * 2.0, places=11)
        self.assertAlmostEqual(jet.dthetatheta, 2.0, places=10)
        self.assertTrue(np.all(np.isfinite(result.solved_pde_raw)))
        self.assertTrue(np.all(np.isfinite(result.solved_pde_normalized)))
        self.assertTrue(np.all(result.solved_pde_normalized >= 0.0))

    def test_continuous_peak_equations_use_barycentric_axis_interpolant(self) -> None:
        rho = self.rho[:, None]
        scalar_axis_polynomial = 4.0 * A * rho * (1.0 - rho)
        scalar = np.repeat(scalar_axis_polynomial, SHAPE[1], axis=1)
        scalar = np.array(scalar, dtype=np.float64, order="C")
        result = assemble((zeros(), zeros(), zeros(), scalar), rho_peak=0.5)
        self.assertAlmostEqual(result.peak_equations[0], 0.0, places=14)
        self.assertAlmostEqual(result.peak_equations[1], 0.0, places=13)
        self.assertAlmostEqual(
            result.report.peak_second_rho_derivative,
            -8.0 * A,
            places=11,
        )
        self.assertLessEqual(result.report.amplitude_absolute_error, 1e-12)

    def test_outputs_are_readonly_finite_and_all_zero_bits_are_positive(self) -> None:
        negative_zero = np.full(SHAPE, -0.0, dtype=np.float64, order="C")
        result = assemble((negative_zero,) * 4)
        arrays = (
            result.rho_nodes,
            result.theta_nodes,
            result.solved_tau_rows,
            result.solved_pde_raw,
            result.solved_pde_normalized,
            result.unused_constraints_raw,
            result.unused_constraints_normalized,
        )
        for array in arrays:
            self.assertFalse(array.flags.writeable)
            self.assertTrue(np.all(np.isfinite(array)))
            self.assertFalse(np.any(np.signbit(array[array == 0.0])))
        self.assertTrue(
            all(
                not math.copysign(1.0, value) < 0
                for value in result.peak_equations
                if value == 0.0
            ),
        )

    def test_rejects_unbounded_malformed_nonfinite_or_unfrozen_inputs(self) -> None:
        valid = (zeros(), zeros(), zeros(), zeros())

        class ArraySubclass(np.ndarray):
            pass

        bad_fields = (
            np.zeros((15, 12), dtype=np.float64),
            np.zeros((16, 12), dtype=np.float32),
            np.zeros((16, 24), dtype=np.float64)[:, ::2],
            np.full(SHAPE, np.nan, dtype=np.float64),
            np.zeros(SHAPE, dtype=np.float64).view(ArraySubclass),
        )
        for bad in bad_fields:
            with self.subTest(
                shape=getattr(bad, "shape", None),
                dtype=getattr(bad, "dtype", None),
            ):
                with self.assertRaises(ValueError):
                    assemble((bad, valid[1], valid[2], valid[3]))
        for kwargs in (
            {"w": 0.0},
            {"w": 1.0},
            {"w": math.nan},
            {"rho_peak": 0.0},
            {"rho_peak": 1.0},
            {"target_amplitude": 1.1 * A},
        ):
            with self.subTest(kwargs=kwargs):
                with self.assertRaises(ValueError):
                    assemble(**kwargs)


if __name__ == "__main__":
    unittest.main()
