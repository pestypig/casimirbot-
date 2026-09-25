"""Read-only MESA r24.03.1 profile composition extraction for G1.

The default profile contains total H, He and metal mass fractions. Zone 1 is
the surface zone. This module reports its Z/X without asserting that the
profile belongs to a completed or accepted model.
"""

import math


FIELDS = ("zone", "x_mass_fraction_H", "y_mass_fraction_He",
          "z_mass_fraction_metals")


def surface_composition_from_profile(text: str) -> dict:
    lines = [(number, line.split()) for number, line in
             enumerate(text.splitlines(), 1) if line.strip()]
    candidates = []
    for i in range(len(lines) - 1):
        numbers, names = lines[i][1], lines[i + 1][1]
        if (len(numbers) == len(names) and len(numbers) >= len(FIELDS) and
                numbers == [str(n) for n in range(1, len(numbers) + 1)] and
                all(name in names for name in FIELDS)):
            candidates.append(i)
    if len(candidates) != 1:
        raise ValueError("expected one unambiguous MESA profile zone header")
    zone_header = candidates[0]
    names = lines[zone_header + 1][1]
    if len(names) != len(set(names)):
        raise ValueError("duplicate MESA profile column names")
    metadata = []
    for i in range(zone_header - 1):
        header_names = lines[i][1]
        if {"model_number", "num_zones", "star_age"}.issubset(header_names):
            metadata.append(i)
    if len(metadata) != 1:
        raise ValueError("expected one MESA profile model metadata header")
    metadata_names = lines[metadata[0]][1]
    metadata_values = lines[metadata[0] + 1][1]
    if len(metadata_names) != len(metadata_values):
        raise ValueError("MESA profile metadata column count mismatch")
    try:
        model = float(metadata_values[metadata_names.index("model_number")])
        zones = float(metadata_values[metadata_names.index("num_zones")])
        age = float(metadata_values[metadata_names.index("star_age")])
    except ValueError as exc:
        raise ValueError("invalid MESA profile metadata") from exc
    if (not all(math.isfinite(value) for value in (model, zones, age)) or
            model < 1 or not model.is_integer() or zones < 1 or
            not zones.is_integer() or age < 0):
        raise ValueError("invalid MESA profile model number, zone count or age")
    zone_rows = lines[zone_header + 2:]
    if len(zone_rows) != int(zones):
        raise ValueError("MESA profile zone count mismatch")
    zone_index = names.index("zone")
    for expected_zone, (line_number, parts) in enumerate(zone_rows, 1):
        if len(parts) != len(names):
            raise ValueError(f"profile line {line_number}: column count mismatch")
        try:
            observed_zone = float(parts[zone_index])
        except ValueError as exc:
            raise ValueError(f"profile line {line_number}: invalid zone") from exc
        if observed_zone != expected_zone:
            raise ValueError(f"profile line {line_number}: nonsequential zone")
    first_line, first = zone_rows[0]
    selected = {}
    for field in FIELDS:
        try:
            value = float(first[names.index(field)].replace("D", "E").replace("d", "e"))
        except ValueError as exc:
            raise ValueError(f"profile line {first_line}: invalid {field}") from exc
        if not math.isfinite(value):
            raise ValueError(f"profile line {first_line}: nonfinite {field}")
        selected[field] = value
    if selected["zone"] != 1:
        raise ValueError("first MESA profile zone must be surface zone 1")
    x, y, z = (selected["x_mass_fraction_H"],
               selected["y_mass_fraction_He"],
               selected["z_mass_fraction_metals"])
    if x <= 0 or y < 0 or z < 0 or any(value > 1 for value in (x, y, z)):
        raise ValueError("invalid surface mass fractions")
    if abs(x + y + z - 1) > 1e-6:
        raise ValueError("surface mass fractions do not close")
    return {"schemaVersion": "g1-mesa-profile-surface-composition/1",
            "surfaceX": x, "surfaceY": y, "surfaceZ": z,
            "surfaceZOverX": z / x,
            "zone": 1, "modelNumber": int(model), "starAgeYears": age,
            "numZones": int(zones), "admissionAllowed": False,
            "limitations": "No solver-exit, inlist, profile/history identity or observational admission check"}
