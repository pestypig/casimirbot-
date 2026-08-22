"""Focused tests for the exact lambda-zero core residual witness.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: exact first-duty point witness
Current maturity: preregistered exact evaluator; receipt absent
Target maturity: audited source before one exclusive witness write
Required frozen inputs: admitted center and exact proof definitions
Required evidence: exact codec, polynomial, dependency, and inequality checks
Stop/fail criteria: any arithmetic, binding, static, or authority drift
Explicit non-goals: full cover, later duties, candidate, lamp, or authority
Downstream gate unlocked: one exact witness materialization
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import inspect
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "newtonian_lambda_zero_core_residual_witness.py"


def _load() -> object:
    specification = importlib.util.spec_from_file_location(
        "_nhm2_lambda_zero_core_residual_witness_test", SOURCE
    )
    assert specification is not None and specification.loader is not None
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


M = _load()


class CoreResidualWitnessTests(unittest.TestCase):
    def test_public_surface_point_and_authority_boundary(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "AUTHORITY_LOCKS",
                "CoreResidualWitnessError",
                "WITNESS_VERSION",
                "materialize_core_residual_witness",
            ],
        )
        self.assertEqual(
            tuple(inspect.signature(M.materialize_core_residual_witness).parameters),
            (),
        )
        self.assertEqual(M.POINT_X, Fraction(1, 128))
        self.assertEqual(M.POINT_RHO, Fraction(1, 129))
        self.assertEqual(M.POINT_T, Fraction(-127, 129))
        self.assertFalse(any(M.AUTHORITY_LOCKS.values()))

    def test_frozen_dependency_and_payload_raw_bindings_match(self) -> None:
        for path, size, expected in (
            (M.ADMISSION_PATH, M.ADMISSION_SIZE_BYTES, M.ADMISSION_RAW_SHA256),
            (
                M.DIRECTED_PROOF_PATH,
                M.DIRECTED_PROOF_RAW_SIZE_BYTES,
                M.DIRECTED_PROOF_RAW_SHA256,
            ),
            (
                M.DIRECTED_OPERATOR_PATH,
                M.DIRECTED_OPERATOR_RAW_SIZE_BYTES,
                M.DIRECTED_OPERATOR_RAW_SHA256,
            ),
            (
                M.LAMBDA_ZERO_DEFINITION_PATH,
                M.LAMBDA_ZERO_DEFINITION_RAW_SIZE_BYTES,
                M.LAMBDA_ZERO_DEFINITION_RAW_SHA256,
            ),
            (M.PROPOSAL_PATH, M.PROPOSAL_SIZE_BYTES, M.PROPOSAL_RAW_SHA256),
            (M.SCALARS_PATH, *M.SCALARS_BINDING),
            (M.CORE_U_PATH, *M.CORE_U_BINDING),
            (M.CORE_V_PATH, *M.CORE_V_BINDING),
        ):
            raw = path.read_bytes()
            self.assertEqual(len(raw), size)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), expected)

    def test_admission_self_hash_and_false_locks_recompute(self) -> None:
        raw = M.ADMISSION_PATH.read_bytes()
        value = json.loads(raw)
        expected = value.pop("receiptSha256")
        unsigned = M._canonical(value)
        observed = hashlib.sha256(
            M.ADMISSION_DOMAIN + struct.pack("<Q", len(unsigned)) + unsigned
        ).hexdigest()
        self.assertEqual(expected, M.ADMISSION_RECEIPT_SHA256)
        self.assertEqual(observed, expected)
        self.assertFalse(any(value["authorityLocks"].values()))

    def test_binary64_decoder_is_exact_and_rejects_negative_zero(self) -> None:
        self.assertEqual(
            M._binary64_fraction_le(struct.pack("<d", 1.0), "one"), 1
        )
        self.assertEqual(
            M._binary64_fraction_le(struct.pack("<d", -2.5), "negative"),
            Fraction(-5, 2),
        )
        self.assertEqual(
            M._binary64_fraction_le((1).to_bytes(8, "little"), "subnormal"),
            Fraction(1, 1 << 1_074),
        )
        for word in (
            (1 << 63).to_bytes(8, "little"),
            struct.pack("<d", float("inf")),
            struct.pack("<d", float("nan")),
        ):
            with self.assertRaises(M.CoreResidualWitnessError):
                M._binary64_fraction_le(word, "invalid")

    def test_chebyshev_derivative_and_evaluation_are_exact(self) -> None:
        coefficients = (Fraction(0), Fraction(0), Fraction(0), Fraction(1))
        first = M._chebyshev_derivative(coefficients, "first")
        second = M._chebyshev_derivative(first, "second")
        self.assertEqual(first, (Fraction(3), Fraction(0), Fraction(6)))
        self.assertEqual(second, (Fraction(0), Fraction(24)))
        for coordinate in (Fraction(-1), Fraction(-2, 7), Fraction(0), Fraction(1)):
            self.assertEqual(
                M._chebyshev_value(coefficients, coordinate, "T3"),
                4 * coordinate**3 - 3 * coordinate,
            )

    def test_constant_field_chain_rule_is_exact(self) -> None:
        value, first, second = M._field_jet((Fraction(7, 3),), "constant")
        self.assertEqual(value, Fraction(7, 3))
        self.assertEqual(first, 0)
        self.assertEqual(second, 0)

    def test_real_exact_witness_is_strict_and_stops_at_first_duty(self) -> None:
        result = M._compute_witness()
        self.assertTrue(result["strictlyExceedsThreshold"])
        self.assertEqual(result["firstFailureDutyOrdinal"], 1)
        self.assertEqual(
            result["firstFailureCode"],
            "core_normalized_schrodinger_point_counterexample",
        )
        self.assertFalse(result["laterDutiesEvaluated"])
        normalized = Fraction(
            int(result["normalizedResidualExact"]["numerator"]),
            int(result["normalizedResidualExact"]["denominator"]),
        )
        self.assertGreater(normalized, M.RESIDUAL_THRESHOLD)

    def test_collision_is_terminal_before_witness_computation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "occupied.json"
            output.write_bytes(b"occupied")
            with mock.patch.object(M, "OUTPUT_PATH", output):
                with self.assertRaises(M.CoreResidualWitnessError) as caught:
                    M.materialize_core_residual_witness()
            self.assertEqual(caught.exception.code, "witness_output_collision")

    def test_source_has_no_floating_backend_and_output_is_exact(
        self,
    ) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        for forbidden in (
            "import numpy",
            "import scipy",
            "import gmpy2",
            "Fraction.from_float",
            '"proofComplete": True',
            '"physicalAuthority": True',
        ):
            self.assertNotIn(forbidden, source)
        output = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(len(output), 6_922)
        self.assertEqual(
            hashlib.sha256(output).hexdigest(),
            "ad44b456c00c9644e73da27ebbe737f6fafbe99cac835e41519449c72479c691",
        )


if __name__ == "__main__":
    unittest.main()
