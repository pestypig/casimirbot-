"""Pre-execution tests for the sole-deletion G2B-M1-R2 runner."""

from __future__ import annotations

import ast
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import Mock


SOURCE = Path(__file__).with_name("newtonian_lambda_zero_g2b_m1_r2_one_shot.py")
SPEC = importlib.util.spec_from_file_location("g2b_m1_r2", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m1_r2_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)


class G2BM1R2Tests(unittest.TestCase):
    def test_proposal_r1_and_old_runner_bindings(self) -> None:
        M._verify(M.PROPOSAL_PATH, M.PROPOSAL_SIZE_BYTES, M.PROPOSAL_SHA256, "p")
        M._verify(M.M1_RUNNER_PATH, M.M1_RUNNER_SIZE_BYTES, M.M1_RUNNER_SHA256, "r")
        M._verify_r1_receipt()

    def test_screen_retains_all_nonmidpoint_requirements(self) -> None:
        runner = M._load_m1_runner()
        engine = runner._load_engine()
        mp = engine.gmpy2.mpfr
        variables = (mp("-1.2"), mp("-0.6"))
        rows = (
            (mp(1), mp("0.5")),
            (mp(0), mp("-0.1")),
            (mp(-1), mp("-0.5")),
            (mp("0.1"), mp("0.2")),
        )
        fake = Mock()
        fake._system.return_value = ((mp(0),), None)
        fake._maximum_absolute.return_value = mp(0)
        fake.gmpy2 = engine.gmpy2
        self.assertEqual(M._screen_without_midpoint(fake, variables, rows), 0)

    def test_static_diff_surface_has_no_midpoint_evaluator(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("_screen_solution(", text)
        self.assertNotIn("_float_hermite_jet(", text)
        self.assertNotIn("MIDPOINT_LIMIT", text)
        self.assertIn("_compare_refinements(", text)
        self.assertIn("_exact_center_residual(", text)
        self.assertIn("_exact_projected_residual(", text)
        ast.parse(text, filename=str(SOURCE))

    def test_wrong_command_and_output_absence(self) -> None:
        with self.assertRaisesRegex(M.G2BM1R2Error, "g2b_m1_r2_exact_command_required"):
            M._main([])
        self.assertFalse(M.OUTPUT_PATH.exists())


if __name__ == "__main__":
    unittest.main()
