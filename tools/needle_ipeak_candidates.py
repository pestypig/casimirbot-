#!/usr/bin/env python3
"""
Emit a compact I_peak / Blumlein bracket table for common Needle loads plus a bus-current snapshot.

Defaults mirror the quick-and-dirty engineering guesses from the pulsed-power note; override with
--scenarios if you want to feed your own CSV of loads (columns: load,E_kJ,L_uH,t_rise_us).
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

import numpy as np
import pandas as pd

DEFAULT_WORKSHEET_CANDIDATES = [
    Path("/mnt/data/needle_Ipeak_worksheet.csv"),
    Path("data/needle_Ipeak_worksheet.csv"),
]

DEFAULT_OUTS = [
    Path("/mnt/data/needle_Ipeak_candidates.csv"),
    Path("data/needle_Ipeak_candidates.csv"),
]

DEFAULT_BUS_OUTS = [
    Path("/mnt/data/needle_bus_current_candidates.csv"),
    Path("data/needle_bus_current_candidates.csv"),
]

DEFAULT_SCENARIOS = [
    ("MIDI coil (conservative)", 5.0, 50.0, 10.0),
    ("MIDI coil (aggressive)", 5.0, 10.0, 10.0),
    ("MIDI coil (high energy)", 10.0, 20.0, 10.0),
    ("Sector panel PFN (tile bank)", 0.5, 1.0, 1.0),
    ("Launcher (LF)", 10.0, 100.0, 20.0),
]

DEFAULT_P_MW = 83.3
DEFAULT_BUS_KV = [10.0, 20.0, 30.0, 40.0]


@dataclass
class Scenario:
    load: str
    E_kJ: float
    L_uH: float
    t_rise_us: float


def v_blu(L_uH: float, I_kA: float, t_us: float) -> float:
    """Blumlein step to reach I_kA in t_us with inductance L_uH (kV)."""
    L = L_uH * 1e-6
    I = I_kA * 1e3
    t = t_us * 1e-6
    if t <= 0 or L <= 0:
        return float("nan")
    return (L * I / t) / 1e3


def i_from_energy(E_kJ: float, L_uH: float) -> float:
    """Current from stored energy and inductance (kA)."""
    L = L_uH * 1e-6
    if L <= 0:
        return float("nan")
    E = E_kJ * 1e3
    return np.sqrt(2 * E / L) / 1e3


def parse_bus_list(raw: str | None, fallback: Sequence[float]) -> List[float]:
    if not raw:
        return list(fallback)
    tokens = [tok.strip() for tok in raw.replace(";", ",").replace("/", ",").split(",") if tok.strip()]
    values = [float(tok) for tok in tokens if _is_number(tok)]
    return values if values else list(fallback)


def _is_number(value: str) -> bool:
    try:
        float(value)
    except ValueError:
        return False
    return True


def load_scenarios(path: str | None) -> List[Scenario]:
    if not path:
        return [Scenario(*row) for row in DEFAULT_SCENARIOS]

    df = pd.read_csv(Path(path))
    for required in ("load", "E_kJ", "L_uH", "t_rise_us"):
        if required not in df.columns:
            raise ValueError(f"Missing required column '{required}' in {path}")

    scenarios: List[Scenario] = []
    for _, row in df.iterrows():
        scenarios.append(
            Scenario(
                load=str(row["load"]),
                E_kJ=float(row["E_kJ"]),
                L_uH=float(row["L_uH"]),
                t_rise_us=float(row["t_rise_us"]),
            )
        )
    return scenarios


def build_candidates(scenarios: Sequence[Scenario]) -> pd.DataFrame:
    rows = []
    for scenario in scenarios:
        I_kA = i_from_energy(scenario.E_kJ, scenario.L_uH)
        V_kV = v_blu(scenario.L_uH, I_kA, scenario.t_rise_us)
        rows.append(
            {
                "load": scenario.load,
                "E_kJ": scenario.E_kJ,
                "L_uH": scenario.L_uH,
                "t_rise_us": scenario.t_rise_us,
                "I_peak_kA": round(I_kA, 3),
                "V_Blumlein_kV": round(V_kV, 3),
            }
        )
    return pd.DataFrame(rows)


def build_bus_table(p_mw: float, bus_kv: Sequence[float]) -> pd.DataFrame:
    p_w = p_mw * 1e6
    rows = []
    for v_kv in bus_kv:
        if v_kv <= 0:
            continue
        i_kA = (p_w / (v_kv * 1e3)) / 1e3
        rows.append({"V_bus_kV": v_kv, "I_avg_bus_kA": round(i_kA, 3)})
    return pd.DataFrame(rows)


def write_csv(df: pd.DataFrame, outputs: Iterable[Path]) -> List[Path]:
    written: List[Path] = []
    for path in outputs:
        path = path.expanduser()
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(path, index=False)
        written.append(path.resolve())
    return written


def locate_worksheet(custom_path: str | None) -> Path | None:
    if custom_path:
        candidate = Path(custom_path).expanduser()
        return candidate if candidate.exists() else None
    for candidate in DEFAULT_WORKSHEET_CANDIDATES:
        if candidate.exists():
            return candidate
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate I_peak bracket table and bus current snapshot.")
    parser.add_argument("--worksheet", help="Optional worksheet CSV path; defaults to /mnt/data then data/ if present.")
    parser.add_argument(
        "-o",
        "--out",
        dest="outputs",
        action="append",
        help="Output path(s) for candidate CSV. Defaults to /mnt/data and data/needle_Ipeak_candidates.csv.",
    )
    parser.add_argument(
        "--bus-out",
        dest="bus_outputs",
        action="append",
        help="Output path(s) for the bus current table. Defaults to /mnt/data and data/needle_bus_current_candidates.csv.",
    )
    parser.add_argument("--bus-kv", help="Comma/space list of DC link voltages in kV (default: 10,20,30,40).")
    parser.add_argument("--p-mw", type=float, default=DEFAULT_P_MW, help="Ship average power in MW (default: 83.3).")
    parser.add_argument(
        "--scenarios",
        help="CSV of scenarios with columns load,E_kJ,L_uH,t_rise_us. If omitted, uses baked-in defaults.",
    )
    parser.add_argument("--skip-bus", action="store_true", help="Skip bus current table generation.")
    args = parser.parse_args()

    worksheet_path = locate_worksheet(args.worksheet)
    if worksheet_path:
        grid = pd.read_csv(worksheet_path)
        print(f"Loaded worksheet grid: {worksheet_path} ({len(grid)} rows)")
    else:
        print("Worksheet grid not found (checked /mnt/data and data/); continuing with baked-in scenarios.")

    scenarios = load_scenarios(args.scenarios)
    candidates = build_candidates(scenarios)

    outputs = [Path(p) for p in (args.outputs or [])] or DEFAULT_OUTS
    written_candidate = write_csv(candidates, outputs)

    print(f"Candidate bracket rows: {len(candidates)}")
    for path in written_candidate:
        print(f"Written candidates: {path}")

    if args.skip_bus:
        return

    bus_kv = parse_bus_list(args.bus_kv, DEFAULT_BUS_KV)
    bus_table = build_bus_table(args.p_mw, bus_kv)
    bus_outputs = [Path(p) for p in (args.bus_outputs or [])] or DEFAULT_BUS_OUTS
    written_bus = write_csv(bus_table, bus_outputs)

    print(f"Bus voltages: {', '.join(str(v) for v in bus_kv)} kV @ P_avg={args.p_mw} MW")
    for path in written_bus:
        print(f"Written bus table: {path}")


if __name__ == "__main__":
    main()
