"""Tests for the directed MPFR256 lambda-zero origin evaluator.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: directed origin contraction and envelope tests
Current maturity: synthetic calculation coverage; no proof authority
Target maturity: audited origin stream for the global ground-state proof
Required frozen inputs: directed-proof architecture/operator and exact oracle
Required evidence: exact containment, base/propagation, all radii, restoration
Stop/fail criteria: enclosure miss, selection drift, context leak, or promotion
Explicit non-goals: exterior proof, seed acceptance, candidate, lamp, viability
Downstream gate unlocked: authenticated origin proof-stream implementation
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
SOURCE = HERE / "newtonian_lambda_zero_origin_directed.py"
EXACT_SOURCE = HERE / "newtonian_lambda_zero_origin_exact.py"
OPERATOR = (
    ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1.ts"
)


def _load(path: Path, name: str) -> object:
    specification = importlib.util.spec_from_file_location(name, path)
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


M = _load(SOURCE, "_nhm2_lambda_zero_origin_directed_test_target")
EXACT = _load(EXACT_SOURCE, "_nhm2_lambda_zero_origin_directed_exact_oracle")


def _apply(nu0: object, vc: object) -> object:
    return M._test_only_evaluate_lambda_zero_origin_directed(
        nu0,
        vc,
        M._TEST_MARKER,
    )


def _continuation(
    nu0: Fraction, vc: Fraction, maximum: int
) -> tuple[tuple[Fraction, ...], tuple[Fraction, ...]]:
    a = [Fraction(1)]
    b = [vc]
    for shell in range(maximum):
        denominator = 2 * (shell + 1) * (2 * (shell + 1) + 1)
        ba = sum(
            (b[index] * a[shell - index] for index in range(shell + 1)),
            Fraction(0),
        )
        aa = sum(
            (a[index] * a[shell - index] for index in range(shell + 1)),
            Fraction(0),
        )
        a.append(2 * (ba - nu0 * a[shell]) / denominator)
        b.append(aa / denominator)
    return tuple(a), tuple(b)


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


class LambdaZeroOriginDirectedTests(unittest.TestCase):
    def setUp(self) -> None:
        _Hostile.reads = 0

    def test_public_surface_is_zero_argument_and_blocked(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "LambdaZeroOriginDirectedError",
                "observe_lambda_zero_origin_directed",
            ],
        )
        self.assertEqual(
            tuple(
                inspect.signature(M.observe_lambda_zero_origin_directed).parameters
            ),
            (),
        )
        with self.assertRaisesRegex(
            M.LambdaZeroOriginDirectedError,
            "accepted_newtonian_seed_instance_absent",
        ):
            M.observe_lambda_zero_origin_directed()

    def test_dependency_pins_match_exact_bytes(self) -> None:
        exact_raw = EXACT_SOURCE.read_bytes()
        operator_raw = OPERATOR.read_bytes()
        self.assertEqual(len(exact_raw), M.EXACT_ORACLE_RAW_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(exact_raw).hexdigest(),
            M.EXACT_ORACLE_RAW_SHA256,
        )
        self.assertEqual(
            len(operator_raw), M.DIRECTED_PROOF_OPERATOR_RAW_SIZE_BYTES
        )
        self.assertEqual(
            hashlib.sha256(operator_raw).hexdigest(),
            M.DIRECTED_PROOF_OPERATOR_RAW_SHA256,
        )

    def test_representative_and_defects_enclose_exact_oracle(self) -> None:
        for nu0, vc in (
            (Fraction(-1), Fraction(-1)),
            (Fraction(-7, 9), Fraction(-11, 13)),
            (Fraction(-5, 8), Fraction(-3, 4)),
        ):
            with self.subTest(nu0=nu0, vc=vc):
                directed = _apply(nu0, vc)
                exact = EXACT.evaluate_lambda_zero_origin_exact(nu0, vc)
                for intervals, values in (
                    (directed.representative_a, exact.representative_a),
                    (directed.representative_b, exact.representative_b),
                    (directed.defects_a, exact.defects_a),
                    (directed.defects_b, exact.defects_b),
                ):
                    self.assertTrue(
                        all(
                            interval.contains(value)
                            for interval, value in zip(
                                intervals,
                                values,
                                strict=True,
                            )
                        )
                    )
                self.assertGreaterEqual(directed.y_upper, exact.y_upper)
                self.assertGreaterEqual(directed.z0_upper, exact.z0_upper)
                self.assertGreaterEqual(directed.z1_upper, exact.z1_upper)
                self.assertGreaterEqual(
                    directed.envelope_propagation_upper,
                    exact.envelope_propagation_upper,
                )

    def test_continuation_through_34_and_geometric_base_are_exactly_enclosed(
        self,
    ) -> None:
        nu0 = Fraction(-7, 9)
        vc = Fraction(-11, 13)
        receipt = _apply(nu0, vc)
        a, b = _continuation(nu0, vc, 34)
        self.assertEqual(len(receipt.continuation_a), 18)
        self.assertEqual(len(receipt.continuation_b), 18)
        for offset, index in enumerate(range(17, 35)):
            self.assertTrue(receipt.continuation_a[offset].contains(a[index]))
            self.assertTrue(receipt.continuation_b[offset].contains(b[index]))
            left = M.D_EXACT ** (2 * index) * (abs(a[index]) + abs(b[index]))
            right = M.M_EXACT * M.Q_EXACT**index
            self.assertLessEqual(left, right)
        self.assertTrue(receipt.envelope_base_passed)
        self.assertTrue(receipt.envelope_propagation_passed)

    def test_all_61_radii_are_evaluated_and_lowest_valid_is_selected(self) -> None:
        directed = _apply(Fraction(-1), Fraction(-1))
        exact = EXACT.evaluate_lambda_zero_origin_exact(
            Fraction(-1), Fraction(-1)
        )
        self.assertEqual(len(directed.radius_results), 61)
        self.assertEqual(directed.selected_radius_ordinal, 0)
        self.assertEqual(directed.selected_radius, Fraction(1, 1 << 80))
        self.assertTrue(directed.radius_results[0].selected)
        self.assertTrue(
            all(not row.selected for row in directed.radius_results[1:])
        )
        for directed_row, exact_row in zip(
            directed.radius_results,
            exact.radius_results,
            strict=True,
        ):
            self.assertEqual(directed_row.radius, exact_row.radius)
            self.assertGreaterEqual(directed_row.z_upper, exact_row.z_upper)
            self.assertGreaterEqual(directed_row.p_upper, exact_row.p_upper)
            self.assertTrue(directed_row.contraction_passed)
            self.assertTrue(directed_row.envelope_base_passed)
            self.assertTrue(directed_row.envelope_propagation_passed)

    def test_operation_trace_output_and_runtime_are_deterministic(self) -> None:
        first = _apply(Fraction(-1), Fraction(-1))
        second = _apply(Fraction(-1), Fraction(-1))
        self.assertEqual(first, second)
        self.assertGreater(first.operation_count, 20_000)
        self.assertRegex(first.operation_trace_sha256, r"^[0-9a-f]{64}$")
        self.assertRegex(first.canonical_sha256, r"^[0-9a-f]{64}$")
        self.assertEqual(first.runtime_versions, ("2.3.1", "MPFR 4.2.2"))
        self.assertEqual(first.precision_bits, 256)

    def test_context_restores_after_success_and_failures(self) -> None:
        before = _context_fingerprint()
        _apply(Fraction(-1), Fraction(-1))
        self.assertEqual(_context_fingerprint(), before)
        for nu0, vc in ((0, -1), (-1, 0)):
            with self.assertRaises(M.LambdaZeroOriginDirectedError):
                _apply(nu0, vc)
            self.assertEqual(_context_fingerprint(), before)

    def test_private_marker_hostile_and_scalar_budgets_fail_closed(self) -> None:
        with self.assertRaisesRegex(
            M.LambdaZeroOriginDirectedError,
            "private_test_marker_required",
        ):
            M._test_only_evaluate_lambda_zero_origin_directed(
                _Hostile(),
                _Hostile(),
                object(),
            )
        self.assertEqual(_Hostile.reads, 0)
        with self.assertRaisesRegex(
            M.LambdaZeroOriginDirectedError,
            "scalar_exact_rational_required",
        ):
            _apply(_Hostile(), -1)
        self.assertEqual(_Hostile.reads, 0)
        with self.assertRaisesRegex(
            M.LambdaZeroOriginDirectedError,
            "scalar_bit_budget_exceeded",
        ):
            _apply(1 << 1024, -1)

    def test_receipt_keeps_global_proof_and_authority_false(self) -> None:
        receipt = _apply(Fraction(-1), Fraction(-1))
        self.assertTrue(receipt.synthetic_test_only)
        false_fields = (
            "origin_stream_authenticated",
            "exterior_proof_complete",
            "global_ground_state_accepted",
            "proof_execution_authorized",
            "candidate_executed",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        self.assertTrue(all(getattr(receipt, field) is False for field in false_fields))
        self.assertEqual(len(receipt.blockers), 6)

    def test_source_is_disjoint_from_exact_oracle_and_has_no_side_effects(
        self,
    ) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("import newtonian_lambda_zero_origin_exact", text)
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
