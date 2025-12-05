#!/usr/bin/env python3
"""
Emit a minimal Needle I_peak worksheet template (columns needed for I_peak, V, and J).

Writes both a repo copy (data/needle_Ipeak_template.csv) and a Colab-friendly path
(/mnt/data/needle_Ipeak_template.csv) unless overridden with --out.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

# Ordered column set required to solve I_peak, V_required, and J.
COLUMNS = [
    "name",
    "class",
    "L_uH",
    "E_pulse_J",
    "t_rise_us",
    "pulse_width_us",
    "rep_rate_hz",
    "di_dt_A_per_us",
    "V_max_kV",
    "L_stray_nH",
    "n_parallel",
    "area_mm2",
    "Jc_A_per_mm2",
]

# Seed rows keep the template non-empty while leaving the numeric fields blank.
SEED_ROWS = [
    {
        "name": "MIDI coil (conservative)",
        "class": "coil",
        "L_uH": 50,
        "E_pulse_J": 5_000,
        "t_rise_us": 10,
        "pulse_width_us": 10,
        "di_dt_A_per_us": 1_414.214,
        "V_max_kV": 80,
        "n_parallel": 4,
        "area_mm2": 8,
        "Jc_A_per_mm2": 1_000,
    },
    {
        "name": "MIDI coil (aggressive)",
        "class": "coil",
        "L_uH": 10,
        "E_pulse_J": 5_000,
        "t_rise_us": 10,
        "pulse_width_us": 10,
        "di_dt_A_per_us": 3_162.278,
        "V_max_kV": 40,
        "n_parallel": 8,
        "area_mm2": 8,
        "Jc_A_per_mm2": 1_000,
    },
    {
        "name": "MIDI coil (high energy)",
        "class": "coil",
        "L_uH": 20,
        "E_pulse_J": 10_000,
        "t_rise_us": 10,
        "pulse_width_us": 10,
        "di_dt_A_per_us": 3_162.278,
        "V_max_kV": 70,
        "n_parallel": 8,
        "area_mm2": 8,
        "Jc_A_per_mm2": 1_000,
    },
    {
        "name": "Sector panel PFN (tile bank)",
        "class": "panel",
        "L_uH": 1,
        "E_pulse_J": 500,
        "t_rise_us": 1,
        "pulse_width_us": 1,
        "di_dt_A_per_us": 31_622.777,
        "V_max_kV": 36,
        "n_parallel": 8,
        "area_mm2": 8,
        "Jc_A_per_mm2": 1_000,
    },
    {
        "name": "Launcher (LF)",
        "class": "launcher",
        "L_uH": 100,
        "E_pulse_J": 10_000,
        "t_rise_us": 20,
        "pulse_width_us": 20,
        "di_dt_A_per_us": 707.107,
        "V_max_kV": 80,
        "n_parallel": 4,
        "area_mm2": 8,
        "Jc_A_per_mm2": 1_000,
    },
]

DEFAULT_OUTPUTS = [
    Path("/mnt/data/needle_Ipeak_template.csv"),  # Colab-style scratch path
    Path("data/needle_Ipeak_template.csv"),  # repo copy
]


def build_template() -> pd.DataFrame:
    df = pd.DataFrame(SEED_ROWS)
    for col in COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA
    return df[COLUMNS]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a minimal Needle I_peak template CSV.")
    parser.add_argument(
        "-o",
        "--out",
        dest="outputs",
        action="append",
        help="Path to write the template (can be given multiple times). Defaults to /mnt/data and data/.",
    )
    return parser.parse_args()


def write_template(df: pd.DataFrame, outputs: list[Path]) -> list[Path]:
    written: list[Path] = []
    for path in outputs:
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(path, index=False)
        written.append(path.resolve())
    return written


def main() -> None:
    args = parse_args()
    outputs = [Path(p).expanduser() for p in (args.outputs or [])]
    if not outputs:
        outputs = DEFAULT_OUTPUTS

    template = build_template()
    written_paths = write_template(template, outputs)

    for path in written_paths:
        print(f"Template written: {path}")
    print(template)


if __name__ == "__main__":
    main()
