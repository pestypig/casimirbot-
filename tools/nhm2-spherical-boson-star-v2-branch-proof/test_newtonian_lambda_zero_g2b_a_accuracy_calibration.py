"""Focused static and synthetic tests for G2B-A accuracy calibration."""

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest import mock


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_a_accuracy_calibration.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_a_accuracy_calibration", SOURCE)
assert SPEC is not None and SPEC.loader is not None
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)


class G2BAAccuracyCalibrationTests(unittest.TestCase):
    def test_frozen_bindings_match_without_running_solver(self) -> None:
        paths = (
            (M.PACKET_PATH, 4_101, M.PACKET_RAW_SHA256),
            (M.G2_R1_RECEIPT_PATH, 4_266, M.G2_R1_RECEIPT_RAW_SHA256),
            (M.GLOBAL_SOURCE_PATH, 23_629, M.GLOBAL_SOURCE_RAW_SHA256),
            (M.DIAGNOSIS_SOURCE_PATH, 18_257, M.DIAGNOSIS_SOURCE_RAW_SHA256),
        )
        for path, size, digest in paths:
            raw = path.read_bytes()
            self.assertEqual(len(raw), size)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), digest)

    def test_configuration_ladder_is_exact(self) -> None:
        self.assertEqual(
            M.CONFIGURATIONS,
            ((0, 2.0**-36), (1, 2.0**-40), (2, 2.0**-44)),
        )
        self.assertEqual(M.MAXIMUM_NODES, 65_537)
        self.assertEqual(M.DENSE_REPLAY_POINTS, 16_385)
        self.assertEqual(M.SAFETY_LIMIT, M.RAIL / 4)

    def test_selection_is_lowest_eligible_ordinal(self) -> None:
        self.assertEqual(
            M._select_ordinal(
                [
                    {"ordinal": 0, "eligible": False},
                    {"ordinal": 1, "eligible": True},
                    {"ordinal": 2, "eligible": True},
                ]
            ),
            1,
        )
        self.assertIsNone(
            M._select_ordinal(
                [
                    {"ordinal": 0, "eligible": False},
                    {"ordinal": 1, "eligible": False},
                    {"ordinal": 2, "eligible": False},
                ]
            )
        )

    def test_selection_rejects_reordered_or_missing_observations(self) -> None:
        for observations in (
            [{"ordinal": 0}, {"ordinal": 2}, {"ordinal": 1}],
            [{"ordinal": 0}, {"ordinal": 1}],
            [{"ordinal": 0}, {"ordinal": 1}, {"ordinal": 2}, {"ordinal": 3}],
        ):
            with self.assertRaises(M.AccuracyCalibrationError) as caught:
                M._select_ordinal(observations)
            self.assertEqual(
                caught.exception.code,
                "calibration_observation_order_invalid",
            )

    def test_exact_point_residual_handles_exact_constant_solution(self) -> None:
        exact = M._load_module(M.DIAGNOSIS_SOURCE_PATH, "g2b_a_test_exact")
        zero = "0000000000000000"
        one = "3ff0000000000000"
        mesh = [zero, one]
        state = [[one, one], [zero, zero], [zero, zero], [zero, zero]]
        self.assertEqual(M._exact_point_residual(mesh, state, zero, exact), 0)

    def test_f64_codec_rejects_negative_zero_and_nonfinite(self) -> None:
        self.assertEqual(M._f64_hex(1.0, "one"), "3ff0000000000000")
        for value in (-0.0, float("inf"), float("nan")):
            with self.assertRaises(M.AccuracyCalibrationError):
                M._f64_hex(value, "hostile")

    def test_output_collision_precedes_solver_or_dependency_load(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "occupied.json"
            output.write_bytes(b"occupied")
            with mock.patch.object(M, "OUTPUT_PATH", output):
                with mock.patch.object(M, "_load_module") as loader:
                    with self.assertRaises(M.AccuracyCalibrationError) as caught:
                        M.materialize_accuracy_calibration()
            self.assertEqual(caught.exception.code, "calibration_output_collision")
            loader.assert_not_called()

    def test_source_is_bounded_and_authority_neutral(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        self.assertEqual(source.count("solve_bvp("), 1)
        self.assertNotIn("while ", source)
        self.assertNotIn('"proofComplete": True', source)
        self.assertNotIn('"physicalAuthority": True', source)
        self.assertEqual(
            M.__all__,
            ("AccuracyCalibrationError", "materialize_accuracy_calibration"),
        )


if __name__ == "__main__":
    unittest.main()
