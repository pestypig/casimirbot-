"""Conditional SHM recoil-shape test for carbon-open B-L split scalars.

Compares xenon recoil spectral weight below and around LZ's 248-keV event for
physical splittings that can open C-12 upscattering. This is not a detector
likelihood: it uses a standard truncated Maxwellian and Helm form factor, and
does not fold the published energy-dependent detector response.
"""
from __future__ import annotations

import json
import hashlib
import math
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "casimir-dp-bminusl-carbon-open-xenon-spectrum-2026-09-25.json"
EFFICIENCY_SVG = ROOT / "casimir-dp-lz-figS2-efficiency-source-2026-09-25.svg"
EFFICIENCY_SVG_SHA256 = "ee9f4f76973d5dcdebb33188ed1f2a06f9f5c5bfe751e63aebe03bb3e456d06f"
AMU_GEV = 0.93149410242
C_KM_S = 299_792.458
M_XE = 131 * AMU_GEV
V0, VE, VESC = 220.0, 232.0, 544.0
V_CAP = 798.0
V_SHM_MAX = VESC + VE


def read_efficiency_curve() -> list[tuple[float, float]]:
    raw = EFFICIENCY_SVG.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == EFFICIENCY_SVG_SHA256
    root = ET.fromstring(raw)
    # Fig. S2's black path is the final WS ROI efficiency after all cuts.
    paths = [
        node for node in root.iter()
        if node.tag.endswith("path")
        and node.attrib.get("stroke") == "#000000"
        and node.attrib.get("stroke-width") == "2"
        and len(node.attrib.get("d", "")) > 3000
    ]
    assert len(paths) == 1
    tokens = re.findall(r"[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)", paths[0].attrib["d"])
    points_svg: list[tuple[float, float]] = []
    i, command, x, y = 0, None, 0.0, 0.0
    while i < len(tokens):
        if tokens[i].isalpha():
            command = tokens[i]
            i += 1
        if command == "M":
            x, y = float(tokens[i]), float(tokens[i + 1])
            i += 2
            points_svg.append((x, y))
            command = "L"
        elif command == "H":
            x = float(tokens[i])
            i += 1
            points_svg.append((x, y))
        elif command == "V":
            y = float(tokens[i])
            i += 1
            points_svg.append((x, y))
        elif command == "L":
            x, y = float(tokens[i]), float(tokens[i + 1])
            i += 2
            points_svg.append((x, y))
        else:
            raise ValueError(f"Unsupported SVG command in efficiency trace: {command}")

    # Axis ticks: 0--300 keV at x=51.090627--497.85066;
    # efficiency 0--1 at the plotted gridlines y=62.45642--349.14735.
    return sorted(
        (
            300.0 * (px - 51.090627) / (497.85066 - 51.090627),
            min(1.0, max(0.0, (py - 62.45642) / (349.14735 - 62.45642))),
        )
        for px, py in points_svg
        if 51.090627 <= px <= 497.85066
    )


EFFICIENCY_CURVE = read_efficiency_curve()


def efficiency(energy_kev: float) -> float:
    for i in range(1, len(EFFICIENCY_CURVE)):
        x0, y0 = EFFICIENCY_CURVE[i - 1]
        x1, y1 = EFFICIENCY_CURVE[i]
        if energy_kev <= x1:
            return y0 + (energy_kev - x0) * (y1 - y0) / (x1 - x0)
    return EFFICIENCY_CURVE[-1][1]


def average_efficiency(lo: float, hi: float, steps: int = 10000) -> float:
    dx = (hi - lo) / steps
    total = 0.5 * (efficiency(lo) + efficiency(hi))
    total += sum(efficiency(lo + i * dx) for i in range(1, steps))
    return total * dx / (hi - lo)


def eta(vmin: float) -> float:
    """Mean inverse speed for a shifted, truncated Maxwellian (km/s units)."""
    z = VESC / V0
    norm = math.erf(z) - 2 * z / math.sqrt(math.pi) * math.exp(-z * z)
    if vmin >= VESC + VE:
        return 0.0
    if vmin < VESC - VE:
        term = math.erf((vmin + VE) / V0) - math.erf((vmin - VE) / V0)
        term -= 4 / math.sqrt(math.pi) * (VE / V0) * math.exp(-z * z)
    else:
        term = math.erf(z) - math.erf((vmin - VE) / V0)
        term -= 2 / math.sqrt(math.pi) * (VESC - vmin + VE) / V0 * math.exp(-z * z)
    return max(0.0, term / (2 * norm * VE))


def helm_f2(energy_kev: float, a_mass: int = 131) -> float:
    q_fm = math.sqrt(2 * a_mass * AMU_GEV * energy_kev * 1e-6) / 0.1973269804
    skin, diffuseness = 0.9, 0.52
    c = 1.23 * a_mass ** (1 / 3) - 0.60
    r1 = math.sqrt(c * c + 7 * math.pi**2 * diffuseness**2 / 3 - 5 * skin**2)
    x = q_fm * r1
    j1_over_x = 1 / 3 if abs(x) < 1e-7 else math.sin(x) / x**3 - math.cos(x) / x**2
    f = 3 * j1_over_x * math.exp(-0.5 * (q_fm * skin)**2)
    return f * f


def vmin_kms(energy_kev: float, mass_gev: float, splitting_kev: float) -> float:
    mu = mass_gev * M_XE / (mass_gev + M_XE)
    er, delta = energy_kev * 1e-6, splitting_kev * 1e-6
    return C_KM_S * (M_XE * er / mu + delta) / math.sqrt(2 * M_XE * er)


def integral(lo: float, hi: float, mass_gev: float, splitting_kev: float,
             apply_efficiency: bool, steps: int = 20000) -> float:
    # dR/dE for contact SI scattering is proportional to F^2(E)*eta(vmin).
    # Multiplying by Fig. S2's overall signal efficiency gives selected true-E
    # counts, but does not smear true energy into reconstructed energy.
    step = (hi - lo) / steps
    total = 0.0
    for i in range(steps + 1):
        e = lo + i * step
        y = helm_f2(e) * eta(vmin_kms(e, mass_gev, splitting_kev))
        if apply_efficiency:
            y *= efficiency(e)
        total += y * (0.5 if i in (0, steps) else 1.0)
    return total * step


def main() -> None:
    rows = []
    for mass in (1000.0, 2000.0, 3000.0, 5000.0):
        mu_c = mass * (12 * AMU_GEV) / (mass + 12 * AMU_GEV)
        delta_c_max = 0.5 * mu_c * (V_CAP / C_KM_S) ** 2 * 1e6
        delta_c_max_shm = 0.5 * mu_c * (V_SHM_MAX / C_KM_S) ** 2 * 1e6
        # Carbon-open sweep plus the published LZ high-splitting comparison.
        deltas = (0.0, 10.0, 20.0, 30.0, 0.99 * delta_c_max_shm, 100.0, 200.0, 300.0)
        for delta in deltas:
            below_raw = integral(14.0, 200.0, mass, delta, False)
            event_raw = integral(225.0, 270.0, mass, delta, False)
            below_selected = integral(14.0, 200.0, mass, delta, True)
            event_selected = integral(225.0, 270.0, mass, delta, True)
            rows.append({
                "mS_GeV": mass,
                "physical_delta_keV": delta,
                "carbon_upscatter_open_at_798_km_s": delta < delta_c_max,
                "carbon_upscatter_open_within_shm_support": delta < delta_c_max_shm,
                "carbon_delta_max_at_798_km_s_keV": delta_c_max,
                "carbon_delta_max_at_shm_support_keV": delta_c_max_shm,
                "xe_vmin_at_248_keV_km_s": vmin_kms(248.0, mass, delta),
                "raw_weight_14_200_keV": below_raw,
                "raw_weight_225_270_keV": event_raw,
                "raw_ratio_14_200_to_225_270": below_raw / event_raw if event_raw else None,
                "selected_weight_14_200_keV": below_selected,
                "selected_weight_225_270_keV": event_selected,
                "selected_true_energy_ratio_14_200_to_225_270": below_selected / event_selected if event_selected else None,
                "figS2_efficiency_at_14_keV": efficiency(14.0),
                "figS2_efficiency_at_248_keV": efficiency(248.0),
                "figS2_efficiency_at_269_9_keV": efficiency(269.9),
            })
    result = {
        "title": "Carbon-open B-L splitting versus the LZ xenon recoil spectrum",
        "method": "Contact SI dR/dER proportional to Helm F^2 times shifted-truncated-SHM eta(vmin); v0=220, vEarth=232, vesc=544 km/s. Selected-count proxy multiplies by the final WS ROI efficiency curve digitized from the official Fig. S2 SVG.",
        "efficiency_source": {
            "url": "https://arxiv.org/html/2609.02823v1/FigS2_efficiency_werror.svg",
            "sha256": EFFICIENCY_SVG_SHA256,
            "digitization": "Read vector polyline coordinates from the black final WS ROI curve. Map energy 0-300 keV using x=51.090627..497.85066; map efficiency 0-1 using labeled gridlines y=62.45642..349.14735 (not the plot-frame edges); linearly interpolate between vertices.",
            "mean_efficiency_14_250_keV": average_efficiency(14.0, 250.0),
        },
        "limitations": [
            "Efficiency-folded true-energy count proxy; it applies the plotted selection efficiency but no energy smearing or reconstructed-event distribution.",
            "The digitized efficiency is read from a published vector figure, not the underlying analysis table; it is a plot-level extraction.",
            "No LZ background profile, nuisance treatment, or likelihood is implemented.",
            "Physical gap is treated as mP-mS. The source paper's splitting notation ambiguity remains unresolved.",
            "The carbon kinematic scan reports both the prior frozen 798 km/s cap and this SHM's finite 776 km/s lab-speed support; it is not a carbon rate or material-response prediction.",
        ],
        "rows": rows,
    }
    assert eta(0.0) > eta(700.0) > 0.0 and eta(1200.0) == 0.0
    carbon_open = [row for row in rows if row["carbon_upscatter_open_within_shm_support"]]
    assert len(carbon_open) == 20
    assert all(1.0e3 < row["selected_true_energy_ratio_14_200_to_225_270"] < 3.0e3 for row in carbon_open)
    assert all(0.0 <= row["figS2_efficiency_at_14_keV"] <= 1.0 for row in rows)
    assert abs(average_efficiency(14.0, 250.0) - 0.96) <= 0.01
    assert abs(efficiency(269.9) - 0.50) <= 0.02
    assert all(not row["carbon_upscatter_open_within_shm_support"] for row in rows if row["physical_delta_keV"] >= 100.0)
    OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
