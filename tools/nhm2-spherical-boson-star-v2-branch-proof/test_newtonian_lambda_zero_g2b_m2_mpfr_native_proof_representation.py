"""Tests for the completed G2B-M2 MPFR-native representation."""

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
    "newtonian_lambda_zero_g2b_m2_mpfr_native_proof_representation.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m2", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m2_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)


class G2BM2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = M._load_engine()

    def test_frozen_bindings_and_ladders(self) -> None:
        M._verify(M.PACKET_PATH, M.PACKET_SIZE_BYTES, M.PACKET_SHA256, "packet")
        M._verify_r3()
        self.assertEqual(M.SOLVE_REFINEMENTS, (4, 8))
        self.assertEqual(M.MATERIALIZATION_REFINEMENTS, (8, 16, 32))
        self.assertEqual(M.MODE_COUNTS, (128, 256, 512))
        self.assertEqual(M.MARGIN, Fraction(1, 4 * 10**10))
        self.assertEqual(M.JET_AGREEMENT_LIMIT, Fraction(1, 2**60))

    def test_quintic_reproduces_an_exact_degree_five_polynomial(self) -> None:
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

    def test_center_residual_is_exact_and_independent_of_ode_rhs(self) -> None:
        u = Fraction(2)
        ux = Fraction(3)
        potential = Fraction(5)
        nu = Fraction(7)
        uxx = 2 * (potential - nu) * u - 2 * ux / M.POINT_X
        jet = (u, ux, uxx, potential, Fraction(11), Fraction(13))
        self.assertEqual(M._center_residual(jet, nu), 0)
        perturbed = (u, ux, uxx + 1, potential, Fraction(11), Fraction(13))
        self.assertGreater(M._center_residual(perturbed, nu), 0)

    def test_mpfr_dyadic_codec_is_exact_and_canonical(self) -> None:
        with self.engine._mpfr_context():
            value = self.engine.gmpy2.mpfr(-40) / 32
            self.assertEqual(M._fraction(value), Fraction(-5, 4))
            self.assertEqual(
                M._dyadic(value),
                {
                    "encoding": "canonical_exact_dyadic",
                    "exponent2": -2,
                    "mantissaHex": "-5",
                    "sourcePrecisionBits": 256,
                },
            )

    def test_mpfr_dct_i_reconstructs_constant_and_linear_samples(self) -> None:
        with self.engine._mpfr_context():
            denominator = 7
            pi = self.engine.gmpy2.const_pi()
            nodes = tuple(
                (1 - self.engine.gmpy2.cos(pi * index / denominator)) / 2
                for index in range(denominator + 1)
            )
            constant = tuple(self.engine.gmpy2.mpfr(3) for _ in nodes)
            linear = tuple(2 * node - 1 for node in nodes)
            for values in (constant, linear):
                coefficients = M._dct(self.engine, values)
                errors = tuple(
                    abs(M._mpfr_evaluate(self.engine, coefficients, node) - value)
                    for node, value in zip(nodes, values, strict=True)
                )
                self.assertLessEqual(max(errors), self.engine.gmpy2.exp2(-240))

    def test_static_surface_preserves_rails_and_non_tautology(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        ast.parse(text, filename=str(SOURCE))
        self.assertIn("POINT_X: Final[Fraction] = Fraction(1, 128)", text)
        self.assertIn("MARGIN: Final[Fraction] = Fraction(1, 4 * 10**10)", text)
        self.assertIn("MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)", text)
        center_body = text[
            text.index("def _center_jet(") : text.index("def _center_residual(")
        ]
        self.assertNotIn("_center_residual", center_body)
        self.assertNotIn("solve_bvp", text)

    def test_source_and_packet_are_content_addressed(self) -> None:
        self.assertEqual(
            hashlib.sha256(M.PACKET_PATH.read_bytes()).hexdigest(),
            M.PACKET_SHA256,
        )
        self.assertEqual(
            hashlib.sha256(M.ENGINE_PATH.read_bytes()).hexdigest(),
            M.ENGINE_SHA256,
        )

    def test_wrong_command_and_immutable_failure_receipt(self) -> None:
        with self.assertRaisesRegex(M.G2BM2Error, "exact_command_required"):
            M._main([])
        raw = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(
            hashlib.sha256(raw).hexdigest(),
            "9ab9ef772af00e7d2b130eb3319058a70514389995fdda5099985b1088087df8",
        )
        self.assertEqual(len(raw), 3_020)
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
            "bd0dcd77a870c412d1211507be3ea56f8c7a3cf027125a84a158c16e873bc448",
        )
        self.assertEqual(observed, expected)
        self.assertEqual(
            receipt["decision"], "MPFR_NATIVE_SOLVE_OR_REFINEMENT_FAILED"
        )
        self.assertEqual(
            receipt["firstFailure"],
            {
                "code": "g2b_m2_center_refinement_disagreement",
                "detail": "",
                "stage": "center_materialization",
            },
        )


if __name__ == "__main__":
    unittest.main()
