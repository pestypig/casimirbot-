"""Read-only MESA history normalization for a future G1 trial extractor.

This module does not infer successful evolution or perform calibration. MESA
appends restarted rows; a repeated model number supersedes that model and all
later rows from the old branch.
"""

import math


MESA_LSUN_W = 3.828e26
MESA_RSUN_M = 6.957e8


def _parse_float(token: str, label: str) -> float:
    try:
        value = float(token.replace("D", "E").replace("d", "e"))
    except ValueError as exc:
        raise ValueError(f"invalid {label}") from exc
    if not math.isfinite(value):
        raise ValueError(f"nonfinite {label}")
    return value


def parse_history(text: str) -> dict:
    """Return the active branch of a MESA history, with no science admission.

    Locate the numbered column header instead of assuming the optional MESA
    metadata header occupies a fixed number of lines. Fail closed on malformed
    rows and ambiguous duplicate field names.
    """
    lines = [(number, line.split()) for number, line in
             enumerate(text.splitlines(), 1) if line.strip()]
    found = []
    for i in range(len(lines) - 1):
        numbered = lines[i][1]
        names = lines[i + 1][1]
        if (len(numbered) == len(names) and len(numbered) >= 2 and
                numbered == [str(n) for n in range(1, len(numbered) + 1)] and
                "model_number" in names and "star_age" in names):
            found.append(i)
    if len(found) != 1:
        raise ValueError("expected one unambiguous MESA history column header")
    header = found[0]
    names = lines[header + 1][1]
    if len(names) != len(set(names)):
        raise ValueError("duplicate MESA history column names")
    active: dict[int, dict[str, float]] = {}
    restarts = 0
    for line_number, parts in lines[header + 2:]:
        if len(parts) != len(names):
            raise ValueError(f"history line {line_number}: column count mismatch")
        row = {name: _parse_float(token, f"history line {line_number} {name}")
               for name, token in zip(names, parts)}
        model = row["model_number"]
        if model < 1 or not model.is_integer():
            raise ValueError(f"history line {line_number}: invalid model number")
        if row["star_age"] < 0:
            raise ValueError(f"history line {line_number}: negative age")
        model_number = int(model)
        obsolete = [number for number in active if number >= model_number]
        if obsolete:
            restarts += 1
            for number in obsolete:
                del active[number]
        if active and row["star_age"] < active[max(active)]["star_age"]:
            raise ValueError(f"history line {line_number}: age regressed on active branch")
        active[model_number] = row
    if not active:
        raise ValueError("MESA history has no model rows")
    return {
        "schemaVersion": "g1-mesa-history-extract/1",
        "status": "DIAGNOSTIC_HISTORY_ONLY",
        "columns": names,
        "activeRowCount": len(active),
        "supersededBranchCount": restarts,
        "terminalRow": active[max(active)],
        "admissionAllowed": False,
        "limitations": "No solver-exit, inlist, age-target, units, convergence, profile or source check",
    }


def calibration_observables_from_terminal(history: dict) -> dict:
    """Extract three numeric fit inputs only from explicitly named outputs.

    The standard MESA history does not contain surface_Z_div_X, so this
    intentionally fails until a verified custom output or extraction path
    supplies that exact field. It does not establish model completion.
    """
    if history.get("schemaVersion") != "g1-mesa-history-extract/1":
        raise ValueError("unrecognized G1 history extraction")
    row = history.get("terminalRow")
    if not isinstance(row, dict):
        raise ValueError("missing terminal history row")
    required = ("luminosity_ergs_s", "radius_cm", "surface_Z_div_X")
    if any(key not in row for key in required):
        raise ValueError("missing explicit G1 calibration history column")
    values = [_parse_float(str(row[key]), key) for key in required]
    if any(value <= 0 for value in values):
        raise ValueError("G1 calibration history values must be positive")
    return {"schemaVersion": "g1-mesa-history-observables/1",
            "luminosityW": values[0] * 1e-7,
            "radiusM": values[1] * 1e-2,
            "surfaceZOverX": values[2],
            "admissionAllowed": False,
            "limitations": "No verified custom Z/X producer, solver exit, age or convergence check"}


def calibration_observables_from_history_profile(history: dict, profile: dict) -> dict:
    """Join default MESA outputs by terminal model and age; no admission."""
    if (history.get("schemaVersion") != "g1-mesa-history-extract/1" or
            profile.get("schemaVersion") != "g1-mesa-profile-surface-composition/1"):
        raise ValueError("unrecognized G1 history/profile extraction")
    row = history.get("terminalRow")
    if not isinstance(row, dict) or any(key not in row for key in
                                        ("model_number", "star_age", "log_L", "log_R")):
        raise ValueError("missing default G1 history columns")
    if row["model_number"] != profile.get("modelNumber"):
        raise ValueError("history/profile model number mismatch")
    profile_age = profile.get("starAgeYears")
    if (isinstance(profile_age, bool) or not isinstance(profile_age, (int, float)) or
            not math.isfinite(float(profile_age)) or
            not math.isclose(row["star_age"], profile_age,
                             rel_tol=1e-10, abs_tol=1e-6)):
        raise ValueError("history/profile stellar age mismatch")
    try:
        luminosity = 10 ** row["log_L"] * MESA_LSUN_W
        radius = 10 ** row["log_R"] * MESA_RSUN_M
        ratio = float(profile["surfaceZOverX"])
    except (OverflowError, KeyError, TypeError, ValueError) as exc:
        raise ValueError("invalid G1 history/profile fit values") from exc
    if not all(math.isfinite(value) and value > 0 for value in
               (luminosity, radius, ratio)):
        raise ValueError("nonfinite or nonpositive G1 history/profile fit values")
    return {"schemaVersion": "g1-mesa-default-output-fit-inputs/1",
            "observables": {"luminosityW": luminosity, "radiusM": radius,
                            "surfaceZOverX": ratio},
            "modelNumber": int(row["model_number"]), "starAgeYears": row["star_age"],
            "admissionAllowed": False,
            "limitations": "No solver exit, termination reason, inlist hash, age target, convergence or source admission"}
