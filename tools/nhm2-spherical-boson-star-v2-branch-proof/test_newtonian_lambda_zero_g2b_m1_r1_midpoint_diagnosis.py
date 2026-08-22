"""Pre-execution tests for the G2B-M1-R1 midpoint diagnosis."""

from __future__ import annotations

import ast
import importlib.util
from pathlib import Path
import struct
import sys
import unittest


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_r1_midpoint_diagnosis.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m1_r1_diagnosis", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("diagnosis_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)


class G2BM1R1DiagnosisTests(unittest.TestCase):
    def test_failed_receipt_is_exact_and_self_hashed(self) -> None:
        value = M._load_failed_receipt()
        self.assertEqual(value["receiptSha256"], M.FAILED_RECEIPT_SELF_SHA256)

    def test_polynomial_corpus_is_exact(self) -> None:
        self.assertEqual(M._polynomial(0, 3.0), (1.0, 0.0, 0.0))
        self.assertEqual(M._polynomial(1, 3.0), (3.0, 1.0, 0.0))
        self.assertEqual(M._polynomial(2, 3.0), (9.0, 6.0, 2.0))
        self.assertEqual(M._polynomial(3, 3.0), (27.0, 27.0, 18.0))

    def test_frozen_diagnosis_selects_only_repair(self) -> None:
        result = M._diagnose()
        self.assertEqual(
            result["decision"], "REPAIR_GLOBAL_BINARY64_MIDPOINT_SCREEN"
        )
        self.assertEqual(result["meshNodeCount"], 8_193)
        self.assertTrue(result["noCandidateStateRead"])
        self.assertTrue(result["noCandidateSolve"])
        self.assertFalse(any(result["authorityLocks"].values()))
        self.assertGreater(
            struct.unpack(
                ">d", bytes.fromhex(result["firstFailure"]["errorF64Hex"])
            )[0],
            M.LIMIT,
        )

    def test_wrong_command_and_existing_output_are_fail_closed(self) -> None:
        with self.assertRaisesRegex(
            M.G2BM1R1DiagnosisError, "diagnosis_exact_command_required"
        ):
            M._main([])
        self.assertFalse(M.OUTPUT_PATH.exists())

    def test_static_surface_has_no_numerical_solver_or_network(self) -> None:
        raw = SOURCE.read_bytes()
        tree = ast.parse(raw, filename=str(SOURCE))
        imports = {
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.Import)
            for alias in node.names
        }
        for forbidden in ("numpy", "scipy", "gmpy2", "socket", "requests"):
            self.assertNotIn(forbidden, imports)
        text = raw.decode("utf-8")
        self.assertNotIn("_newton_refinement(", text)
        self.assertNotIn("_materialize_state_rows(", text)


if __name__ == "__main__":
    unittest.main()
