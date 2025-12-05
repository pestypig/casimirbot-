#!/usr/bin/env python3
"""
Fill a Needle I_peak worksheet/template with derived amps, volts, and current density checks.

Mirrors the front-end heuristics (NeedleIpeakWorksheetPanel) so CLI runs match the UI fill:
- Accepts a CSV with any reasonable column names for L/E/t_rise/di/dt/V_max and conductor geometry.
- Emits a filled CSV with I_peak, V_required, J, and a 'needs' column listing missing inputs.
"""

from __future__ import annotations

import argparse
import csv
import io
import math
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

OUTPUT_COLUMNS = [
    "name",
    "L_H",
    "E_pulse_J",
    "t_rise_s",
    "pulse_width_s",
    "rep_rate_hz",
    "di_dt_A_per_s",
    "I_peak_A",
    "I_peak_method",
    "V_required_kV",
    "V_max_kV",
    "L_total_uH",
    "J_A_per_mm2",
    "J_over_Jc",
    "N_parallel",
    "area_mm2",
    "Jc_A_per_mm2",
    "I_rms_A_est",
    "needs",
]

DEFAULT_INPUT = Path("data/needle_Ipeak_template.csv")
DEFAULT_OUTPUTS = [
    Path("/mnt/data/needle_Ipeak_filled.csv"),  # Colab-style scratch path
    Path("data/needle_Ipeak_filled.csv"),  # Repo copy
]


@dataclass
class ParsedRow:
    index: int
    raw: Dict[str, str]
    normalized: Dict[str, str]


def normalize_key(key: str) -> str:
    replaced = re.sub(r"[AæI¬]", "u", key)
    replaced = re.sub(r"[^a-zA-Z0-9]+", "_", replaced)
    return replaced.strip("_").lower()


def detect_delimiter(lines: List[str]) -> str:
    sample = lines[:5]
    candidates = [",", ";", "\t", "|"]
    best = ","
    best_score = -1
    for candidate in candidates:
        score = sum(line.count(candidate) for line in sample)
        if score > best_score:
            best_score = score
            best = candidate
    return best


def parse_worksheet(path: Path) -> Tuple[List[str], List[ParsedRow], str]:
    text = path.read_text(encoding="utf-8").replace("\ufeff", "").strip()
    if not text:
        return [], [], ","

    lines = [line for line in text.splitlines() if line.strip()]
    delimiter = detect_delimiter(lines)
    reader = csv.reader(lines, delimiter=delimiter)
    rows = list(reader)
    if not rows:
        return [], [], delimiter

    headers = rows[0]
    parsed_rows: List[ParsedRow] = []
    for idx, cells in enumerate(rows[1:]):
        if not any(str(cell).strip() for cell in cells):
            continue
        raw = {headers[i]: (cells[i] if i < len(cells) else "") for i in range(len(headers))}
        normalized: Dict[str, str] = {}
        for key, value in raw.items():
            norm = normalize_key(key)
            if not norm:
                continue
            trimmed = str(value).strip()
            if norm in normalized and normalized[norm]:
                continue
            normalized[norm] = trimmed
        parsed_rows.append(ParsedRow(index=idx, raw=raw, normalized=normalized))

    return headers, parsed_rows, delimiter


def pick(row: Dict[str, str], *keys: str) -> Optional[str]:
    for key in keys:
        value = row.get(key)
        if value is not None and str(value).strip():
            return value
    return None


def to_number(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    cleaned = str(value).replace(",", "").strip()
    if not cleaned:
        return None
    try:
        num = float(cleaned)
    except ValueError:
        return None
    return num if math.isfinite(num) else None


def resolve_inductance_h(row: Dict[str, str]) -> Optional[float]:
    L = to_number(pick(row, "l_h", "l_henry", "inductance_h", "l"))
    if L is not None:
        return L
    l_uh = to_number(pick(row, "l_uh", "inductance_uh", "l_total_uh", "l_coil_uh"))
    if l_uh is not None:
        return l_uh * 1e-6
    l_mh = to_number(pick(row, "l_mh", "inductance_mh"))
    if l_mh is not None:
        return l_mh * 1e-3
    return None


def resolve_energy_j(row: Dict[str, str]) -> Optional[float]:
    E = to_number(pick(row, "e_j", "energy_j", "e_pulse_j", "stored_energy_j"))
    if E is not None:
        return E
    e_mj = to_number(pick(row, "e_mj", "energy_mj"))
    if e_mj is not None:
        return e_mj * 1e-3
    e_kj = to_number(pick(row, "e_kj", "energy_kj", "e_coil_per_burst_kj"))
    if e_kj is not None:
        return e_kj * 1e3
    return None


def resolve_t_rise_s(row: Dict[str, str]) -> Optional[float]:
    t = to_number(pick(row, "t_rise_s", "trise_s", "rise_time_s", "pulse_rise_s"))
    if t is not None:
        return t
    t_us = to_number(pick(row, "t_rise_us", "trise_us", "rise_time_us", "pulse_rise_us"))
    if t_us is not None:
        return t_us * 1e-6
    t_ns = to_number(pick(row, "t_rise_ns", "trise_ns"))
    if t_ns is not None:
        return t_ns * 1e-9
    return None


def resolve_duration_s(row: Dict[str, str]) -> Optional[float]:
    t = to_number(pick(row, "pulse_width_s", "tau_s", "duration_s", "fwhm_s"))
    if t is not None:
        return t
    t_us = to_number(pick(row, "pulse_width_us", "tau_us", "duration_us"))
    if t_us is not None:
        return t_us * 1e-6
    t_ns = to_number(pick(row, "pulse_width_ns", "tau_ns", "duration_ns"))
    if t_ns is not None:
        return t_ns * 1e-9
    return None


def resolve_rep_rate(row: Dict[str, str]) -> Optional[float]:
    return to_number(pick(row, "rep_rate_hz", "rep_hz", "pps", "prf_hz"))


def resolve_didt(row: Dict[str, str]) -> Optional[float]:
    di_dt = to_number(pick(row, "di_dt_a_per_s", "di_dt", "didt"))
    if di_dt is not None:
        return di_dt
    di_dt_us = to_number(pick(row, "di_dt_a_per_us", "didt_a_per_us"))
    if di_dt_us is not None:
        return di_dt_us * 1e6
    di_dt_ns = to_number(pick(row, "di_dt_a_per_ns", "didt_a_per_ns"))
    if di_dt_ns is not None:
        return di_dt_ns * 1e9
    return None


def resolve_vmax(row: Dict[str, str]) -> Optional[float]:
    V = to_number(pick(row, "v_max_v", "vmax_v", "v_bus_max_v", "bus_vmax_v"))
    if V is not None:
        return V
    kv = to_number(pick(row, "v_max_kv", "vmax_kv", "v_bus_max_kv"))
    if kv is not None:
        return kv * 1e3
    return None


def resolve_stray_l(row: Dict[str, str]) -> float:
    Ls = to_number(pick(row, "l_stray_h", "l_bus_h", "ls_h"))
    if Ls is not None:
        return Ls
    nH = to_number(pick(row, "l_stray_nh", "ls_nh"))
    if nH is not None:
        return nH * 1e-9
    return 0.0


def resolve_conductor(row: Dict[str, str]) -> Tuple[Optional[int], Optional[float], Optional[float]]:
    N = to_number(pick(row, "n_parallel", "n_tapes", "n_strands", "tapes", "strands"))
    area = to_number(pick(row, "area_mm2", "sc_area_mm2", "strand_area_mm2", "cs_area_mm2"))

    area_mm2 = area
    if area_mm2 is None:
        width = to_number(pick(row, "tape_width_mm", "width_mm", "conductor_width_mm"))
        th_um = to_number(pick(row, "tape_thickness_um", "thickness_um"))
        th_mm = to_number(pick(row, "tape_thickness_mm", "thickness_mm"))
        if width is not None and th_um is not None:
            area_mm2 = width * (th_um * 1e-3)
        elif width is not None and th_mm is not None:
            area_mm2 = width * th_mm

    Jc = to_number(pick(row, "jc_a_per_mm2", "jcrit_a_per_mm2", "jc"))
    Npar = int(N) if N is not None and N > 0 else None
    return Npar, area_mm2, Jc


def format_number(value: Optional[float]) -> str:
    if value is None or not math.isfinite(value):
        return ""
    abs_val = abs(value)
    if abs_val != 0 and (abs_val < 1e-3 or abs_val >= 1e6):
        return f"{value:.6e}"
    rounded = round(value, 6)
    text = f"{rounded}"
    if text.endswith(".0"):
        text = text[:-2]
    return text


def compute_filled_row(row: ParsedRow) -> Dict[str, Optional[float]]:
    normalized = row.normalized
    name = (pick(normalized, "name", "load", "id", "element", "stage") or f"row_{row.index + 1}").strip()
    L = resolve_inductance_h(normalized)
    E = resolve_energy_j(normalized)
    tr = resolve_t_rise_s(normalized)
    tp = resolve_duration_s(normalized)
    rep = resolve_rep_rate(normalized)
    di_dt = resolve_didt(normalized)
    Vmax = resolve_vmax(normalized)
    Ls = resolve_stray_l(normalized)
    Npar, area_mm2, Jc = resolve_conductor(normalized)
    I_user = to_number(pick(normalized, "i_peak_a", "ipeak_a", "i_a_peak", "i_pk_a"))

    needs: set[str] = set()
    Ltot = (L or 0.0) + (Ls or 0.0)
    L_base = L if L is not None and L > 0 else None
    L_total = Ltot if Ltot > 0 else None

    I_final: Optional[float] = None
    picked: Optional[str] = None
    tr_final = tr
    di_dt_final = di_dt
    V_flat = Vmax
    E_final = E

    I_energy: Optional[float] = None
    if E_final is not None and L_base is not None:
        I_energy = math.sqrt(max(0.0, (2 * E_final) / L_base))

    # 1) User override
    if I_user is not None and math.isfinite(I_user) and I_user > 0:
        I_final = I_user
        picked = "user"

    # 2) Energy path
    if I_final is None and I_energy is not None:
        I_final = I_energy
        picked = "E & L"

    # 3) di/dt with t_rise
    if I_final is None and di_dt_final is not None and tr_final is not None and tr_final > 0:
        I_final = di_dt_final * tr_final
        picked = "di/dt * t_rise"

    # 4) V with t_rise (derive di/dt from V/L)
    if (
        I_final is None
        and V_flat is not None
        and L_total is not None
        and tr_final is not None
        and tr_final > 0
    ):
        di_from_v = V_flat / L_total
        I_final = di_from_v * tr_final
        di_dt_final = di_dt_final if di_dt_final is not None else di_from_v
        picked = "V * t_rise / L"

    # 5) E with di/dt, back-solve t_rise
    if I_final is None and di_dt_final is not None and I_energy is not None and di_dt_final > 0:
        I_final = I_energy
        tr_final = I_energy / di_dt_final
        picked = "E & di/dt -> t_rise"

    # Backfills
    if tr_final is None and I_final is not None and di_dt_final is not None and di_dt_final > 0:
        tr_final = I_final / di_dt_final
    if di_dt_final is None and I_final is not None and tr_final is not None and tr_final > 0:
        di_dt_final = I_final / tr_final
    if di_dt_final is None and V_flat is not None and L_total is not None:
        di_dt_final = V_flat / L_total
    if V_flat is None and di_dt_final is not None and L_total is not None:
        V_flat = L_total * di_dt_final
    if E_final is None and I_final is not None and L_base is not None:
        E_final = 0.5 * L_base * (I_final ** 2)

    if I_final is None:
        if L is None:
            needs.add("L")
        if E is None and Vmax is None and di_dt is None:
            needs.add("E_or_Vmax_or_di/dt")
        if tr is None and (E is None or di_dt is None):
            needs.add("t_rise or (E & di/dt)")

    V_req: Optional[float] = None
    if L_total is not None and di_dt_final is not None:
        V_req = L_total * di_dt_final

    J: Optional[float] = None
    J_frac: Optional[float] = None
    if I_final is not None and area_mm2 is not None and area_mm2 > 0:
        N_eff = Npar if Npar is not None and Npar > 0 else 1
        J = I_final / (N_eff * area_mm2)
        if Jc is not None and Jc > 0:
            J_frac = J / Jc

    I_rms: Optional[float] = None
    width = tp if tp is not None else tr_final
    if I_final is not None and width is not None and width > 0:
        I_rms = I_final / math.sqrt(3)
        if rep is not None and rep > 0:
            duty = width * rep
            I_rms *= math.sqrt(max(1e-12, duty))

    return {
        "name": name,
        "L_H": L,
        "E_pulse_J": E_final,
        "t_rise_s": tr_final,
        "pulse_width_s": tp,
        "rep_rate_hz": rep,
        "di_dt_A_per_s": di_dt_final,
        "I_peak_A": I_final,
        "I_peak_method": picked,
        "V_required_kV": V_req / 1e3 if V_req is not None else None,
        "V_max_kV": Vmax / 1e3 if Vmax is not None else None,
        "L_total_uH": Ltot * 1e6 if Ltot > 0 else None,
        "J_A_per_mm2": J,
        "J_over_Jc": J_frac,
        "N_parallel": Npar,
        "area_mm2": area_mm2,
        "Jc_A_per_mm2": Jc,
        "I_rms_A_est": I_rms,
        "needs": ", ".join(sorted(needs)) if needs else None,
    }


def rows_to_csv(rows: List[Dict[str, Optional[float]]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(OUTPUT_COLUMNS)
    for row in rows:
        cells = []
        for col in OUTPUT_COLUMNS:
            value = row.get(col)
            if isinstance(value, str):
                cells.append(value.replace("\n", " ").replace("\r", " ").strip())
            elif value is None:
                cells.append("")
            else:
                cells.append(format_number(value))
        writer.writerow(cells)
    return buffer.getvalue().rstrip("\n")


def write_outputs(csv_text: str, outputs: Iterable[Path]) -> List[Path]:
    written: List[Path] = []
    for path in outputs:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(csv_text, encoding="utf-8")
        written.append(path.resolve())
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Fill Needle I_peak worksheet CSV (amps/volts/J and needs column).")
    parser.add_argument(
        "worksheet",
        nargs="?",
        default=str(DEFAULT_INPUT),
        help=f"Input CSV path (default: {DEFAULT_INPUT})",
    )
    parser.add_argument(
        "-o",
        "--out",
        dest="outputs",
        action="append",
        help="Output path(s) for filled CSV. Defaults to /mnt/data and data/needle_Ipeak_filled.csv.",
    )
    args = parser.parse_args()

    input_path = Path(args.worksheet).expanduser()
    if not input_path.exists():
        sys.exit(f"Input CSV not found: {input_path}")

    headers, parsed_rows, delimiter = parse_worksheet(input_path)
    filled_rows = [compute_filled_row(row) for row in parsed_rows]
    csv_text = rows_to_csv(filled_rows)

    outputs = [Path(p).expanduser() for p in (args.outputs or [])]
    if not outputs:
        outputs = DEFAULT_OUTPUTS

    written = write_outputs(csv_text, outputs)

    solved = sum(1 for row in filled_rows if row.get("I_peak_A") is not None)
    needs_rows = sum(1 for row in filled_rows if row.get("needs"))
    print(
        f"Filled {len(filled_rows)} rows (I_peak solved: {solved}, needs flagged: {needs_rows}) "
        f"from {input_path} using {repr(delimiter)} delimiter.",
    )
    print(f"Headers detected: {', '.join(headers) if headers else 'none'}")
    for path in written:
        print(f"Written: {path}")


if __name__ == "__main__":
    main()
