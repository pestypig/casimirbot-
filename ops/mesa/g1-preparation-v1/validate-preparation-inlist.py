"""Validate the frozen G1 trial namelist without invoking MESA.

Requires f90nml==1.5.0. This checks syntax and selected scientific invariants;
it cannot replace MESA's own namelist parser or an evolution run.
"""

import hashlib
import json
import argparse
import re
import sys
from pathlib import Path

import f90nml


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def check_default_groups(data: bytes, root: Path) -> int:
    defaults = {
        "star_job": root / "star/defaults/star_job.defaults",
        "controls": root / "star/defaults/controls.defaults",
        "eos": root / "eos/defaults/eos.defaults",
        "kap": root / "kap/defaults/kap.defaults",
    }
    values = {group: path.read_text(encoding="utf-8") for group, path in defaults.items()}
    group = ""
    count = 0
    for line in data.decode("utf-8").splitlines():
        content = line.split("!", 1)[0].strip()
        heading = re.match(r"^&([A-Za-z_][A-Za-z0-9_]*)", content)
        if heading:
            group = heading.group(1).lower()
            continue
        assignment = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)(?:\([^)]*\))?\s*=", content)
        if not assignment:
            continue
        key = assignment.group(1)
        require(group in values, f"populated unknown group: {group}")
        pattern = rf"^\s*{re.escape(key)}(?:\([^)]*\))?\s*="
        require(re.search(pattern, values[group], re.IGNORECASE | re.MULTILINE) is not None,
                f"key absent in pinned {group} defaults: {key}")
        count += 1
    require(count == 73, f"unexpected assignment count: {count}")
    return count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--defaults-root", type=Path, required=True)
    args = parser.parse_args()
    path = Path(__file__).with_name("inlist_project")
    data = path.read_bytes()
    assignment_count = check_default_groups(data, args.defaults_root)
    inlist = f90nml.read(str(path))
    require(set(inlist) == {"star_job", "eos", "kap", "controls", "pgstar"}, "unexpected namelist groups")
    job = inlist["star_job"]
    controls = inlist["controls"]
    kap = inlist["kap"]
    require(job["create_pre_main_sequence_model"] is True, "initial model must be constructed")
    require(job["load_saved_model"] is False, "saved model shortcut is prohibited")
    require(job["change_initial_net"] is True, "network selection is required")
    require(job["new_net_name"] == "pp_and_cno_extras.net", "unexpected network")
    require(job["initial_zfracs"] == 3, "unexpected initial metal mixture")
    require(job["set_initial_age"] is True and job["initial_age"] == 0, "age zero convention changed")
    require(job["new_rotation_flag"] is False, "rotation must be disabled")
    require(controls["initial_mass"] == 1.0, "mass changed")
    require(controls["max_age"] == 4.57e9, "solar age changed")
    require(controls["initial_y"] == 0.27 and controls["initial_z"] == 0.0187, "initial trial changed")
    require(1 - controls["initial_y"] - controls["initial_z"] > 0, "nonpositive initial hydrogen")
    require(controls["mixing_length_alpha"] == 2.0, "initial trial alpha changed")
    require(controls["use_other_d_mix"] is False, "custom transport enabled")
    require(controls["use_other_energy"] is False, "custom energy enabled")
    require(controls["mass_change"] == 0, "mass flow enabled")
    require(controls["am_d_mix_factor"] == 0, "angular momentum mixing enabled")
    require(controls["alpha_semiconvection"] == 0, "semiconvection enabled")
    require(controls["thermohaline_coeff"] == 0, "thermohaline mixing enabled")
    require(controls["overshoot_scheme"] == [""], "overshoot scheme enabled")
    require(controls["overshoot_f"] == [0.0] and controls["overshoot_f0"] == [0.0], "overshoot enabled")
    require(controls["do_element_diffusion"] is True, "ordinary diffusion disabled")
    require(kap["kap_file_prefix"] == "OP_gs98", "high-temperature opacity changed")
    require(kap["kap_lowt_prefix"] == "lowT_fa05_gs98", "low-temperature opacity changed")
    require(kap["use_type2_opacities"] is False, "type-2 opacity changed")
    require(len(inlist["eos"]) == 0, "unexpected EOS override")
    print(json.dumps({
        "schemaVersion": "g1-static-inlist-validation/1",
        "status": "PASS_INDEPENDENT_NAMELIST_PARSE_AND_SELECTED_INVARIANTS",
        "parser": f"f90nml/{f90nml.__version__}",
        "inlistSha256": hashlib.sha256(data).hexdigest(),
        "groups": sorted(inlist),
        "assignmentsCheckedAgainstPinnedDefaultGroups": assignment_count,
        "launchAllowed": False,
        "limitations": "not MESA's parser, installed defaults resolution, model construction or evolution",
    }, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (KeyError, ValueError) as exc:
        print(f"G1 inlist validation failed: {exc}", file=sys.stderr)
        sys.exit(1)
