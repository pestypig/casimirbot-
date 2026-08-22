"""Pre-execution tests for the G2B-M5 sole tail-power API repair."""

from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
import unittest


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m5_tail_power_api_repair.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m5", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m5_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)

RECEIPT_RAW_SHA256 = (
    "0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf"
)
RECEIPT_SIZE_BYTES = 309_486
RECEIPT_SELF_SHA256 = (
    "646e41b4cad522fb3aecb1d9e6413a4c7f627732b1a9fd8cac606d6796dc8e0d"
)


class G2BM5Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m4 = M._load_m4()
        cls.m4_receipt = M._verify_m4_receipt(cls.m4)
        cls.m3 = cls.m4._load_m3()
        cls.m3_receipt = cls.m4._verify_m3_receipt(cls.m3)
        cls.m2 = cls.m3._load_module(
            cls.m3.M2_SOURCE_PATH,
            "g2b_m5_test_m2",
            cls.m3.M2_SOURCE_SIZE_BYTES,
            cls.m3.M2_SOURCE_SHA256,
        )
        cls.engine = cls.m2._load_engine()

    def test_frozen_packet_prior_failure_and_unchanged_ladders(self) -> None:
        M._verify(M.PACKET_PATH, M.PACKET_SIZE_BYTES, M.PACKET_SHA256, "packet")
        self.assertEqual(
            self.m4_receipt["firstFailure"]["detail"], "AttributeError"
        )
        self.assertIsNone(self.m4_receipt["projectionRecords"])
        self.assertEqual(M.SELECTED_SUBSTEPS, 256)
        self.assertEqual(M.SOLVE_REFINEMENTS, (4, 8))
        self.assertEqual(M.MODE_COUNTS, (128, 256, 512))

    def test_bound_gmpy2_has_no_module_pow_but_mpfr_power_works(self) -> None:
        self.assertFalse(hasattr(self.engine.gmpy2, "pow"))
        with self.engine._mpfr_context():
            ratio = self.engine.gmpy2.mpfr(2)
            exponent = self.engine.gmpy2.mpfr("0.5")
            observed = ratio**exponent
            self.assertTrue(self.engine.gmpy2.is_finite(observed))
            self.assertGreater(observed, 1)

    def test_corrected_tail_is_finite_and_matches_the_frozen_expression(self) -> None:
        with self.engine._mpfr_context():
            one = self.engine.gmpy2.mpfr(1)
            radius = self.engine.gmpy2.mpfr(32)
            x = self.engine.gmpy2.mpfr(64)
            mass = self.engine.gmpy2.mpfr(2)
            kappa = self.engine.gmpy2.mpfr("0.5")
            sigma = self.engine.gmpy2.mpfr("1.25")
            u, potential = M._tail_value(
                self.engine, one, mass, kappa, sigma, x, radius
            )
            expected = self.engine.gmpy2.exp(-kappa * (x - radius))
            expected *= (x / radius) ** sigma
            self.assertEqual(u, expected)
            self.assertEqual(potential, -mass / x)

    def test_static_delta_contains_supported_operator_and_no_module_pow(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        ast.parse(text, filename=str(SOURCE))
        self.assertIn("u *= ratio**sigma", text)
        self.assertNotIn("gmpy2.pow", text)
        self.assertNotIn(".pow(", text)
        self.assertIn("MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)", text)
        self.assertIn("SELECTED_SUBSTEPS: Final[int] = 256", text)

    def test_projection_ladder_is_an_ast_exact_copy_of_m2(self) -> None:
        def function(tree: ast.Module, name: str) -> ast.FunctionDef:
            return next(
                node
                for node in tree.body
                if isinstance(node, ast.FunctionDef) and node.name == name
            )

        m2_tree = ast.parse(self.m3.M2_SOURCE_PATH.read_text(encoding="utf-8"))
        m5_tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
        expected = function(m2_tree, "_projection_ladder")
        observed = function(m5_tree, "_corrected_projection_ladder")
        observed.args.args = observed.args.args[1:]
        expected.name = observed.name = "_projection_ladder"

        class Normalize(ast.NodeTransformer):
            def visit_Attribute(self, node: ast.Attribute) -> ast.AST:
                node = self.generic_visit(node)
                if isinstance(node.value, ast.Name) and node.value.id == "m2":
                    return ast.copy_location(
                        ast.Name(id=node.attr, ctx=node.ctx), node
                    )
                return node

            def visit_Call(self, node: ast.Call) -> ast.AST:
                node = self.generic_visit(node)
                if (
                    isinstance(node.func, ast.Name)
                    and node.func.id == "_corrected_profile"
                ):
                    node.func.id = "_profile"
                    node.args = node.args[1:]
                return node

        observed = Normalize().visit(observed)
        ast.fix_missing_locations(observed)
        self.assertEqual(
            ast.dump(observed, include_attributes=False),
            ast.dump(expected, include_attributes=False),
        )

    def test_selected_center_remains_the_exact_m3_observation(self) -> None:
        selected = self.m4._selected_observation(self.m3_receipt)
        self.assertEqual(selected["ordinal"], 3)
        self.assertEqual(selected["substepsPerOutputInterval"], 256)
        self.assertEqual(len(selected["jet"]), 6)

    def test_all_dependency_bytes_are_pinned(self) -> None:
        for path, digest in (
            (M.PACKET_PATH, M.PACKET_SHA256),
            (M.M4_SOURCE_PATH, M.M4_SOURCE_SHA256),
            (M.M4_RECEIPT_PATH, M.M4_RECEIPT_RAW_SHA256),
        ):
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), digest)

    def test_wrong_command_and_postexecution_receipt_is_immutable(self) -> None:
        with self.assertRaisesRegex(M.G2BM5Error, "exact_command_required"):
            M._main([])
        raw = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(len(raw), RECEIPT_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), RECEIPT_RAW_SHA256)
        root = json.loads(raw)
        unsigned = {key: value for key, value in root.items() if key != "receiptSha256"}
        canonical = json.dumps(
            unsigned,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
        observed = hashlib.sha256(
            M.RECEIPT_DOMAIN + struct.pack("<Q", len(canonical)) + canonical
        ).hexdigest()
        self.assertEqual(observed, RECEIPT_SELF_SHA256)
        self.assertEqual(root["receiptSha256"], RECEIPT_SELF_SHA256)
        self.assertEqual(root["decision"], "MPFR_PROJECTION_SELECTED")
        self.assertEqual(root["selectedModeCount"], 128)
        self.assertIsNone(root.get("firstFailure"))
        self.assertEqual(
            [record["modeCount"] for record in root["projectionRecords"]],
            [128, 256, 512],
        )
        self.assertTrue(all(record["eligible"] for record in root["projectionRecords"]))


if __name__ == "__main__":
    unittest.main()
