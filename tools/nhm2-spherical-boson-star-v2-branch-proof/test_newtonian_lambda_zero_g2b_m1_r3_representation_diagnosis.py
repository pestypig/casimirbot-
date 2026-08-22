"""Tests for the completed finite G2B-M1-R3 diagnosis."""

from __future__ import annotations

import ast
from fractions import Fraction
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
import unittest


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_r3_representation_diagnosis.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m1_r3", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m1_r3_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)


class G2BM1R3Tests(unittest.TestCase):
    def test_frozen_inputs_and_mode_ladder(self) -> None:
        M._read(M.PACKET_PATH, M.PACKET_SIZE_BYTES, M.PACKET_SHA256, "packet")
        M._read(M.R2_PATH, M.R2_SIZE_BYTES, M.R2_SHA256, "r2")
        self.assertEqual(M.MODE_COUNTS, (128, 256, 512))
        self.assertEqual(M.MARGIN, Fraction(1, 4 * 10**10))

    def test_quintic_hermite_reproduces_degree_five_polynomial(self) -> None:
        x0 = Fraction(2, 7)
        x1 = Fraction(9, 7)
        width = x1 - x0

        def jet(x):
            value = 3 - 2 * x + 5 * x**2 - 7 * x**3 + 11 * x**4 - 13 * x**5
            first = -2 + 10 * x - 21 * x**2 + 44 * x**3 - 65 * x**4
            second = 10 - 42 * x + 132 * x**2 - 260 * x**3
            return value, first, second

        left = jet(x0)
        right = jet(x1)
        coefficients = M._quintic_coefficients(
            left[0], left[1], left[2], right[0], right[1], right[2], width
        )
        point = Fraction(5, 7)
        observed = M._quintic_jet(coefficients, (point - x0) / width, width)
        self.assertEqual(observed, jet(point))

    def test_endpoint_second_derivatives_are_the_frozen_ode(self) -> None:
        observed = M._endpoint_seconds(
            Fraction(2),
            Fraction(3),
            Fraction(5),
            Fraction(7),
            Fraction(11),
            Fraction(13),
        )
        self.assertEqual(observed, (-41, -2))

    def test_static_surface_has_no_solver_or_threshold_drift(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        ast.parse(text, filename=str(SOURCE))
        self.assertNotIn("_newton_refinement(", text)
        self.assertNotIn("solve_bvp", text)
        self.assertNotIn("1.0e-9", text)
        self.assertIn("MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)", text)

    def test_wrong_command_and_immutable_output(self) -> None:
        with self.assertRaisesRegex(M.G2BM1R3Error, "exact_command_required"):
            M._main([])
        raw = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(
            hashlib.sha256(raw).hexdigest(),
            "a38707c616f19160f3b0ea923d86657f487d198c9a7b6a0cfbe506dde2213387",
        )
        self.assertEqual(len(raw), 9_818)
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
            "85638ae9944b0ea60e7290174d8ebf615d7385803b83afe9644fb0676bbdb3af",
        )
        self.assertEqual(observed, expected)


if __name__ == "__main__":
    unittest.main()
