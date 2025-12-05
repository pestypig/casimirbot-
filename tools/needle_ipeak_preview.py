#!/usr/bin/env python3
"""
Quick fallback viewer for the filled Needle I_peak CSV.

Reloads the generated `needle_Ipeak_filled.csv`, prints a trimmed text preview
of the key columns, and draws a simple bar chart of I_peak_A when available.
Useful in notebook/Colab runs where an interactive dataframe UI is unavailable.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

DEFAULT_CANDIDATES = [
    Path("/mnt/data/needle_Ipeak_filled.csv"),  # Colab-style path
    Path("data/needle_Ipeak_filled.csv"),  # repo-relative fallback
]

KEY_COLUMNS = [
    "name",
    "I_peak_A",
    "I_peak_method",
    "V_required_kV",
    "di_dt_A_per_s",
    "L_total_uH",
    "J_A_per_mm2",
    "J_over_Jc",
    "I_rms_A_est",
    "needs",
]


def locate_csv(custom_path: str | None) -> Path | None:
    if custom_path:
        candidate = Path(custom_path).expanduser()
        if candidate.exists():
            return candidate
    for candidate in DEFAULT_CANDIDATES:
        if candidate.exists():
            return candidate
    return None


def preview_table(df: pd.DataFrame, max_rows: int) -> None:
    cols = [c for c in KEY_COLUMNS if c in df.columns]
    if not cols:
        print("No expected columns found; showing full dataframe instead.\n")
        subset = df
    else:
        subset = df[cols].copy()

    max_rows = max(1, int(max_rows))
    if len(subset) > max_rows:
        print(f"Previewing first {max_rows} of {len(subset)} rows:\n")
        subset = subset.head(max_rows)
    else:
        print(f"Previewing all {len(subset)} rows:\n")
    print(subset.to_string(index=False))


def summarize(df: pd.DataFrame) -> None:
    print("\n--- Summary ---")
    # Needs breakdown
    needs_series = df.get("needs")
    if needs_series is not None:
        tokens: dict[str, int] = {}
        for entry in needs_series.dropna():
            for token in str(entry).split(","):
                t = token.strip()
                if not t:
                    continue
                tokens[t] = tokens.get(t, 0) + 1
        if tokens:
            print("Needs (count by token):", ", ".join(f"{k}={v}" for k, v in sorted(tokens.items())))
        else:
            print("Needs: none flagged.")
    # I_peak path
    if "I_peak_method" in df.columns and "I_peak_A" in df.columns:
        methods = df["I_peak_method"].fillna("unsolved").value_counts()
        solved = df["I_peak_A"].dropna()
        print(
            "I_peak methods:",
            ", ".join(f"{m}={c}" for m, c in methods.items()),
            f"| I_peak_A solved rows={len(solved)}, min={solved.min():.3g}, max={solved.max():.3g}"
            if len(solved)
            else "| I_peak_A unresolved",
        )
    # V_required
    if "V_required_kV" in df.columns:
        vreq = df["V_required_kV"].dropna()
        if len(vreq):
            print(f"V_required_kV: min={vreq.min():.3g} kV, max={vreq.max():.3g} kV")
        else:
            print("V_required_kV: none computed.")
    # J and J/Jc
    if "J_A_per_mm2" in df.columns:
        j = df["J_A_per_mm2"].dropna()
        if len(j):
            j_over = df["J_over_Jc"].dropna() if "J_over_Jc" in df.columns else pd.Series(dtype=float)
            print(
                f"J_A_per_mm2: min={j.min():.3g}, max={j.max():.3g}"
                + (
                    f" | J/Jc: min={j_over.min():.3g}, max={j_over.max():.3g}"
                    if len(j_over)
                    else " | J/Jc: n/a"
                )
            )
        else:
            print("J_A_per_mm2: none computed.")
    # RMS estimates
    if "I_rms_A_est" in df.columns:
        rms = df["I_rms_A_est"].dropna()
        if len(rms):
            print(f"I_rms_A_est: min={rms.min():.3g}, max={rms.max():.3g}")
        else:
            print("I_rms_A_est: none computed.")


def plot_peaks(df: pd.DataFrame) -> None:
    if "I_peak_A" not in df.columns:
        print("\nNo I_peak_A column; skipping plot.")
        return

    peaks = df.dropna(subset=["I_peak_A"])
    if len(peaks) < 2:
        print("\nNeed at least two non-null I_peak_A rows to plot; skipping plot.")
        return

    plt.figure(figsize=(10, 4))
    x = np.arange(len(peaks))
    plt.bar(x, peaks["I_peak_A"].values)
    labels = (
        peaks["name"].astype(str).values
        if "name" in peaks.columns
        else [f"row{idx}" for idx in range(len(peaks))]
    )
    plt.xticks(x, labels, rotation=45, ha="right")
    plt.ylabel("I_peak (A)")
    plt.title("Per-load I_peak estimates")
    plt.tight_layout()
    plt.show()


def main() -> None:
    parser = argparse.ArgumentParser(description="Text and plot preview for needle_Ipeak_filled.csv")
    parser.add_argument(
        "--csv",
        help="Path to filled CSV. Defaults: /mnt/data/needle_Ipeak_filled.csv, then data/needle_Ipeak_filled.csv.",
    )
    parser.add_argument("--max-rows", type=int, default=24, help="Maximum rows to print in the text preview.")
    parser.add_argument("--no-plot", action="store_true", help="Skip the matplotlib bar chart.")
    args = parser.parse_args()

    csv_path = locate_csv(args.csv)
    if not csv_path:
        print("No output CSV found (checked /mnt/data and data/needle_Ipeak_filled.csv).")
        return

    df = pd.read_csv(csv_path)
    preview_table(df, args.max_rows)
    summarize(df)
    if not args.no_plot:
        plot_peaks(df)

    print(f"\nFilled CSV is ready: {csv_path}")


if __name__ == "__main__":
    main()
