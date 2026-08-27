from __future__ import annotations

import importlib.util
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_cost_model.py"
SPEC = importlib.util.spec_from_file_location("h2_cost_model", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
MODEL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODEL)


class H2CostModelTests(unittest.TestCase):
    def test_exact_worst_case_counts(self) -> None:
        payload = MODEL.projection(None, 2)
        self.assertEqual(payload["cumulative_subpanels_per_selector"], 131071)
        self.assertEqual(payload["elementary_convolutions_per_selector"], 5636053)
        self.assertEqual(payload["cumulative_subpanels"], 262142)
        self.assertEqual(payload["elementary_convolutions"], 11272106)
        self.assertEqual(payload["status"], "STRUCTURAL_ONLY")

    def test_calibrated_projection(self) -> None:
        payload = MODEL.projection(0.25, 1)
        self.assertAlmostEqual(payload["projected_seconds"], 32767.75)
        self.assertFalse(payload["projection_is_authority"])

    def test_authority_stays_false(self) -> None:
        payload = MODEL.projection(None, 2)
        self.assertEqual(payload["candidate_evaluations"], 0)
        self.assertFalse(payload["candidate_roots_created"])
        self.assertFalse(payload["scientific_handler_linked"])
        self.assertFalse(payload["authority_promoted"])


if __name__ == "__main__":
    unittest.main()
