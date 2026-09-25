"""Render a single G1 trial inlist from the hash-pinned zero-transport template.

Only initial_y, initial_z and mixing_length_alpha may vary. This module
returns bytes and hashes; it does not write files or start a solver.
"""

import hashlib
import json
import math
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MODEL = ROOT / "configs/research/controlled-stellar-composition-transport-g1-model-design.v1.json"
PROVENANCE = ROOT / "configs/research/controlled-stellar-composition-transport-g1-installed-provenance.v1.json"
PARAMETER_TO_INLIST = {
    "initial_Y": "initial_y",
    "initial_Z": "initial_z",
    "mixing_length_alpha": "mixing_length_alpha",
}


def render_trial(parameters: dict) -> dict:
    if set(parameters) != set(PARAMETER_TO_INLIST):
        raise ValueError("exactly three G1 calibration parameters are required")
    design = json.loads(MODEL.read_text(encoding="utf-8"))
    provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
    template_path = ROOT / provenance["inlist"]["path"]
    original = template_path.read_bytes()
    original_hash = hashlib.sha256(original).hexdigest()
    if original_hash != provenance["inlist"]["sha256"]:
        raise ValueError("frozen initial inlist hash mismatch")
    checked = {}
    for name in PARAMETER_TO_INLIST:
        value = parameters[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{name} must be numeric")
        value = float(value)
        bounds = design["calibrationParameters"][name]
        if not math.isfinite(value) or not bounds["min"] <= value <= bounds["max"]:
            raise ValueError(f"{name} outside frozen bounds")
        checked[name] = value
    if 1 - checked["initial_Y"] - checked["initial_Z"] <= 0:
        raise ValueError("nonpositive initial hydrogen")
    text = original.decode("ascii")
    for name, key in PARAMETER_TO_INLIST.items():
        # No multiline whitespace in the pattern: never consume the next key.
        pattern = rf"(?im)^([ \t]*{re.escape(key)}[ \t]*=[ \t]*)([^!\r\n]*)([ \t]*(?:![^\r\n]*)?)$"
        rendered = format(checked[name], ".12f").rstrip("0").rstrip(".") + "d0"
        text, count = re.subn(pattern, lambda match: match.group(1) + rendered + match.group(3), text)
        if count != 1:
            raise ValueError(f"expected one {key} assignment; found {count}")
    rendered_bytes = text.encode("ascii")
    return {
        "schemaVersion": "g1-trial-inlist-render/1",
        "templateSha256": original_hash,
        "trialSha256": hashlib.sha256(rendered_bytes).hexdigest(),
        "parameters": checked,
        "inlistBytes": rendered_bytes,
        "launchAllowed": False,
    }
