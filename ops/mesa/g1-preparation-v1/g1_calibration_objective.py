"""Pure G1 three-target calibration objective; no model execution or optimizer.

This computes only the preregistered numerical fit objective for an externally
supplied trial. Held-out solar observables must not enter the optimizer.
"""

import math
from collections.abc import Mapping


PARAMETERS = ("initial_Y", "initial_Z", "mixing_length_alpha")
TARGETS = {"luminosityW": 3.828e26, "radiusM": 6.957e8,
           "surfaceZOverX": 0.02292}


def _finite_positive(value: object, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be numeric")
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise ValueError(f"{label} must be finite and positive")
    return number


def evaluate_trial(parameters: Mapping, observables: Mapping,
                   model_design: Mapping, acceptance_design: Mapping) -> dict:
    """Evaluate a completed model trial without changing frozen targets."""
    fit = acceptance_design["nominalFit"]
    model_fit = model_design["fit"]
    tolerance = _finite_positive(fit["relativeToleranceEach"], "tolerance")
    if (tolerance != model_fit["relativeNumericalFitToleranceEach"] or
            any(fit[key] != value for key, value in TARGETS.items()) or
            model_fit["quantities"] != ["luminosity", "radius", "surface_Z_over_X"]):
        raise ValueError("frozen G1 fit policy drift")
    if set(parameters) != set(PARAMETERS):
        raise ValueError("trial must contain exactly the three calibration parameters")
    checked = {}
    for key in PARAMETERS:
        value = _finite_positive(parameters[key], key)
        bounds = model_design["calibrationParameters"][key]
        if not bounds["min"] <= value <= bounds["max"]:
            raise ValueError(f"{key} outside frozen search bounds")
        checked[key] = value
    if 1 - checked["initial_Y"] - checked["initial_Z"] <= 0:
        raise ValueError("nonpositive initial hydrogen")
    if set(observables) != set(TARGETS):
        raise ValueError("trial must contain exactly the three fit observables; held-outs are forbidden")
    residuals = {
        key: _finite_positive(observables[key], key) / target - 1
        for key, target in TARGETS.items()
    }
    objective = sum((residual / tolerance) ** 2 for residual in residuals.values())
    return {
        "schemaVersion": "g1-calibration-objective/1",
        "parameters": checked,
        "relativeResiduals": residuals,
        "objective": objective,
        "withinNumericalFitTolerance": all(abs(value) <= tolerance
                                           for value in residuals.values()),
        "admissionAllowed": False,
        "limitations": "Numerical fit only; no MESA run, convergence, held-out observations or G1 admission",
    }
