"""Synthetic no-solver tests for G1 final-profile composition extraction."""

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("g1_profile_extract.py")
spec = importlib.util.spec_from_file_location("g1_profile_extract", SCRIPT)
profile = importlib.util.module_from_spec(spec)
spec.loader.exec_module(profile)


def make_profile(x="0.73", y="0.25", z="0.02", zone="1") -> str:
    return ("1 2 3 4\nversion_number model_number num_zones star_age\n"
            "r24.03.1 20000 2 4.57e9\n\n"
            "1 2 3 4 5\nzone mass x_mass_fraction_H y_mass_fraction_He z_mass_fraction_metals\n"
            f"{zone} 1.0 {x} {y} {z}\n2 0.99 0.72 0.26 0.02\n")


class ProfileExtractTests(unittest.TestCase):
    def test_zone_one_total_metals_over_hydrogen(self):
        result = profile.surface_composition_from_profile(make_profile())
        self.assertAlmostEqual(result["surfaceZOverX"], 0.02 / 0.73)
        self.assertEqual(result["zone"], 1)
        self.assertEqual(result["modelNumber"], 20000)
        self.assertEqual(result["numZones"], 2)
        self.assertFalse(result["admissionAllowed"])

    def test_missing_or_invalid_surface_composition_fails_closed(self):
        cases = (
            ("0", "0.98", "0.02", "1"),
            ("nan", "0.25", "0.02", "1"),
            ("0.73", "0.25", "0.03", "1"),
            ("0.73", "0.25", "0.02", "2"),
        )
        for values in cases:
            with self.subTest(values=values), self.assertRaises(ValueError):
                profile.surface_composition_from_profile(make_profile(*values))
        with self.assertRaisesRegex(ValueError, "zone header"):
            profile.surface_composition_from_profile("1 2\nzone mass\n1 1\n")
        with self.assertRaisesRegex(ValueError, "zone count"):
            profile.surface_composition_from_profile(make_profile().replace("20000 2 4.57e9", "20000 3 4.57e9"))


if __name__ == "__main__":
    unittest.main()
