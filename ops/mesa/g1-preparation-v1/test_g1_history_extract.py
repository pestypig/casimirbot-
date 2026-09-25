"""Synthetic, no-solver tests for MESA history restart handling."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("g1_history_extract.py")
spec = importlib.util.spec_from_file_location("g1_history_extract", SCRIPT)
extract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract)


class HistoryExtractTests(unittest.TestCase):
    def test_restart_supersedes_old_terminal_rows(self):
        history = """1 2\nversion_number initial_mass\n24.03.1 1.0\n
1 2 3 4\nmodel_number star_age log_L log_R\n1 0 0.0 0.0\n2 1e9 0.1 0.1\n3 2e9 0.9 0.9\n2 1.1e9 0.2 0.2\n3 2.1e9 0.3 0.3\n"""
        result = extract.parse_history(history)
        self.assertEqual(result["activeRowCount"], 3)
        self.assertEqual(result["supersededBranchCount"], 1)
        self.assertEqual(result["terminalRow"]["log_L"], 0.3)
        self.assertFalse(result["admissionAllowed"])

    def test_bad_rows_fail_closed(self):
        base = "1 2 3\nmodel_number star_age log_L\n1 0 0\n"
        for bad in ("2 1e9", "2 1e9 nan", "2 -1 0", "2.5 1e9 0",
                    "2 1d8 0\n3 1d7 0"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                extract.parse_history(base + bad + "\n")

    def test_header_ambiguity_and_empty_history_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "unambiguous"):
            extract.parse_history("model_number star_age\n1 0\n")
        with self.assertRaisesRegex(ValueError, "no model rows"):
            extract.parse_history("1 2\nmodel_number star_age\n")
        with self.assertRaisesRegex(ValueError, "duplicate"):
            extract.parse_history("1 2 3\nmodel_number star_age star_age\n1 0 0\n")

    def test_three_fit_observables_require_explicit_cgs_and_z_over_x_columns(self):
        default_like = extract.parse_history(
            "1 2 3 4\nmodel_number star_age log_L log_R\n1 4.57e9 0 0\n")
        with self.assertRaisesRegex(ValueError, "missing explicit"):
            extract.calibration_observables_from_terminal(default_like)
        complete = extract.parse_history(
            "1 2 3 4 5\nmodel_number star_age luminosity_ergs_s radius_cm surface_Z_div_X\n"
            "1 4.57e9 3.828e33 6.957e10 0.02292\n")
        values = extract.calibration_observables_from_terminal(complete)
        self.assertAlmostEqual(values["luminosityW"], 3.828e26)
        self.assertAlmostEqual(values["radiusM"], 6.957e8)
        self.assertEqual(values["surfaceZOverX"], 0.02292)
        self.assertFalse(values["admissionAllowed"])
        with self.assertRaisesRegex(ValueError, "positive"):
            extract.calibration_observables_from_terminal(
                dict(complete, terminalRow=dict(complete["terminalRow"],
                                               surface_Z_div_X=0)))

    def test_default_history_and_final_profile_join_requires_matching_identity(self):
        history = extract.parse_history(
            "1 2 3 4\nmodel_number star_age log_L log_R\n42 4.57e9 0 0\n")
        profile = {"schemaVersion": "g1-mesa-profile-surface-composition/1",
                   "modelNumber": 42, "starAgeYears": 4.57e9,
                   "surfaceZOverX": 0.02292}
        joined = extract.calibration_observables_from_history_profile(history, profile)
        self.assertEqual(joined["observables"],
                         {"luminosityW": 3.828e26, "radiusM": 6.957e8,
                          "surfaceZOverX": 0.02292})
        self.assertFalse(joined["admissionAllowed"])
        with self.assertRaisesRegex(ValueError, "model number mismatch"):
            extract.calibration_observables_from_history_profile(
                history, dict(profile, modelNumber=43))
        with self.assertRaisesRegex(ValueError, "stellar age mismatch"):
            extract.calibration_observables_from_history_profile(
                history, dict(profile, starAgeYears=4.56e9))


if __name__ == "__main__":
    unittest.main()
