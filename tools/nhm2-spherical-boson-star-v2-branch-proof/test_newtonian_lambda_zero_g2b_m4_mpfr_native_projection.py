"""Tests for the completed G2B-M4 MPFR-native projection attempt."""

from __future__ import annotations

import ast
from fractions import Fraction
import hashlib
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
import struct
import sys
import unittest
from unittest.mock import patch


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m4_mpfr_native_projection.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m4", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m4_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)


class G2BM4Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m3 = M._load_m3()
        cls.m3_receipt = M._verify_m3_receipt(cls.m3)
        cls.m2 = cls.m3._load_module(
            cls.m3.M2_SOURCE_PATH,
            "g2b_m4_test_m2",
            cls.m3.M2_SOURCE_SIZE_BYTES,
            cls.m3.M2_SOURCE_SHA256,
        )

    def test_frozen_packet_selected_refinement_and_mode_ladder(self) -> None:
        M._verify(M.PACKET_PATH, M.PACKET_SIZE_BYTES, M.PACKET_SHA256, "packet")
        self.assertEqual(M.SELECTED_SUBSTEPS, 256)
        self.assertEqual(M.SOLVE_REFINEMENTS, (4, 8))
        self.assertEqual(M.MODE_COUNTS, (128, 256, 512))
        self.assertEqual(
            self.m3_receipt["selectedSubstepsPerOutputInterval"],
            M.SELECTED_SUBSTEPS,
        )

    def test_selected_observation_is_exactly_ordinal_three(self) -> None:
        selected = M._selected_observation(self.m3_receipt)
        self.assertEqual(selected["ordinal"], 3)
        self.assertEqual(selected["substepsPerOutputInterval"], 256)
        self.assertEqual(len(selected["jet"]), 6)

    def test_selected_center_replay_is_byte_exact_and_tamper_rejecting(self) -> None:
        jet = tuple(Fraction(index + 1, 8) for index in range(6))
        residual = Fraction(1, 10**20)
        expected = {
            "centerNormalizedResidualExact": self.m2._fraction_record(residual),
            "jet": [self.m2._dyadic(value) for value in jet],
            "ordinal": 3,
            "substepsPerOutputInterval": 256,
        }
        engine = SimpleNamespace(_output_mesh_binary64=lambda: (0.0, 1.0))
        with (
            patch.object(self.m2, "_center_jet", return_value=jet),
            patch.object(self.m2, "_center_residual", return_value=residual),
        ):
            observed = M._replay_selected_center(
                self.m2, engine, (0, 0), (), expected
            )
            self.assertEqual(observed, expected)
            tampered = dict(expected)
            tampered["ordinal"] = 2
            with self.assertRaisesRegex(M.G2BM4Error, "replay_mismatch"):
                M._replay_selected_center(
                    self.m2, engine, (0, 0), (), tampered
                )

    def test_all_dependency_bytes_are_pinned(self) -> None:
        for path, digest in (
            (M.PACKET_PATH, M.PACKET_SHA256),
            (M.M3_SOURCE_PATH, M.M3_SOURCE_SHA256),
            (M.M3_RECEIPT_PATH, M.M3_RECEIPT_RAW_SHA256),
        ):
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), digest)

    def test_static_surface_preserves_selected_codec_and_authority_locks(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        ast.parse(text, filename=str(SOURCE))
        self.assertIn("SELECTED_SUBSTEPS: Final[int] = 256", text)
        self.assertIn("MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)", text)
        self.assertNotIn("solve_bvp", text)
        self.assertNotIn("float(", text)
        self.assertEqual(set(M.AUTHORITY_NAMES), set(self.m2.AUTHORITY_NAMES))

    def test_wrong_command_and_immutable_api_failure(self) -> None:
        with self.assertRaisesRegex(M.G2BM4Error, "exact_command_required"):
            M._main([])
        raw = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(
            hashlib.sha256(raw).hexdigest(),
            "6eb6e99806d91c02bfad8b89edf538b41ca8763ffe94e01e1244225f9c7501ed",
        )
        self.assertEqual(len(raw), 6_232)
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
            "4bdccd085bb8f3efa67e3fa2123686347974c6c7798828e040ddbfc566bdc930",
        )
        self.assertEqual(observed, expected)
        self.assertEqual(
            receipt["decision"], "MPFR_PROJECTION_SOLVE_OR_REPLAY_FAILED"
        )
        self.assertEqual(
            receipt["firstFailure"],
            {
                "code": "g2b_m4_untyped_exception",
                "detail": "AttributeError",
                "stage": "projection_ladder",
            },
        )
        self.assertIsNotNone(receipt["selectedCenterReplay"])
        self.assertIsNone(receipt["projectionRecords"])


if __name__ == "__main__":
    unittest.main()
