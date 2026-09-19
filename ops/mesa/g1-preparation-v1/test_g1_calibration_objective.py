"""No-solver tests for the frozen G1 calibration objective."""

import importlib.util
import json
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("g1_calibration_objective.py")
spec = importlib.util.spec_from_file_location("g1_calibration_objective", SCRIPT)
objective = importlib.util.module_from_spec(spec)
spec.loader.exec_module(objective)
ROOT = SCRIPT.resolve().parents[3]
MODEL = json.loads((ROOT / "configs/research/controlled-stellar-composition-transport-g1-model-design.v1.json").read_text(encoding="utf-8"))
ACCEPTANCE = json.loads((ROOT / "configs/research/controlled-stellar-composition-transport-g1-acceptance-design.v1.json").read_text(encoding="utf-8"))
PARAMETERS = {"initial_Y": 0.27, "initial_Z": 0.0187,
              "mixing_length_alpha": 2.0}
OBSERVABLES = dict(objective.TARGETS)


class CalibrationObjectiveTests(unittest.TestCase):
    def evaluate(self, parameters=None, observables=None, model=None, acceptance=None):
        return objective.evaluate_trial(parameters or PARAMETERS,
                                        observables or OBSERVABLES,
                                        model or MODEL, acceptance or ACCEPTANCE)

    def test_exact_targets_are_zero_not_scientific_admission(self):
        result = self.evaluate()
        self.assertEqual(result["objective"], 0)
        self.assertTrue(result["withinNumericalFitTolerance"])
        self.assertFalse(result["admissionAllowed"])

    def test_objective_uses_three_declared_relative_residuals(self):
        changed = dict(OBSERVABLES, luminosityW=OBSERVABLES["luminosityW"] * 1.0002)
        result = self.evaluate(observables=changed)
        self.assertAlmostEqual(result["objective"], 4, places=8)
        self.assertFalse(result["withinNumericalFitTolerance"])

    def test_rejects_out_of_bounds_and_nonfinite_inputs(self):
        with self.assertRaisesRegex(ValueError, "search bounds"):
            self.evaluate(parameters=dict(PARAMETERS, initial_Y=0.33))
        with self.assertRaisesRegex(ValueError, "finite and positive"):
            self.evaluate(observables=dict(OBSERVABLES, radiusM=float("nan")))

    def test_held_out_observable_cannot_enter_fit(self):
        with self.assertRaisesRegex(ValueError, "held-outs are forbidden"):
            self.evaluate(observables=dict(OBSERVABLES, surfaceHelium=0.2485))

    def test_policy_drift_fails_closed(self):
        changed = dict(ACCEPTANCE, nominalFit=dict(ACCEPTANCE["nominalFit"],
                                                    radiusM=6.96e8))
        with self.assertRaisesRegex(ValueError, "policy drift"):
            self.evaluate(acceptance=changed)


if __name__ == "__main__":
    unittest.main()
