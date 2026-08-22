"""Tests for the exact lambda-zero coupled-Jacobian action oracle.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: exact coupled-Jacobian finite-prefix tests
Current maturity: exact arithmetic oracle coverage; no proof authority
Target maturity: audited oracle for the directed MPFR linear operator
Required frozen inputs: sealed lambda-zero proof definition and coefficient ABI
Required evidence: differential identity, basis columns, bounds, false authority
Stop/fail criteria: exact mismatch, unbounded traversal, or authority drift
Explicit non-goals: global inverse, kernel proof, tube, candidate, or lamp
Downstream gate unlocked: directed MPFR coupled-Jacobian prefix evaluator
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import inspect
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = HERE / "newtonian_lambda_zero_coupled_jacobian_exact.py"
DEFINITION = (
    ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-v2-lambda-zero-proof-definition.v1.ts"
)


def _load() -> object:
    specification = importlib.util.spec_from_file_location(
        "_nhm2_lambda_zero_coupled_jacobian_exact_test_target", SOURCE
    )
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


M = _load()


def _laplacian(values: tuple[Fraction, ...]) -> tuple[Fraction, ...]:
    output = [Fraction(0) for _ in values]
    for index in range(len(values) - 1):
        shell = index + 1
        output[index] = 2 * shell * (2 * shell + 1) * values[shell]
    return tuple(output)


def _product(
    left: tuple[Fraction, ...], right: tuple[Fraction, ...]
) -> tuple[Fraction, ...]:
    output = [Fraction(0) for _ in left]
    for shell in range(len(left)):
        output[shell] = sum(
            (left[index] * right[shell - index] for index in range(shell + 1)),
            Fraction(0),
        )
    return tuple(output)


def _residual(
    u: tuple[Fraction, ...],
    v: tuple[Fraction, ...],
    nu: Fraction,
) -> tuple[tuple[Fraction, ...], tuple[Fraction, ...], Fraction]:
    lap_u = _laplacian(u)
    lap_v = _laplacian(v)
    vu = _product(v, u)
    uu = _product(u, u)
    residual_u = tuple(
        -lap_u[index] / 2 + vu[index] - nu * u[index]
        for index in range(len(u))
    )
    residual_v = tuple(lap_v[index] - uu[index] for index in range(len(u)))
    return residual_u, residual_v, u[0] - 1


def _shift(
    base: tuple[Fraction, ...],
    direction: tuple[Fraction, ...],
    scale: Fraction,
) -> tuple[Fraction, ...]:
    return tuple(
        base[index] + scale * direction[index] for index in range(len(base))
    )


class _Hostile:
    reads = 0

    def __getattribute__(self, name: str) -> object:
        type(self).reads += 1
        raise AssertionError(name)


class LambdaZeroCoupledJacobianExactTests(unittest.TestCase):
    def setUp(self) -> None:
        _Hostile.reads = 0

    def test_public_surface_signature_and_definition_pins_are_exact(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "LambdaZeroCoupledJacobianError",
                "apply_lambda_zero_coupled_jacobian_exact",
            ],
        )
        self.assertEqual(
            tuple(
                inspect.signature(
                    M.apply_lambda_zero_coupled_jacobian_exact
                ).parameters
            ),
            ("u", "v", "nu", "delta_u", "delta_v", "delta_nu"),
        )
        raw = DEFINITION.read_bytes()
        self.assertEqual(len(raw), M.LAMBDA_ZERO_DEFINITION_RAW_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(raw).hexdigest(),
            M.LAMBDA_ZERO_DEFINITION_RAW_SHA256,
        )
        text = raw.decode("utf-8")
        self.assertIn(M.LAMBDA_ZERO_DEFINITION_SEMANTIC_SHA256, text)
        self.assertIn("8_157", text)

    def test_radial_laplacian_uses_the_three_dimensional_even_series(self) -> None:
        receipt = M.apply_lambda_zero_coupled_jacobian_exact(
            (1, 0, 0, 0),
            (0, 0, 0, 0),
            -1,
            (0, 2, 3, 5),
            (0, 0, 0, 0),
            0,
        )
        expected_laplacian = (12, 60, 210, 0)
        self.assertEqual(
            receipt.spectral_l0_delta_u,
            tuple(-Fraction(value, 2) + receipt.delta_u[index]
                  for index, value in enumerate(expected_laplacian)),
        )

    def test_coupled_action_equals_exact_symmetric_directional_derivative(self) -> None:
        u = (Fraction(1), Fraction(2, 5), Fraction(-3, 7), Fraction(5, 11))
        v = (Fraction(-2, 3), Fraction(7, 13), Fraction(11, 17), Fraction(-1, 19))
        nu = Fraction(-5, 23)
        delta_u = (
            Fraction(3, 29),
            Fraction(-2, 31),
            Fraction(5, 37),
            Fraction(7, 41),
        )
        delta_v = (
            Fraction(-1, 43),
            Fraction(11, 47),
            Fraction(-13, 53),
            Fraction(17, 59),
        )
        delta_nu = Fraction(19, 61)
        epsilon = Fraction(1, 97)
        receipt = M.apply_lambda_zero_coupled_jacobian_exact(
            u, v, nu, delta_u, delta_v, delta_nu
        )
        plus = _residual(
            _shift(u, delta_u, epsilon),
            _shift(v, delta_v, epsilon),
            nu + epsilon * delta_nu,
        )
        minus = _residual(
            _shift(u, delta_u, -epsilon),
            _shift(v, delta_v, -epsilon),
            nu - epsilon * delta_nu,
        )
        derivative_u = tuple(
            (plus[0][index] - minus[0][index]) / (2 * epsilon)
            for index in range(len(u))
        )
        derivative_v = tuple(
            (plus[1][index] - minus[1][index]) / (2 * epsilon)
            for index in range(len(u))
        )
        derivative_normalization = (plus[2] - minus[2]) / (2 * epsilon)
        self.assertEqual(receipt.delta_r_u, derivative_u)
        self.assertEqual(receipt.delta_r_v, derivative_v)
        self.assertEqual(
            receipt.delta_r_normalization, derivative_normalization
        )

    def test_every_prefix_basis_column_matches_independent_formula(self) -> None:
        length = 65
        u = (Fraction(1),) + tuple(
            Fraction((-1) ** index, index + 2) for index in range(1, length)
        )
        v = tuple(Fraction(index - 7, index + 3) for index in range(length))
        nu = Fraction(-3, 5)
        zero = (Fraction(0),) * length
        for column in range(length):
            basis = tuple(
                Fraction(1 if index == column else 0)
                for index in range(length)
            )
            u_column = M.apply_lambda_zero_coupled_jacobian_exact(
                u, v, nu, basis, zero, 0
            )
            v_column = M.apply_lambda_zero_coupled_jacobian_exact(
                u, v, nu, zero, basis, 0
            )
            expected_u = _residual(
                _shift(u, basis, Fraction(1, 2)), v, nu
            )[0]
            expected_u_minus = _residual(
                _shift(u, basis, Fraction(-1, 2)), v, nu
            )[0]
            self.assertEqual(
                u_column.delta_r_u,
                tuple(
                    expected_u[index] - expected_u_minus[index]
                    for index in range(length)
                ),
            )
            self.assertEqual(
                v_column.delta_r_u,
                _product(u, basis),
            )
            self.assertEqual(v_column.delta_r_v, _laplacian(basis))

    def test_delta_nu_column_and_normalization_row_are_exact(self) -> None:
        u = (Fraction(1), Fraction(2), Fraction(3))
        zero = (Fraction(0),) * 3
        receipt = M.apply_lambda_zero_coupled_jacobian_exact(
            u, zero, -1, (Fraction(7), 0, 0), zero, Fraction(5, 2)
        )
        self.assertEqual(receipt.delta_r_u, (Fraction(9, 2), -5, -Fraction(15, 2)))
        self.assertEqual(receipt.delta_r_normalization, 7)

    def test_maximum_prefix_is_finite_and_deterministic(self) -> None:
        length = M.MAXIMUM_PREFIX_COEFFICIENTS
        u = (Fraction(1),) + (Fraction(0),) * (length - 1)
        v = (Fraction(0),) * length
        delta_u = tuple(Fraction(index % 3 - 1) for index in range(length))
        delta_v = tuple(Fraction((index + 1) % 5 - 2) for index in range(length))
        first = M.apply_lambda_zero_coupled_jacobian_exact(
            u, v, -1, delta_u, delta_v, Fraction(1, 7)
        )
        second = M.apply_lambda_zero_coupled_jacobian_exact(
            u, v, -1, delta_u, delta_v, Fraction(1, 7)
        )
        self.assertEqual(first, second)
        self.assertRegex(first.canonical_sha256, r"^[0-9a-f]{64}$")

    def test_hostile_non_tuple_and_entries_are_rejected_without_traversal(self) -> None:
        with self.assertRaisesRegex(
            M.LambdaZeroCoupledJacobianError, "coefficient_tuple_required"
        ):
            M.apply_lambda_zero_coupled_jacobian_exact(
                _Hostile(), (0,), -1, (0,), (0,), 0
            )
        self.assertEqual(_Hostile.reads, 0)
        with self.assertRaisesRegex(
            M.LambdaZeroCoupledJacobianError, "exact_rational_required"
        ):
            M.apply_lambda_zero_coupled_jacobian_exact(
                (_Hostile(),), (0,), -1, (0,), (0,), 0
            )
        self.assertEqual(_Hostile.reads, 0)

    def test_shape_normalization_sign_and_bit_budgets_fail_closed(self) -> None:
        cases = (
            (((1,), (0, 0), -1, (0,), (0,), 0), "coefficient_length_mismatch"),
            (((2,), (0,), -1, (0,), (0,), 0), "normalized_ground_state_u0_required"),
            (((1,), (0,), 0, (0,), (0,), 0), "negative_nu_required"),
            (((1,), (0,), -1, (0,), (0,), 1 << 2048), "scalar_bit_budget_exceeded"),
            (
                ((1,) * 514, (0,) * 514, -1, (0,) * 514, (0,) * 514, 0),
                "coefficient_count_invalid",
            ),
        )
        for arguments, code in cases:
            with self.subTest(code=code):
                with self.assertRaisesRegex(
                    M.LambdaZeroCoupledJacobianError, code
                ):
                    M.apply_lambda_zero_coupled_jacobian_exact(*arguments)

    def test_receipt_keeps_all_unproved_and_authority_surfaces_false(self) -> None:
        receipt = M.apply_lambda_zero_coupled_jacobian_exact(
            (1, 0), (0, 0), -1, (0, 0), (0, 0), 0
        )
        self.assertTrue(receipt.exact_finite_prefix_action_implemented)
        false_fields = (
            "analytic_tail_columns_implemented",
            "global_inverse_proved",
            "simple_kernel_proved",
            "transversality_proved",
            "proof_execution_authorized",
            "candidate_executed",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        self.assertTrue(all(getattr(receipt, field) is False for field in false_fields))
        self.assertEqual(len(receipt.blockers), 5)

    def test_source_has_no_runtime_or_candidate_side_effect_surface(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        for forbidden in (
            "subprocess",
            "os.environ",
            "open(",
            "Path(",
            "candidate_output",
            "registry",
            "casimir",
        ):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
