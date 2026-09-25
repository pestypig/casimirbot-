"""Synthetic and source-bound tests for the sound-speed primary operator."""

import importlib.util
import math
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("g1_sound_speed_operator.py")
spec = importlib.util.spec_from_file_location("g1_sound_speed_operator", SCRIPT)
module = importlib.util.module_from_spec(spec)
import sys
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class SoundSpeedOperatorTests(unittest.TestCase):
    def setUp(self):
        # Unit normalized kernel on [0,1], with a deliberately simple
        # solution row. This tests quadrature independently of author data.
        self.simple = module.SoundSpeedOperator(
            (0.0, 0.5, 1.0),
            ((1.0,), (1.0,), (1.0,)),
            ((0.5, 1.0, 0.5, 0.25, 0.5, 0.75, 0.25, 0.02, 0.001),),
            (0,),
        )

    def test_constant_and_linear_synthetic_profiles(self):
        constant = self.simple.apply_primary_term([0.0, 1.0], [0.01, 0.01])
        self.assertAlmostEqual(constant["rows"][0]["candidateMinusBP04PrimaryKernelTerm"], 0.01)
        self.assertAlmostEqual(constant["rows"][0]["observedMinusPrimaryTerm"], 0.01)
        linear = self.simple.apply_primary_term([0.0, 1.0], [0.0, 1.0])
        self.assertAlmostEqual(linear["rows"][0]["candidateMinusBP04PrimaryKernelTerm"], 0.5)
        self.assertFalse(linear["admissionAllowed"])
        self.assertFalse(linear["crossTermIncluded"])

    def test_missing_support_and_bad_grids_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "full kernel support"):
            self.simple.apply_primary_term([0.01, 1.0], [0.0, 1.0])
        with self.assertRaisesRegex(ValueError, "strictly ascending"):
            self.simple.apply_primary_term([1.0, 0.0], [1.0, 0.0])
        with self.assertRaisesRegex(ValueError, "finite"):
            self.simple.apply_primary_term([0.0, 1.0], [0.0, math.nan])
        with self.assertRaisesRegex(ValueError, "numeric"):
            self.simple.apply_primary_term([0.0, 1.0], [0.0, "1"])

    def test_bp04_coordinate_uses_historical_radius_not_fit_target(self):
        mapped = module.physical_radius_cm_to_bp04_fraction([0, 6.9598e10])
        self.assertEqual(mapped, (0.0, 1.0))
        fit_radius = module.physical_radius_cm_to_bp04_fraction([0, 6.957e10])[-1]
        self.assertAlmostEqual(fit_radius, 0.9995976896, places=9)
        with self.assertRaisesRegex(ValueError, "strictly ascending"):
            module.physical_radius_cm_to_bp04_fraction([1.0, 1.0])
        with self.assertRaisesRegex(ValueError, "finite nonnegative"):
            module.physical_radius_cm_to_bp04_fraction([0, math.nan])

    def test_signed_kernel_lobes_are_retained(self):
        signed = module.SoundSpeedOperator(
            (0.0, 0.5, 1.0),
            ((3.0,), (-1.0,), (3.0,)),
            self.simple.solution_rows,
            (0,),
        )
        self.assertAlmostEqual(signed.integrals()[0], 1.0)
        result = signed.apply_primary_term([0.0, 0.5, 1.0], [0.0, 0.25, 1.0])
        self.assertAlmostEqual(result["rows"][0]["candidateMinusBP04PrimaryKernelTerm"], 0.625)

    def test_tail_weights_keep_signed_and_absolute_mass_distinct(self):
        signed = module.SoundSpeedOperator(
            (0.0, 0.5, 1.0), ((1.0,), (-1.0,), (1.0,)),
            self.simple.solution_rows, (0,))
        tail = signed.tail_weights(0.5)
        self.assertAlmostEqual(tail["signedTail"][0], 0.0)
        self.assertAlmostEqual(tail["absoluteTail"][0], 0.25)
        self.assertFalse(tail["admissionAllowed"])
        with self.assertRaisesRegex(ValueError, "kernel support"):
            signed.tail_weights(1.1)

    @unittest.skipUnless(all((module.INTAKE / name).exists() for name in module.EXPECTED_SHA256),
                         "author files are local and intentionally gitignored")
    def test_real_files_bind_hashes_rows_and_normalization(self):
        author = module.SoundSpeedOperator.from_author_files()
        self.assertEqual(len(author.solution_rows), 76)
        self.assertEqual(len(author.table3_indices), 37)
        self.assertEqual(author.table3_indices[:3], (0, 2, 4))
        self.assertEqual(author.table3_indices[-1], 72)
        self.assertEqual(len(author.kernel_rows_ascending), 2701)
        self.assertEqual(len(author.kernel_rows_ascending[0]), 76)
        self.assertLess(max(abs(value - 1) for value in author.integrals()), 2e-6)

    @unittest.skipUnless(all((module.INTAKE / name).exists() for name in module.EXPECTED_SHA256),
                         "author files are local and intentionally gitignored")
    def test_real_constant_profile_gives_37_diagnostic_primary_terms(self):
        author = module.SoundSpeedOperator.from_author_files()
        low, high = author.radius_ascending[0], author.radius_ascending[-1]
        result = author.apply_primary_term([low, high], [0.002, 0.002])
        self.assertEqual(result["status"], "DIAGNOSTIC_PRIMARY_TERM_ONLY")
        self.assertEqual(len(result["rows"]), 37)
        for row in result["rows"]:
            self.assertLess(abs(row["candidateMinusBP04PrimaryKernelTerm"] - 0.002), 2e-9)
        with self.assertRaisesRegex(ValueError, "full kernel support"):
            author.apply_primary_term([low, 1.0], [0.002, 0.002])

    @unittest.skipUnless(all((module.INTAKE / name).exists() for name in module.EXPECTED_SHA256),
                         "author files are local and intentionally gitignored")
    def test_public_bp04_table_endpoint_leaves_material_kernel_tail(self):
        author = module.SoundSpeedOperator.from_author_files()
        weights = author.tail_weights(0.94676)
        selected = [weights["absoluteTail"][index] for index in author.table3_indices]
        self.assertEqual(sum(value > 0.01 for value in selected), 25)
        self.assertAlmostEqual(selected[-1], 0.9446382099, places=8)
        self.assertFalse(weights["admissionAllowed"])


if __name__ == "__main__":
    unittest.main()
