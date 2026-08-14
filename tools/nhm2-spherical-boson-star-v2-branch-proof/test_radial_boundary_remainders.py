from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, astuple
from fractions import Fraction
import hashlib
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import radial_boundary_remainders as boundary  # noqa: E402


REPOSITORY_ROOT = HERE.parents[1]
F = Fraction


def _origin() -> boundary.OriginFormalRecurrence:
    return boundary._derive_origin_formal_recurrence(
        synthetic_exp_2F1_origin_surrogate=F(5, 4),
        synthetic_redshifted_frequency_square_origin_surrogate=F(9, 16),
    )


def _tail(
    *, outer_amplitude: Fraction = F(7, 3)
) -> boundary.TailFormalRecurrence:
    return boundary._derive_tail_formal_recurrence(
        synthetic_w_surrogate=F(3, 5),
        synthetic_kappa_surrogate=F(4, 5),
        synthetic_adm_mass_surrogate=F(1),
        synthetic_outer_amplitude_surrogate=outer_amplitude,
    )


def _receipt() -> boundary.SyntheticBoundaryRemainderReceipt:
    return boundary._synthetic_boundary_remainder_seam(
        boundary._SYNTHETIC_TEST_MARKER,
        synthetic_exp_2F1_origin_surrogate=F(5, 4),
        synthetic_redshifted_frequency_square_origin_surrogate=F(9, 16),
        synthetic_w_surrogate=F(3, 5),
        synthetic_kappa_surrogate=F(4, 5),
        synthetic_adm_mass_surrogate=F(1),
        synthetic_outer_amplitude_surrogate=F(7, 3),
    )


def _polynomial_value(coefficients: tuple[Fraction, ...], z: Fraction) -> Fraction:
    return sum(
        (coefficient * z**degree for degree, coefficient in enumerate(coefficients)),
        F(0),
    )


def _polynomial_derivative_value(
    coefficients: tuple[Fraction, ...], z: Fraction
) -> Fraction:
    return sum(
        (
            F(degree) * coefficient * z ** (degree - 1)
            for degree, coefficient in enumerate(coefficients)
            if degree > 0
        ),
        F(0),
    )


class HostileValue:
    __slots__ = ("_touches",)

    def __init__(self, touches: list[str]) -> None:
        object.__setattr__(self, "_touches", touches)

    def _touch(self, operation: str):
        object.__getattribute__(self, "_touches").append(operation)
        raise AssertionError(f"hostile value traversed through {operation}")

    def __getattribute__(self, name: str):
        if name in {"_touches", "_touch"}:
            return object.__getattribute__(self, name)
        return self._touch(f"getattribute:{name}")

    def __iter__(self):
        return self._touch("iter")

    def __bool__(self):
        return self._touch("bool")

    def __repr__(self):
        return self._touch("repr")

    def __eq__(self, other: object):
        return self._touch("eq")

    def __hash__(self):
        return self._touch("hash")


class RadialBoundaryRemainderTests(unittest.TestCase):
    def test_exact_policy_semantic_and_existing_source_bindings(self) -> None:
        self.assertEqual(
            boundary.BRANCH_SELECTION_RAW_SOURCE_SHA256,
            "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82",
        )
        self.assertEqual(boundary.BRANCH_SELECTION_RAW_SOURCE_SIZE_BYTES, 44_912)
        self.assertEqual(
            boundary.BRANCH_SELECTION_SEMANTIC_SHA256,
            "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa",
        )
        self.assertEqual(boundary.BRANCH_SELECTION_CANONICAL_SIZE_BYTES, 41_280)
        self.assertEqual(
            boundary.BRANCH_SELECTION_PLAIN_CANONICAL_SHA256,
            "913b9d524071c20669e8f0abfd838ef6daa7b2e17b1bd5775a1fafc1e2282962",
        )
        semantic_by_role = {item.role: item for item in boundary.SEMANTIC_BINDINGS}
        self.assertEqual(
            semantic_by_role["frozen_spherical_branch_bvp"].semantic_sha256,
            "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557",
        )
        self.assertEqual(
            semantic_by_role["frozen_spherical_branch_bvp"].canonical_size_bytes,
            13_847,
        )
        self.assertEqual(
            semantic_by_role["frozen_radial_primary_numerics"].semantic_sha256,
            "f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc",
        )
        self.assertEqual(
            semantic_by_role["frozen_radial_primary_numerics"].canonical_size_bytes,
            14_732,
        )
        self.assertEqual(
            tuple(item.sha256 for item in boundary.SOURCE_BYTE_BINDINGS[1:]),
            (
                "ea76613c9cb5d3ad882d96786f98f85ee170f67e486672d97bc3add444a0d25d",
                "b635e5d6f24d05f0c88b29dfa99a156c34968990f4948048a78bd98f2690b1b9",
            ),
        )
        for item in boundary.SOURCE_BYTE_BINDINGS:
            path = REPOSITORY_ROOT.joinpath(*item.relative_path.split("/"))
            payload = path.read_bytes()
            self.assertEqual(len(payload), item.size_bytes)
            self.assertEqual(hashlib.sha256(payload).hexdigest(), item.sha256)

    def test_origin_recurrence_is_degree_major_through_x12(self) -> None:
        origin = _origin()
        self.assertIn("synthetic", origin.number_domain)
        self.assertIn("not_authenticated_candidate", origin.number_domain)
        self.assertEqual(origin.amplitude, F(1, 1_024))
        self.assertEqual(
            tuple(step.coefficient_power for step in origin.steps),
            (2, 4, 6, 8, 10, 12),
        )
        self.assertEqual(
            origin.coefficient_serialization_order,
            "degree_major_x0_x2_x4_x6_x8_x10_x12;within_degree_F0_then_F1_then_varphi",
        )
        self.assertEqual(
            tuple(degree for degree, _ in origin.F0_minus_F0_origin_even_coefficients),
            (0, 2, 4, 6, 8, 10, 12),
        )
        self.assertEqual(
            tuple(degree for degree, _ in origin.F1_minus_F1_origin_even_coefficients),
            (0, 2, 4, 6, 8, 10, 12),
        )
        self.assertEqual(
            tuple(degree for degree, _ in origin.varphi_even_coefficients),
            (0, 2, 4, 6, 8, 10, 12),
        )
        self.assertEqual(origin.cancelled_row_degrees, (0, 2, 4, 6, 8, 10))
        self.assertTrue(
            all(
                step.coefficients_degree_major[0][0] == "F0"
                and step.coefficients_degree_major[1][0] == "F1"
                and step.coefficients_degree_major[2][0] == "varphi"
                for step in origin.steps
            )
        )

    def test_origin_x2_and_x4_reproduce_existing_exact_formulas(self) -> None:
        for H, E in ((F(5, 4), F(9, 16)), (F(3, 2), F(7, 3))):
            origin = boundary._derive_origin_formal_recurrence(
                synthetic_exp_2F1_origin_surrogate=H,
                synthetic_redshifted_frequency_square_origin_surrogate=E,
            )
            P = F(1, 1_024)
            expected_x2 = (
                P * P * H * (2 * E - 1) / 6,
                -P * P * H * (E + 1) / 12,
                P * H * (1 - E) / 6,
            )
            expected_x4 = (
                -P
                * P
                * H
                * H
                * (2 * E - 1)
                * ((3 * P * P + 1) * E - 1)
                / 60,
                P
                * P
                * H
                * H
                * (
                    P * P * (29 * E * E - 2 * E + 5)
                    + 8 * E * E
                    + 8 * E
                    - 16
                )
                / 1_440,
                P
                * H
                * H
                * (P * P * (6 * E * E - 4 * E) + (1 - E) ** 2)
                / 120,
            )
            self.assertEqual(
                tuple(value for _, value in origin.steps[0].coefficients_degree_major),
                expected_x2,
            )
            self.assertEqual(
                tuple(value for _, value in origin.steps[1].coefficients_degree_major),
                expected_x4,
            )

    def test_origin_matrix_determinant_and_literal_row_cancellation(self) -> None:
        origin = _origin()
        U0 = F(4, 5)
        for step in origin.steps:
            n = step.row_degree // 2
            k = 2 * n + 2
            expected_matrix = (
                (F(0), U0 * 2 * k * (k + 1), F(0)),
                (U0 * k * k, U0 * k * k, F(0)),
                (F(0), F(0), U0 * k * (k + 1)),
            )
            self.assertEqual(step.row_order, boundary.ORIGIN_ROW_ORDER)
            self.assertEqual(step.unknown_order, ("F0", "F1", "varphi"))
            self.assertEqual(step.coefficient_matrix, expected_matrix)
            direct = boundary._determinant_three_by_three(expected_matrix)
            expected = -32 * F((n + 1) ** 4) * F((2 * n + 3) ** 2) * U0**3
            self.assertEqual(step.determinant, direct)
            self.assertEqual(step.determinant_formula_value, expected)
            self.assertNotEqual(step.determinant, 0)
            self.assertEqual(
                step.elimination_order,
                (
                    "F1_from_Et_t",
                    "F0_from_Etheta_theta_after_F1",
                    "varphi_from_KGbar",
                ),
            )
            self.assertEqual(step.row_coefficient_after_elimination, (F(0),) * 3)

        F0 = [F(0)] * 13
        F1 = [F(0)] * 13
        varphi = [F(0)] * 13
        varphi[0] = F(1, 1_024)
        for degree, value in origin.F0_minus_F0_origin_even_coefficients:
            F0[degree] = value
        for degree, value in origin.F1_minus_F1_origin_even_coefficients:
            F1[degree] = value
        for degree, value in origin.varphi_even_coefficients:
            varphi[degree] = value
        rows = boundary._origin_frozen_rows(
            F0,
            F1,
            varphi,
            exp_2F1_origin=F(5, 4),
            redshifted_frequency_square_origin=F(9, 16),
            maximum_degree=10,
        )
        self.assertTrue(
            all(row[degree] == 0 for row in rows for degree in range(0, 11))
        )

    def test_tail_metric_emission_scratch_determinants_and_closed_forms(self) -> None:
        tail = _tail()
        self.assertEqual(tail.q, F(2, 5))
        self.assertEqual(tail.C0, 1)
        A = dict(tail.A_coefficients_through_scratch)
        B = dict(tail.B_coefficients_through_scratch)
        self.assertEqual(tuple(A), tuple(range(1, 10)))
        self.assertEqual(tuple(B), tuple(range(1, 10)))
        for n in range(1, 10):
            self.assertEqual(
                A[n], -2 * tail.q**n / n if n % 2 else F(0)
            )
            self.assertEqual(B[n], 2 * F((-1) ** (n + 1)) * tail.q**n / n)
        self.assertEqual(
            tuple(step.n for step in tail.emitted_metric_steps),
            (2, 3, 4, 5, 6, 7, 8),
        )
        self.assertTrue(all(step.emitted for step in tail.emitted_metric_steps))
        self.assertEqual(tail.scratch_metric_step.n, 9)
        self.assertFalse(tail.scratch_metric_step.emitted)
        self.assertTrue(tail.scratch_metric_step.internal_scratch)
        for step in (*tail.emitted_metric_steps, tail.scratch_metric_step):
            n = F(step.n)
            matrix = (
                (2 * n * (n - 1), F(0)),
                (n * n, n * n),
            )
            self.assertEqual(step.row_order, ("BnRow", "AnBnRow"))
            self.assertEqual(step.unknown_order, ("B_n", "A_n"))
            self.assertEqual(step.coefficient_matrix, matrix)
            self.assertEqual(step.determinant, matrix[0][0] * matrix[1][1])
            self.assertEqual(step.determinant, 2 * n**3 * (n - 1))
            self.assertNotEqual(step.determinant, 0)

    def test_tail_scalar_compatibility_diagonals_and_scratch_chronology(self) -> None:
        tail = _tail()
        self.assertEqual(tail.sigma, F(-27, 20))
        self.assertEqual(tail.kg_compatibility_z0, 0)
        self.assertEqual(tail.kg_compatibility_z1, 0)
        self.assertEqual(tuple(step.n for step in tail.scalar_steps), tuple(range(1, 9)))
        for step in tail.scalar_steps:
            self.assertEqual(step.extracted_kg_degree, step.n + 1)
            self.assertEqual(step.diagonal, 2 * F(16, 25) * step.n)
            self.assertEqual(step.diagonal, step.exact_required_diagonal)
            self.assertNotEqual(step.diagonal, 0)
            self.assertTrue(step.A_n_plus_1_and_B_n_plus_1_available_before_solve)
            self.assertEqual(step.row_coefficient_after_elimination, 0)
            self.assertEqual(step.scratch_A9_B9_bound_before_C8, step.n == 8)
        self.assertEqual(
            tail.chronology[-2:],
            ("metric_scratch_A9_B9_bound", "scalar_diagonal_C8_from_z9"),
        )
        self.assertLess(
            tail.chronology.index("metric_scratch_A9_B9_bound"),
            tail.chronology.index("scalar_diagonal_C8_from_z9"),
        )
        self.assertEqual(tail.cancelled_kg_degrees, tuple(range(10)))
        same_shape = _tail(outer_amplitude=F(11, 5))
        self.assertEqual(
            tail.C_coefficients_through_emitted_order,
            same_shape.C_coefficients_through_emitted_order,
        )
        self.assertNotEqual(
            tail.synthetic_outer_amplitude_surrogate,
            same_shape.synthetic_outer_amplitude_surrogate,
        )

    def test_origin_and_tail_parameter_gates_and_resource_limits(self) -> None:
        for name, value in (
            ("synthetic_exp_2F1_origin_surrogate", F(0)),
            ("synthetic_redshifted_frequency_square_origin_surrogate", F(0)),
        ):
            arguments = {
                "synthetic_exp_2F1_origin_surrogate": F(1),
                "synthetic_redshifted_frequency_square_origin_surrogate": F(1),
            }
            arguments[name] = value
            with self.assertRaises(boundary.FormalRecurrenceInputError):
                boundary._derive_origin_formal_recurrence(**arguments)
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary._derive_origin_formal_recurrence(
                synthetic_exp_2F1_origin_surrogate=1,  # type: ignore[arg-type]
                synthetic_redshifted_frequency_square_origin_surrogate=F(1),
            )
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary._derive_origin_formal_recurrence(
                synthetic_exp_2F1_origin_surrogate=F(1, 1 << 257),
                synthetic_redshifted_frequency_square_origin_surrogate=F(1),
            )

        valid = {
            "synthetic_w_surrogate": F(3, 5),
            "synthetic_kappa_surrogate": F(4, 5),
            "synthetic_adm_mass_surrogate": F(1),
            "synthetic_outer_amplitude_surrogate": F(1),
        }
        hostile_changes = (
            ("synthetic_w_surrogate", F(0)),
            ("synthetic_w_surrogate", F(1)),
            ("synthetic_kappa_surrogate", F(3, 5)),
            ("synthetic_adm_mass_surrogate", F(0)),
            ("synthetic_adm_mass_surrogate", F(160)),
            ("synthetic_outer_amplitude_surrogate", F(0)),
        )
        for name, value in hostile_changes:
            arguments = dict(valid)
            arguments[name] = value
            with self.subTest(name=name, value=value):
                with self.assertRaises(boundary.FormalRecurrenceInputError):
                    boundary._derive_tail_formal_recurrence(**arguments)
        invalid_type = dict(valid)
        invalid_type["synthetic_adm_mass_surrogate"] = 1
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary._derive_tail_formal_recurrence(**invalid_type)  # type: ignore[arg-type]

    def test_exact_origin_and_tail_envelope_derivatives_and_endpoints(self) -> None:
        self.assertEqual(
            (
                boundary.origin_envelope_g0(F(0)),
                boundary.origin_envelope_g1(F(0)),
                boundary.origin_envelope_g2(F(0)),
            ),
            (F(0), F(0), F(0)),
        )
        self.assertEqual(
            (
                boundary.tail_envelope_h0(F(0)),
                boundary.tail_envelope_h1(F(0)),
                boundary.tail_envelope_h2(F(0)),
            ),
            (F(0), F(0), F(0)),
        )
        for z in (F(1, 128), F(1, 32), F(1, 16)):
            D = 1 - z * z
            self.assertEqual(boundary.origin_envelope_g0(z), z**14 / D)
            self.assertEqual(
                boundary.origin_envelope_g1(z),
                14 * z**13 / D + 2 * z**15 / D**2,
            )
            self.assertEqual(
                boundary.origin_envelope_g2(z),
                182 * z**12 / D + 58 * z**14 / D**2 + 8 * z**16 / D**3,
            )
        for z in (F(1, 256), F(1, 128), F(1, 64)):
            D = 1 - z
            self.assertEqual(boundary.tail_envelope_h0(z), z**9 / D)
            self.assertEqual(
                boundary.tail_envelope_h1(z), 9 * z**8 / D + z**9 / D**2
            )
            self.assertEqual(
                boundary.tail_envelope_h2(z),
                72 * z**7 / D + 18 * z**8 / D**2 + 2 * z**9 / D**3,
            )
        self.assertTrue(boundary.origin_envelope_g2(F(1, 16)) > 0)
        self.assertTrue(boundary.tail_envelope_h2(F(1, 64)) > 0)

    def test_exact_physical_derivative_bounds_and_full_scalar_prefactor(self) -> None:
        origin_bounds = boundary.origin_x14_envelope_bounds(
            coefficient_majorant=F(3),
            analytic_radius=F(1, 16),
            x=F(1, 256),
        )
        z_origin = F(1, 16)
        self.assertEqual(
            origin_bounds,
            (
                3 * boundary.origin_envelope_g0(z_origin),
                48 * boundary.origin_envelope_g1(z_origin),
                768 * boundary.origin_envelope_g2(z_origin),
            ),
        )
        tail_bounds = boundary.tail_metric_z9_physical_x_bounds(
            coefficient_majorant=F(2),
            kappa=F(4, 5),
            z=F(1, 64),
        )
        z_tail = F(1, 64)
        h1 = boundary.tail_envelope_h1(z_tail)
        h2 = boundary.tail_envelope_h2(z_tail)
        self.assertEqual(
            tail_bounds,
            (
                2 * boundary.tail_envelope_h0(z_tail),
                2 * F(4, 5) * z_tail**2 * h1,
                2
                * F(16, 25)
                * (z_tail**4 * h2 + 2 * z_tail**3 * h1),
            ),
        )

        S = (F(1), F(2, 3), F(-1, 5))
        sigma = F(-7, 4)
        operators = boundary.full_scalar_prefactor_operator_coefficients(
            S, sigma=sigma
        )
        z = F(1, 8)
        S_value = _polynomial_value(S, z)
        S_prime = _polynomial_derivative_value(S, z)
        L_value = _polynomial_value(operators.L_sigma, z)
        self.assertEqual(
            L_value, (-1 + sigma * z) * S_value - z * z * S_prime
        )
        L_prime = _polynomial_derivative_value(operators.L_sigma, z)
        L2_value = _polynomial_value(operators.L_sigma_squared, z)
        self.assertEqual(
            L2_value, (-1 + sigma * z) * L_value - z * z * L_prime
        )
        self.assertEqual(operators.first_physical_x_factor, "kappa*L_sigma")
        self.assertEqual(
            operators.second_physical_x_factor, "kappa^2*L_sigma^2"
        )
        self.assertTrue(operators.includes_complete_exponential_and_power_prefactor)
        self.assertFalse(operators.normalized_correction_only_derivative_authority)
        self.assertFalse(operators.proof_authority)

    def test_envelope_hostile_domains_and_types_fail_closed(self) -> None:
        for function, value in (
            (boundary.origin_envelope_g0, F(-1, 1_000)),
            (boundary.origin_envelope_g1, F(1, 15)),
            (boundary.tail_envelope_h0, F(-1, 1_000)),
            (boundary.tail_envelope_h2, F(1, 63)),
        ):
            with self.assertRaises(boundary.FormalRecurrenceInputError):
                function(value)
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary.origin_envelope_g0(0)  # type: ignore[arg-type]
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary.origin_x14_envelope_bounds(
                coefficient_majorant=F(-1),
                analytic_radius=F(1, 16),
                x=F(0),
            )
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary.origin_x14_envelope_bounds(
                coefficient_majorant=F(1),
                analytic_radius=F(1, 17),
                x=F(0),
            )
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary.tail_metric_z9_physical_x_bounds(
                coefficient_majorant=F(1), kappa=F(0), z=F(1, 64)
            )
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary.full_scalar_prefactor_operator_coefficients((), sigma=F(1))
        with self.assertRaises(boundary.FormalRecurrenceInputError):
            boundary.full_scalar_prefactor_operator_coefficients(
                (F(1),) * 11, sigma=F(1)
            )

    def test_public_proof_entrypoints_block_before_hostile_value_traversal(self) -> None:
        for function, proof_kind, expected_blockers in (
            (
                boundary.prove_origin_x14,
                "origin_x14",
                boundary.ORIGIN_PRODUCTION_BLOCKERS,
            ),
            (
                boundary.prove_tail_z9,
                "tail_z9",
                boundary.TAIL_PRODUCTION_BLOCKERS,
            ),
        ):
            touches: list[str] = []
            hostile = HostileValue(touches)
            with self.assertRaises(boundary.BoundaryRemainderProofBlocked) as caught:
                function(hostile, authenticated_candidate_interface_jets=hostile)
            self.assertEqual(touches, [])
            self.assertEqual(caught.exception.proof_kind, proof_kind)
            self.assertEqual(caught.exception.blockers, expected_blockers)
            self.assertIn("majorant_configuration_absent", ",".join(expected_blockers))
            self.assertIn("authenticated_candidate_interface_jets_absent", expected_blockers)
            self.assertIn("interval_runtime_binding_absent", expected_blockers)
            self.assertIn("interval_source_binding_absent", expected_blockers)
            self.assertIn("interval_executable_binding_absent", expected_blockers)
            self.assertIn("proof_issuer_binding_absent", expected_blockers)
            self.assertTrue(
                all(value is False for value in astuple(caught.exception.authority_locks))
            )

    def test_private_marker_precedes_synthetic_value_validation_and_receipt_is_locked(self) -> None:
        touches: list[str] = []
        hostile = HostileValue(touches)
        with self.assertRaises(PermissionError):
            boundary._synthetic_boundary_remainder_seam(
                object(),
                synthetic_exp_2F1_origin_surrogate=hostile,  # type: ignore[arg-type]
                synthetic_redshifted_frequency_square_origin_surrogate=hostile,  # type: ignore[arg-type]
                synthetic_w_surrogate=hostile,  # type: ignore[arg-type]
                synthetic_kappa_surrogate=hostile,  # type: ignore[arg-type]
                synthetic_adm_mass_surrogate=hostile,  # type: ignore[arg-type]
                synthetic_outer_amplitude_surrogate=hostile,  # type: ignore[arg-type]
            )
        self.assertEqual(touches, [])

        receipt = _receipt()
        self.assertTrue(receipt.all_exact_algebra_checks_passed)
        self.assertTrue(receipt.private_synthetic_test_seam)
        self.assertFalse(receipt.accepts_caller_majorants_as_authority)
        self.assertFalse(receipt.authenticated_candidate_interface_jets_used)
        self.assertFalse(receipt.interval_runtime_bound)
        self.assertFalse(receipt.proof_issuer_bound)
        self.assertFalse(receipt.recurrence_proof_authority)
        self.assertFalse(receipt.remainder_proof_authority)
        self.assertFalse(receipt.candidate_executed)
        self.assertFalse(receipt.diagnostic_pass)
        self.assertFalse(receipt.theory_graph_lamp)
        self.assertFalse(receipt.physical_viability)
        self.assertFalse(receipt.propulsion)
        self.assertFalse(receipt.transport)
        self.assertTrue(
            all(
                check.contraction_strictly_below_one
                and check.maps_ball_into_itself
                and check.synthetic_algebra_only
                and not check.certified_majorant
                and not check.proof_authority
                for check in receipt.exact_radii_checks
            )
        )
        with self.assertRaises(FrozenInstanceError):
            receipt.proof_issuer_bound = True  # type: ignore[misc]

    def test_public_surface_and_ast_ban_solver_candidate_output_registry_imports(self) -> None:
        self.assertEqual(
            boundary.__all__,
            [
                "BoundaryRemainderProofBlocked",
                "prove_origin_x14",
                "prove_tail_z9",
            ],
        )
        source_path = HERE / "radial_boundary_remainders.py"
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        import_roots: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                import_roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                import_roots.add(node.module.split(".")[0])
        self.assertEqual(
            import_roots,
            {"__future__", "dataclasses", "fractions", "hashlib", "pathlib", "typing"},
        )
        self.assertTrue(
            import_roots.isdisjoint(
                {"solver", "candidate", "output", "registry", "sympy", "gmpy2"}
            )
        )
        self.assertNotIn("importlib", import_roots)
        self.assertNotIn("subprocess", import_roots)
        self.assertNotIn("requests", import_roots)


if __name__ == "__main__":
    unittest.main()
