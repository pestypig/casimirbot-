#!/usr/bin/env python3
"""Versioned H2 profile wrapper that removes the gmon PID assumption."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
V1_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_phase_profile.py"


def load_v1():
    spec = importlib.util.spec_from_file_location("h2_phase_profile_v1_for_v3", V1_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("v1 profiler runner unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    v1 = load_v1()
    v1.PROFILE_IMAGE = "nhm2-g2h-e-s5-c08-h2-phase-profile:v2"
    v1.PROFILE_EXECUTABLE = \
        "/usr/local/bin/mini_boson_star_primary_c08_h2_phase_profile_wrapper_v2.sh"
    v1.CONTAINER = "nhm2-c08-h2-phase-profile-v3-run"

    result = v1.main()

    # V1 has already validated and written the exclusive evidence root. Locate
    # it from argv without changing its parser or numerical execution path.
    import sys
    try:
        index = sys.argv.index("--output-root")
        raw_root = pathlib.Path(sys.argv[index + 1])
        output_root = (ROOT / raw_root).resolve() if not raw_root.is_absolute() \
            else raw_root.resolve()
    except (ValueError, IndexError):
        return result

    repair = {
        "schema": "nhm2.g2h_e_s5.c08_h2_phase_profile_repair.v3",
        "predecessor_failures": [
            "h2-phase-profile-v1-exp0-20260827",
            "h2-phase-profile-v2-exp0-20260827",
        ],
        "sole_repair": "rename_single_gmon_pid_file_without_pid_assumption",
        "profile_image": v1.PROFILE_IMAGE,
        "profile_executable": v1.PROFILE_EXECUTABLE,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    repair_path = output_root / "versioned-repair-v3.json"
    v1.write_text(repair_path,
                  json.dumps(repair, sort_keys=True, separators=(",", ":")) + "\n")
    evidence = sorted(path for path in output_root.iterdir()
                      if path.is_file() and path.name != "evidence.sha256")
    v1.write_text(output_root / "evidence.sha256",
                  "".join(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n"
                          for path in evidence))
    return result


if __name__ == "__main__":
    raise SystemExit(main())
