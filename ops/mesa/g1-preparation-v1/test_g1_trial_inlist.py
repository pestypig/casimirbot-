"""Check the rendered trial changes exactly the three permitted assignments."""

import importlib.util
import re
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("g1_trial_inlist.py")
spec = importlib.util.spec_from_file_location("g1_trial_inlist", SCRIPT)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)


class TrialInlistTests(unittest.TestCase):
    def test_only_three_assignments_change(self):
        trial = module.render_trial({"initial_Y": 0.28, "initial_Z": 0.019,
                                     "mixing_length_alpha": 2.1})
        original = (module.ROOT / "ops/mesa/g1-preparation-v1/inlist_project").read_text(encoding="ascii")
        changed = trial["inlistBytes"].decode("ascii")
        old_lines, new_lines = original.splitlines(), changed.splitlines()
        self.assertEqual(len(old_lines), len(new_lines))
        differences = [(old, new) for old, new in zip(old_lines, new_lines) if old != new]
        self.assertEqual(len(differences), 3)
        keys = [re.match(r"\s*(\w+)\s*=", new).group(1).lower() for _, new in differences]
        self.assertEqual(keys, ["initial_y", "initial_z", "mixing_length_alpha"])
        self.assertIn("initial_y = 0.28d0", changed)
        self.assertIn("initial_z = 0.019d0", changed)
        self.assertIn("mixing_length_alpha = 2.1d0", changed)
        self.assertFalse(trial["launchAllowed"])
        self.assertNotEqual(trial["templateSha256"], trial["trialSha256"])

    def test_bounds_and_extra_parameter_fail(self):
        baseline = {"initial_Y": 0.27, "initial_Z": 0.0187,
                    "mixing_length_alpha": 2.0}
        with self.assertRaisesRegex(ValueError, "frozen bounds"):
            module.render_trial(dict(baseline, initial_Z=0.031))
        with self.assertRaisesRegex(ValueError, "exactly three"):
            module.render_trial(dict(baseline, use_other_d_mix=True))
        with self.assertRaisesRegex(ValueError, "numeric"):
            module.render_trial(dict(baseline, initial_Y=True))


if __name__ == "__main__":
    unittest.main()
