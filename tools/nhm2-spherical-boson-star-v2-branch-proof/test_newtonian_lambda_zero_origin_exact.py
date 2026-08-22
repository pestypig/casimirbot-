"""Tests for the exact lambda-zero origin contraction oracle.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: exact origin representative and contraction tests
Current maturity: exact arithmetic oracle coverage; no proof authority
Target maturity: audited oracle for the directed MPFR origin implementation
Required frozen inputs: directed-proof architecture/operator and 61 radii
Required evidence: recurrence, defects, Y/Z0/Z1, envelope, hostile ingress
Stop/fail criteria: exact mismatch, unbounded traversal, or authority drift
Explicit non-goals: exterior proof, seed run, transversality, or candidate output
Downstream gate unlocked: directed MPFR lambda-zero origin implementation
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
SOURCE = HERE / "newtonian_lambda_zero_origin_exact.py"
OPERATOR = (
    ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1.ts"
)


def _load() -> object:
    specification = importlib.util.spec_from_file_location(
        "_nhm2_lambda_zero_origin_exact_test_target", SOURCE
    )
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


M = _load()


def _convolution(
    left: tuple[Fraction, ...], right: tuple[Fraction, ...], shell: int
) -> Fraction:
    return sum(
        (left[k] * right[shell - k] for k in range(shell + 1)),
        Fraction(0),
    )


class _Hostile:
    reads = 0

    def __getattribute__(self, name: str) -> object:
        type(self).reads += 1
        raise AssertionError(name)


class LambdaZeroOriginExactTests(unittest.TestCase):
    def setUp(self) -> None:
        _Hostile.reads = 0

    def test_public_surface_and_signature_are_narrow(self) -> None:
        self.assertEqual(
            M.__all__,
            ["LambdaZeroOriginError", "evaluate_lambda_zero_origin_exact"],
        )
        self.assertEqual(
            tuple(
                inspect.signature(M.evaluate_lambda_zero_origin_exact).parameters
            ),
            ("nu0", "vc"),
        )

    def test_operator_raw_binding_matches(self) -> None:
        self.assertEqual(
            OPERATOR.stat().st_size,
            M.DIRECTED_PROOF_OPERATOR_RAW_SIZE_BYTES,
        )
        self.assertEqual(
            hashlib.sha256(OPERATOR.read_bytes()).hexdigest(),
            M.DIRECTED_PROOF_OPERATOR_RAW_SHA256,
        )

    def test_representative_recurrence_is_exact(self) -> None:
        nu0 = Fraction(-7, 9)
        vc = Fraction(-11, 13)
        receipt = M.evaluate_lambda_zero_origin_exact(nu0, vc)
        a = receipt.representative_a
        b = receipt.representative_b
        self.assertEqual(len(a), 17)
        self.assertEqual(len(b), 17)
        self.assertEqual((a[0], b[0]), (Fraction(1), vc))
        for shell in range(16):
            denominator = 2 * (shell + 1) * (2 * (shell + 1) + 1)
            self.assertEqual(
                a[shell + 1],
                2 * (_convolution(b, a, shell) - nu0 * a[shell]) / denominator,
            )
            self.assertEqual(
                b[shell + 1],
                _convolution(a, a, shell) / denominator,
            )

    def test_defect_support_and_literal_order_are_exact(self) -> None:
        receipt = M.evaluate_lambda_zero_origin_exact(Fraction(-1), Fraction(-1))
        a = receipt.representative_a + (Fraction(0),) * 40
        b = receipt.representative_b + (Fraction(0),) * 40
        expected_a: list[Fraction] = []
        expected_b: list[Fraction] = []
        for index in range(17, 34):
            shell = index - 1
            denominator = 2 * index * (2 * index + 1)
            expected_a.append(
                a[index]
                - 2
                * (_convolution(b, a, shell) + a[shell])
                / denominator
            )
            expected_b.append(
                b[index] - _convolution(a, a, shell) / denominator
            )
        self.assertEqual(receipt.defects_a, tuple(expected_a))
        self.assertEqual(receipt.defects_b, tuple(expected_b))
        for index in range(34, 50):
            self.assertEqual(M._defect_component(a, b, Fraction(-1), index), (0, 0))

    def test_y_z0_z1_match_independent_formulas(self) -> None:
        nu0 = Fraction(-5, 8)
        receipt = M.evaluate_lambda_zero_origin_exact(nu0, Fraction(-3, 4))
        expected_y = sum(
            (
                M.D_EXACT ** (2 * index) * (abs(ga) + abs(gb))
                for index, (ga, gb) in zip(
                    range(17, 34), zip(receipt.defects_a, receipt.defects_b)
                )
            ),
            Fraction(0),
        )
        self.assertEqual(receipt.y_upper, expected_y)
        self.assertEqual(
            receipt.z0_upper,
            Fraction(2, 1190) * (receipt.abar + receipt.bbar + abs(nu0)),
        )
        self.assertEqual(receipt.z1_upper, Fraction(6, 1190))

    def test_all_frozen_radii_are_evaluated_without_false_selection(self) -> None:
        receipt = M.evaluate_lambda_zero_origin_exact(Fraction(-1), Fraction(-1))
        self.assertEqual(len(receipt.radius_results), 61)
        self.assertEqual(receipt.radius_results[0].radius, Fraction(1, 1 << 80))
        self.assertEqual(receipt.radius_results[-1].radius, Fraction(1, 1 << 20))
        self.assertTrue(
            all(row.contraction_passed for row in receipt.radius_results)
        )
        self.assertTrue(
            all(row.envelope_base_passed is None for row in receipt.radius_results)
        )
        self.assertTrue(
            all(row.selected is False for row in receipt.radius_results)
        )
        self.assertIsNone(receipt.selected_radius_ordinal)
        self.assertIsNone(receipt.selected_radius)

    def test_envelope_propagation_formula_is_exact(self) -> None:
        nu0 = Fraction(-1)
        receipt = M.evaluate_lambda_zero_origin_exact(nu0, Fraction(-1))
        ratio = M.D_EXACT**2 / M.Q_EXACT
        aq = sum(
            (
                abs(value) * ratio**index
                for index, value in enumerate(receipt.representative_a)
            ),
            Fraction(0),
        )
        bq = sum(
            (
                abs(value) * ratio**index
                for index, value in enumerate(receipt.representative_b)
            ),
            Fraction(0),
        )
        c_value = M.M_EXACT * (4 * aq + 2 * bq + 2 * abs(nu0))
        expected = M.D_EXACT**2 / (M.M_EXACT * M.Q_EXACT) * (
            c_value / 4970 + 3 * M.M_EXACT**2 / 548
        )
        self.assertEqual(receipt.envelope_propagation_upper, expected)
        self.assertEqual(receipt.envelope_propagation_passed, expected <= 1)

    def test_result_is_deterministic_and_authority_neutral(self) -> None:
        first = M.evaluate_lambda_zero_origin_exact(Fraction(-1), Fraction(-1))
        second = M.evaluate_lambda_zero_origin_exact(Fraction(-1), Fraction(-1))
        self.assertEqual(first, second)
        self.assertEqual(len(first.canonical_sha256), 64)
        self.assertTrue(first.exact_origin_operator_implemented)
        for field in (
            "directed_mpfr_replay_complete",
            "exterior_proof_complete",
            "simple_kernel_proof_complete",
            "transversality_proof_complete",
            "first_tube_containment_complete",
            "proof_execution_authorized",
            "candidate_executed",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(first, field), False, field)

    def test_hostile_and_oversized_inputs_fail_before_traversal(self) -> None:
        hostile = _Hostile()
        for args in ((hostile, 0), (0, hostile)):
            with self.assertRaisesRegex(M.LambdaZeroOriginError, "exact_rational"):
                M.evaluate_lambda_zero_origin_exact(*args)
        self.assertEqual(_Hostile.reads, 0)
        with self.assertRaisesRegex(M.LambdaZeroOriginError, "bit_budget"):
            M.evaluate_lambda_zero_origin_exact(1 << 1024, 0)
        with self.assertRaisesRegex(M.LambdaZeroOriginError, "exact_rational"):
            M.evaluate_lambda_zero_origin_exact(0.0, 0)

    def test_source_has_no_execution_or_output_surface(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        for forbidden in (
            "subprocess",
            "socket",
            "requests",
            "candidate_output",
            "casimir",
            "registry",
            "WeakMap",
        ):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
