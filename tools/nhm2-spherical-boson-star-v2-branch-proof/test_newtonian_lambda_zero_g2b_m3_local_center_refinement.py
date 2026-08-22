"""Tests for the completed G2B-M3 local-center ladder."""

from __future__ import annotations

import ast
from fractions import Fraction
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import struct
import sys
import unittest


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m3_local_center_refinement.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m3", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m3_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)


class G2BM3Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m2 = M._load_module(
            M.M2_SOURCE_PATH,
            "g2b_m3_test_m2",
            M.M2_SOURCE_SIZE_BYTES,
            M.M2_SOURCE_SHA256,
        )
        cls.engine = cls.m2._load_engine()

    def test_frozen_bindings_ladder_and_prior_failure(self) -> None:
        M._verify(M.PACKET_PATH, M.PACKET_SIZE_BYTES, M.PACKET_SHA256, "packet")
        M._verify(M.REVIEW_PATH, M.REVIEW_SIZE_BYTES, M.REVIEW_SHA256, "review")
        receipt = M._verify_m2_receipt(self.m2)
        self.assertEqual(receipt["receiptSha256"], M.M2_RECEIPT_SELF_SHA256)
        self.assertEqual(M.SOLVE_REFINEMENTS, (4, 8))
        self.assertEqual(M.LOCAL_REFINEMENTS, (32, 64, 128, 256))
        self.assertEqual(M.JET_AGREEMENT_LIMIT, Fraction(1, 2**60))
        self.assertEqual(M.MARGIN, Fraction(1, 4 * 10**10))

    def test_point_is_in_interval_80_and_before_first_segment_boundary(self) -> None:
        mesh = self.engine._output_mesh_binary64()
        point = float(M.POINT_X)
        interval = next(
            ordinal
            for ordinal in range(len(mesh) - 1)
            if mesh[ordinal] < point < mesh[ordinal + 1]
        )
        self.assertEqual(interval, M.POINT_INTERVAL_ORDINAL)
        self.assertLess(interval, self.engine.SEGMENT_INTERVAL_COUNT)
        required_scale = (mesh[interval + 1] - mesh[interval]) ** 2 * 2**-60
        self.assertTrue(math.isclose(required_scale, 3.1111940465561186e-26))

    def test_comparison_runs_all_pairs_and_selects_lowest_eligible(self) -> None:
        base = tuple(Fraction(index + 1) for index in range(6))
        observations = []
        for ordinal, substeps in enumerate(M.LOCAL_REFINEMENTS):
            delta = Fraction(ordinal, 2**80)
            observations.append(
                {
                    "jet": tuple(value + delta for value in base),
                    "ordinal": ordinal,
                    "residual": Fraction(1, 10**12),
                    "substeps": substeps,
                }
            )
        records, selected = M._comparison_records(self.m2, observations)
        self.assertEqual(len(records), 3)
        self.assertEqual(selected, 64)
        self.assertTrue(all(record["eligible"] for record in records))

    def test_failed_first_pair_does_not_prevent_later_selection(self) -> None:
        observations = [
            {
                "jet": (Fraction(0),) * 6,
                "ordinal": 0,
                "residual": Fraction(1, 10**12),
                "substeps": 32,
            },
            {
                "jet": (Fraction(1),) * 6,
                "ordinal": 1,
                "residual": Fraction(1, 10**12),
                "substeps": 64,
            },
            {
                "jet": (Fraction(1),) * 6,
                "ordinal": 2,
                "residual": Fraction(1, 10**12),
                "substeps": 128,
            },
            {
                "jet": (Fraction(1),) * 6,
                "ordinal": 3,
                "residual": Fraction(1, 10**12),
                "substeps": 256,
            },
        ]
        records, selected = M._comparison_records(self.m2, observations)
        self.assertFalse(records[0]["eligible"])
        self.assertTrue(records[1]["eligible"])
        self.assertEqual(selected, 128)

    def test_out_of_ladder_partial_materialization_rejects_before_work(self) -> None:
        with self.assertRaisesRegex(M.G2BM3Error, "local_refinement_not_frozen"):
            M._partial_rows(self.engine, (), 16)

    def test_static_surface_has_no_projection_or_threshold_drift(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        ast.parse(text, filename=str(SOURCE))
        self.assertNotIn("_projection_ladder(", text)
        self.assertNotIn("_dct(", text)
        self.assertNotIn("solve_bvp", text)
        self.assertIn("POINT_X: Final[Fraction] = Fraction(1, 128)", text)
        self.assertIn("MARGIN: Final[Fraction] = Fraction(1, 4 * 10**10)", text)
        self.assertIn(
            "LOCAL_REFINEMENTS: Final[tuple[int, ...]] = (32, 64, 128, 256)",
            text,
        )

    def test_all_dependency_bytes_are_pinned(self) -> None:
        for path, digest in (
            (M.PACKET_PATH, M.PACKET_SHA256),
            (M.REVIEW_PATH, M.REVIEW_SHA256),
            (M.M2_SOURCE_PATH, M.M2_SOURCE_SHA256),
            (M.M2_RECEIPT_PATH, M.M2_RECEIPT_RAW_SHA256),
        ):
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), digest)

    def test_wrong_command_and_immutable_selected_center(self) -> None:
        with self.assertRaisesRegex(M.G2BM3Error, "exact_command_required"):
            M._main([])
        raw = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(
            hashlib.sha256(raw).hexdigest(),
            "38bb7bb9cf52f0f0008442f9c8c212279f85d9d323eab69b66ec1eea061fa88d",
        )
        self.assertEqual(len(raw), 18_479)
        receipt = json.loads(raw)
        expected = receipt.pop("receiptSha256")
        unsigned = json.dumps(
            receipt,
            ensure_ascii=True,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("ascii")
        observed = hashlib.sha256(
            M.RECEIPT_DOMAIN + struct.pack("<Q", len(unsigned)) + unsigned
        ).hexdigest()
        self.assertEqual(
            expected,
            "198f65decd9fe7616a523a066d80898b582fdf630921bafaa9557858a5aeb212",
        )
        self.assertEqual(observed, expected)
        self.assertEqual(receipt["decision"], "MPFR_LOCAL_CENTER_SELECTED")
        self.assertEqual(receipt["selectedSubstepsPerOutputInterval"], 256)
        self.assertEqual(len(receipt["centerObservations"]), 4)
        self.assertEqual(len(receipt["localComparisonRecords"]), 3)


if __name__ == "__main__":
    unittest.main()
