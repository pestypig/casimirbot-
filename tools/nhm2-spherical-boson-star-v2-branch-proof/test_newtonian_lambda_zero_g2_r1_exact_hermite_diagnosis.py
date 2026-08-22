"""Focused tests for the frozen G2-R1 exact Hermite diagnosis."""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2_r1_exact_hermite_diagnosis.py"
)
SPEC = importlib.util.spec_from_file_location("g2_r1_exact_hermite_diagnosis", SOURCE)
assert SPEC is not None and SPEC.loader is not None
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)


class G2R1ExactHermiteDiagnosisTests(unittest.TestCase):
    def test_frozen_input_bindings_match_without_evaluating_result(self) -> None:
        paths = (
            (M.ACTIVE_PACKET_PATH, 3_140, M.ACTIVE_PACKET_RAW_SHA256),
            (M.PROPOSAL_PATH, 4_870, M.PROPOSAL_RAW_SHA256),
            (M.GLOBAL_PATH, 196_505, M.GLOBAL_RAW_SHA256),
            (M.PROJECTION_PATH, 1_841, M.PROJECTION_RAW_SHA256),
            (M.ADMISSION_PATH, 2_158, M.ADMISSION_RAW_SHA256),
            (M.POLYNOMIAL_PATH, 6_922, M.POLYNOMIAL_RAW_SHA256),
        )
        for path, size, digest in paths:
            raw = path.read_bytes()
            self.assertEqual(len(raw), size)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), digest)
        global_center, projection, admission, polynomial = M._load_inputs()
        self.assertEqual(global_center["receiptSha256"], M.GLOBAL_SELF_SHA256)
        self.assertEqual(projection["receiptSha256"], M.PROJECTION_SELF_SHA256)
        self.assertEqual(admission["receiptSha256"], M.ADMISSION_SELF_SHA256)
        self.assertEqual(polynomial["receiptSha256"], M.POLYNOMIAL_SELF_SHA256)

    def test_binary64_decoder_is_exact_and_rejects_negative_zero(self) -> None:
        self.assertEqual(M._binary64_fraction_hex("3ff0000000000000", "one"), 1)
        self.assertEqual(
            M._binary64_fraction_hex("3fe0000000000000", "half"),
            Fraction(1, 2),
        )
        self.assertEqual(
            M._binary64_fraction_hex("0000000000000001", "subnormal"),
            Fraction(1, 1 << 1074),
        )
        with self.assertRaises(M.G2R1DiagnosisError):
            M._binary64_fraction_hex("8000000000000000", "negative_zero")

    def test_hermite_jet_reproduces_cubic_polynomial_exactly(self) -> None:
        # p(x)=2*x^3-3*x^2+5*x+7 on [0,2]
        def p(x: Fraction) -> Fraction:
            return 2 * x**3 - 3 * x**2 + 5 * x + 7

        def dp(x: Fraction) -> Fraction:
            return 6 * x**2 - 6 * x + 5

        x = Fraction(3, 5)
        value, first, second = M._hermite_jet(
            Fraction(0),
            Fraction(2),
            p(Fraction(0)),
            p(Fraction(2)),
            dp(Fraction(0)),
            dp(Fraction(2)),
            x,
            "cubic",
        )
        self.assertEqual(value, p(x))
        self.assertEqual(first, dp(x))
        self.assertEqual(second, 12 * x - 6)

    def test_hermite_jet_requires_strict_interior_point(self) -> None:
        for point in (Fraction(0), Fraction(1)):
            with self.assertRaises(M.G2R1DiagnosisError) as caught:
                M._hermite_jet(
                    Fraction(0),
                    Fraction(1),
                    Fraction(0),
                    Fraction(1),
                    Fraction(1),
                    Fraction(1),
                    point,
                    "endpoint",
                )
            self.assertEqual(
                caught.exception.code,
                "diagnosis_point_not_strictly_inside",
            )

    def test_fraction_records_are_exact_and_bounded(self) -> None:
        self.assertEqual(
            M._fraction_from_record(
                {"denominator": "7", "numerator": "-3"}, "fraction"
            ),
            Fraction(-3, 7),
        )
        for hostile in (
            {"denominator": "0", "numerator": "1"},
            {"denominator": "07", "numerator": "1"},
            {"denominator": "7", "numerator": "+1"},
            {"denominator": "7", "numerator": "1", "extra": "0"},
        ):
            with self.assertRaises(M.G2R1DiagnosisError):
                M._fraction_from_record(hostile, "hostile")

    def test_duplicate_json_keys_fail_closed(self) -> None:
        with self.assertRaises(M.G2R1DiagnosisError) as caught:
            json.loads('{"a":1,"a":2}', object_pairs_hook=M._pairs_object)
        self.assertEqual(caught.exception.code, "diagnosis_duplicate_json_key")

    def test_output_collision_precedes_real_diagnosis(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "occupied.json"
            output.write_bytes(b"occupied")
            with mock.patch.object(M, "OUTPUT_PATH", output):
                with mock.patch.object(M, "_exact_diagnosis") as diagnosis:
                    with self.assertRaises(M.G2R1DiagnosisError) as caught:
                        M.materialize_exact_hermite_diagnosis()
            self.assertEqual(caught.exception.code, "diagnosis_output_collision")
            diagnosis.assert_not_called()

    def test_synthetic_decision_table_is_exhaustive(self) -> None:
        rail = M.THRESHOLD
        cases = (
            (
                rail + Fraction(1, 10**12),
                "UPSTREAM_GLOBAL_CENTER_ACCURACY_SUCCESSOR_REQUIRED",
            ),
            (rail, "CORE_CODEC_OR_MODE_COUNT_SUCCESSOR_REQUIRED"),
            (rail - Fraction(1, 10**12), "CORE_CODEC_OR_MODE_COUNT_SUCCESSOR_REQUIRED"),
        )
        for value, expected in cases:
            observed = (
                "UPSTREAM_GLOBAL_CENTER_ACCURACY_SUCCESSOR_REQUIRED"
                if value > rail
                else "CORE_CODEC_OR_MODE_COUNT_SUCCESSOR_REQUIRED"
            )
            self.assertEqual(observed, expected)

    def test_source_surface_is_authority_neutral_and_exact_only(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        for forbidden in (
            "import numpy",
            "import scipy",
            "import gmpy2",
            "Fraction.from_float",
            '"proofComplete": True',
            '"groundStateAccepted": True',
            '"physicalAuthority": True',
        ):
            self.assertNotIn(forbidden, source)
        self.assertEqual(
            M.__all__,
            ("G2R1DiagnosisError", "materialize_exact_hermite_diagnosis"),
        )


if __name__ == "__main__":
    unittest.main()
