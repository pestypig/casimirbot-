"""Tests for the directed MPFR256 lambda-zero coupled-Jacobian evaluator.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: directed finite-prefix Jacobian enclosure tests
Current maturity: synthetic calculation coverage; no proof authority
Target maturity: audited finite block for a future directed inverse proof
Required frozen inputs: sealed lambda-zero successor and exact prefix oracle
Required evidence: exact containment, operation order, context restoration,
    dependency pins, hostile ingress, resource bounds, and false authority
Stop/fail criteria: enclosure miss, runtime drift, context leak, or promotion
Explicit non-goals: accepted profile, tail, inverse, tube, candidate, or lamp
Downstream gate unlocked: finite block for directed approximate-inverse assembly
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
SOURCE = HERE / "newtonian_lambda_zero_coupled_jacobian_directed.py"
EXACT_SOURCE = HERE / "newtonian_lambda_zero_coupled_jacobian_exact.py"
DEFINITION = (
    ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-v2-lambda-zero-proof-definition.v1.ts"
)


def _load(path: Path, name: str) -> object:
    specification = importlib.util.spec_from_file_location(name, path)
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


M = _load(
    SOURCE,
    "_nhm2_lambda_zero_coupled_jacobian_directed_test_target",
)
EXACT = _load(
    EXACT_SOURCE,
    "_nhm2_lambda_zero_coupled_jacobian_exact_directed_test_oracle",
)


def _apply(
    u: object,
    v: object,
    nu: object,
    delta_u: object,
    delta_v: object,
    delta_nu: object,
) -> object:
    return M._test_only_apply_lambda_zero_coupled_jacobian_directed(
        u,
        v,
        nu,
        delta_u,
        delta_v,
        delta_nu,
        M._TEST_MARKER,
    )


class _Hostile:
    reads = 0

    def __getattribute__(self, name: str) -> object:
        type(self).reads += 1
        raise AssertionError(name)


def _context_fingerprint() -> tuple[object, ...]:
    context = M.gmpy2.get_context()
    return (
        context.precision,
        context.round,
        context.emin,
        context.emax,
        context.subnormalize,
        context.trap_underflow,
        context.trap_overflow,
        context.trap_inexact,
        context.trap_invalid,
        context.trap_erange,
        context.trap_divzero,
        context.allow_complex,
        context.rational_division,
        context.allow_release_gil,
    )


class LambdaZeroCoupledJacobianDirectedTests(unittest.TestCase):
    def setUp(self) -> None:
        _Hostile.reads = 0

    def test_public_surface_is_zero_argument_and_blocked(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "LambdaZeroCoupledJacobianDirectedError",
                "observe_lambda_zero_coupled_jacobian_directed",
            ],
        )
        self.assertEqual(
            tuple(
                inspect.signature(
                    M.observe_lambda_zero_coupled_jacobian_directed
                ).parameters
            ),
            (),
        )
        with self.assertRaisesRegex(
            M.LambdaZeroCoupledJacobianDirectedError,
            "accepted_global_newtonian_profile_absent",
        ):
            M.observe_lambda_zero_coupled_jacobian_directed()

    def test_dependency_raw_and_semantic_pins_are_exact(self) -> None:
        exact_raw = EXACT_SOURCE.read_bytes()
        definition_raw = DEFINITION.read_bytes()
        self.assertEqual(len(exact_raw), M.EXACT_ORACLE_RAW_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(exact_raw).hexdigest(),
            M.EXACT_ORACLE_RAW_SHA256,
        )
        self.assertEqual(
            len(definition_raw), M.LAMBDA_ZERO_DEFINITION_RAW_SIZE_BYTES
        )
        self.assertEqual(
            hashlib.sha256(definition_raw).hexdigest(),
            M.LAMBDA_ZERO_DEFINITION_RAW_SHA256,
        )
        definition_text = definition_raw.decode("utf-8")
        self.assertIn(M.LAMBDA_ZERO_DEFINITION_SEMANTIC_SHA256, definition_text)
        self.assertIn("8_157", definition_text)

    def test_directed_enclosures_contain_independent_exact_oracle(self) -> None:
        fixtures = (
            (
                (1, Fraction(1, 3), Fraction(-2, 7), Fraction(5, 13)),
                (Fraction(-3, 5), Fraction(7, 11), Fraction(2, 17), -1),
                Fraction(-5, 19),
                (Fraction(2, 23), Fraction(-3, 29), Fraction(5, 31), 7),
                (Fraction(-11, 37), Fraction(13, 41), -2, Fraction(17, 43)),
                Fraction(19, 47),
            ),
            (
                (1, 0, 0, 0, 0),
                (0, 0, 0, 0, 0),
                -1,
                (1, 2, 3, 4, 5),
                (-5, -4, -3, -2, -1),
                0,
            ),
        )
        for arguments in fixtures:
            with self.subTest(arguments=arguments):
                directed = _apply(*arguments)
                exact = EXACT.apply_lambda_zero_coupled_jacobian_exact(
                    *arguments
                )
                self.assertTrue(
                    all(
                        interval.contains(value)
                        for interval, value in zip(
                            directed.delta_r_u,
                            exact.delta_r_u,
                            strict=True,
                        )
                    )
                )
                self.assertTrue(
                    all(
                        interval.contains(value)
                        for interval, value in zip(
                            directed.delta_r_v,
                            exact.delta_r_v,
                            strict=True,
                        )
                    )
                )
                self.assertTrue(
                    directed.delta_r_normalization.contains(
                        exact.delta_r_normalization
                    )
                )

    def test_all_33_prefix_basis_columns_enclose_exact_values(self) -> None:
        length = 33
        u = (Fraction(1),) + tuple(
            Fraction((-1) ** index, index + 2) for index in range(1, length)
        )
        v = tuple(Fraction(index - 5, index + 7) for index in range(length))
        zero = (Fraction(0),) * length
        for column in range(length):
            basis = tuple(
                Fraction(1 if index == column else 0)
                for index in range(length)
            )
            for delta_u, delta_v in ((basis, zero), (zero, basis)):
                directed = _apply(u, v, Fraction(-2, 3), delta_u, delta_v, 0)
                exact = EXACT.apply_lambda_zero_coupled_jacobian_exact(
                    u,
                    v,
                    Fraction(-2, 3),
                    delta_u,
                    delta_v,
                    0,
                )
                self.assertTrue(
                    all(
                        interval.contains(value)
                        for interval, value in zip(
                            directed.delta_r_u,
                            exact.delta_r_u,
                            strict=True,
                        )
                    ),
                    (column, "u" if delta_u is basis else "v"),
                )
                self.assertTrue(
                    all(
                        interval.contains(value)
                        for interval, value in zip(
                            directed.delta_r_v,
                            exact.delta_r_v,
                            strict=True,
                        )
                    ),
                    (column, "u" if delta_u is basis else "v"),
                )

    def test_exact_dyadic_fixture_has_point_intervals(self) -> None:
        receipt = _apply(
            (1, 0, 0),
            (0, 0, 0),
            -1,
            (1, 2, 4),
            (8, 16, 32),
            Fraction(1, 2),
        )
        for interval in receipt.delta_r_u + receipt.delta_r_v:
            self.assertEqual(interval.lower, interval.upper)
        self.assertEqual(
            receipt.delta_r_normalization.lower,
            receipt.delta_r_normalization.upper,
        )

    def test_operation_trace_and_receipt_are_deterministic(self) -> None:
        arguments = (
            (1, Fraction(1, 3), Fraction(1, 5)),
            (Fraction(-1, 7), Fraction(1, 11), Fraction(1, 13)),
            Fraction(-1, 17),
            (Fraction(1, 19), Fraction(1, 23), Fraction(1, 29)),
            (Fraction(1, 31), Fraction(1, 37), Fraction(1, 41)),
            Fraction(1, 43),
        )
        first = _apply(*arguments)
        second = _apply(*arguments)
        self.assertEqual(first, second)
        self.assertGreater(first.operation_count, 0)
        self.assertRegex(first.operation_trace_sha256, r"^[0-9a-f]{64}$")
        self.assertRegex(first.canonical_sha256, r"^[0-9a-f]{64}$")
        self.assertEqual(first.runtime_versions, ("2.3.1", "MPFR 4.2.2"))

    def test_mpfr_context_is_restored_after_success_and_failure(self) -> None:
        before = _context_fingerprint()
        _apply((1, 0), (0, 0), -1, (0, 0), (0, 0), 0)
        self.assertEqual(_context_fingerprint(), before)
        with self.assertRaises(M.LambdaZeroCoupledJacobianDirectedError):
            _apply((1, 0), (0, 0), 0, (0, 0), (0, 0), 0)
        self.assertEqual(_context_fingerprint(), before)

    def test_private_marker_hostile_ingress_and_budgets_fail_closed(self) -> None:
        with self.assertRaisesRegex(
            M.LambdaZeroCoupledJacobianDirectedError,
            "private_test_marker_required",
        ):
            M._test_only_apply_lambda_zero_coupled_jacobian_directed(
                _Hostile(),
                _Hostile(),
                _Hostile(),
                _Hostile(),
                _Hostile(),
                _Hostile(),
                object(),
            )
        self.assertEqual(_Hostile.reads, 0)
        with self.assertRaisesRegex(
            M.LambdaZeroCoupledJacobianDirectedError,
            "coefficient_tuple_required",
        ):
            _apply(_Hostile(), (0,), -1, (0,), (0,), 0)
        self.assertEqual(_Hostile.reads, 0)
        with self.assertRaisesRegex(
            M.LambdaZeroCoupledJacobianDirectedError,
            "scalar_bit_budget_exceeded",
        ):
            _apply((1,), (0,), -1, (0,), (0,), 1 << 2048)
        with self.assertRaisesRegex(
            M.LambdaZeroCoupledJacobianDirectedError,
            "coefficient_count_invalid",
        ):
            _apply(
                (1,) * 514,
                (0,) * 514,
                -1,
                (0,) * 514,
                (0,) * 514,
                0,
            )

    def test_receipt_keeps_every_proof_and_authority_surface_false(self) -> None:
        receipt = _apply((1, 0), (0, 0), -1, (0, 0), (0, 0), 0)
        self.assertTrue(receipt.synthetic_test_only)
        false_fields = (
            "exact_oracle_containment_checked_by_caller",
            "accepted_ground_state_bound",
            "analytic_tail_columns_implemented",
            "global_inverse_proved",
            "proof_execution_authorized",
            "candidate_executed",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        self.assertTrue(all(getattr(receipt, field) is False for field in false_fields))
        self.assertEqual(len(receipt.blockers), 6)

    def test_directed_source_is_disjoint_from_exact_oracle_and_side_effects(
        self,
    ) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("import newtonian_lambda_zero_coupled_jacobian_exact", text)
        for forbidden in (
            "subprocess",
            "os.environ",
            "open(",
            "candidate_output",
            "registry",
            "casimir",
        ):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
