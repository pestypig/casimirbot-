"""Digitized LZ Fig. 6 O1^s interval vs. the B-L 1 TeV benchmark."""
from __future__ import annotations

import hashlib
import json
import math
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "casimir-dp-lz-fig6-o1si-source-2026-09-25.svg"
TEMP_SOURCE = HERE / "_lz_tmp_fig6.svg"
OUT = Path(__file__).with_suffix(".json")
SVG_SHA256 = "9b85d09b5f363a536229b0c2ab2325a2f093aaa37a4532e625702d21969cc277"
M_N = 0.93827208816
M_HIGGS_VEV = 246.2
GEV2_TO_CM2 = 0.3893793721e-27
G_BL = 0.5


def get_clipped_path(svg: str, clip_number: int) -> str:
    root = ET.fromstring(svg)
    ns = "{http://www.w3.org/2000/svg}"
    wanted = f"url(#clip_{clip_number})"
    for group in root.iter(f"{ns}g"):
        if group.attrib.get("clip-path") == wanted:
            paths = [element.attrib["d"] for element in group.iter(f"{ns}path") if "d" in element.attrib]
            if len(paths) == 1:
                return paths[0]
    raise ValueError(f"missing unique path in {wanted}")


def xy_at_delta(path_d: str, delta_kev: float) -> tuple[float, float]:
    # The published path is a polyline with sampled vertices. Interpolate the
    # two neighboring points in vector coordinates; do not fit a smoothing curve.
    numbers = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", path_d)]
    points = list(zip(numbers[0::2], numbers[1::2]))
    if len(points) < 2:
        raise ValueError("unexpected path geometry")
    x_target = 66.7 + delta_kev * (487.18 - 66.7) / 350.0
    points.sort()
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= x_target <= x1 and x1 != x0:
            f = (x_target - x0) / (x1 - x0)
            return x_target, y0 + f * (y1 - y0)
    raise ValueError(f"delta {delta_kev} outside interval path")


def c_to_sigma_cm2(c_dimensionless: float, mass_gev: float) -> float:
    mu = M_N * mass_gev / (M_N + mass_gev)
    # LZ Eq. (6): C=(c1^s mnu^2)^2 = sigma_N*pi*mnu^4/mu^2.
    sigma_gev2 = c_dimensionless * mu**2 / (math.pi * M_HIGGS_VEV**4)
    return sigma_gev2 * GEV2_TO_CM2


def bminusl_sigma_cm2(mass_gev: float) -> float:
    mu = M_N * mass_gev / (M_N + mass_gev)
    m_zp = 2.0 * mass_gev
    return mu**2 * G_BL**4 / (16.0 * math.pi * m_zp**4) * GEV2_TO_CM2


def main() -> None:
    if not SOURCE.exists():
        shutil.copyfile(TEMP_SOURCE, SOURCE)
    svg_bytes = SOURCE.read_bytes()
    digest = hashlib.sha256(svg_bytes).hexdigest()
    assert digest == SVG_SHA256, digest
    svg = svg_bytes.decode("utf-8")
    upper_path = get_clipped_path(svg, 8)
    lower_path = get_clipped_path(svg, 9)
    median_path = get_clipped_path(svg, 7)
    del median_path  # shown for traceability, but not part of the observed interval

    # Plot's local vector y coordinates: -9 at 434.6709, -2 at 672.6521.
    # The page transform flips visual y but the vector path's local y increases
    # with coupling. Calibration is based on the printed logarithmic y ticks.
    def log10_c(y: float) -> float:
        return -9.0 + (y - 434.6709) * 7.0 / (672.6521 - 434.6709)

    rows = []
    for delta in (150.0, 200.0, 250.0, 300.0):
        x, y_hi = xy_at_delta(upper_path, delta)
        _, y_lo = xy_at_delta(lower_path, delta)
        log_hi, log_lo = log10_c(y_hi), log10_c(y_lo)
        sigma_low = c_to_sigma_cm2(10.0**log_lo, 1000.0)
        sigma_high = c_to_sigma_cm2(10.0**log_hi, 1000.0)
        b_sigma = bminusl_sigma_cm2(1000.0)
        rows.append({
            "delta_keV": int(delta), "svg_x": x,
            "c_lower": 10.0**log_lo, "c_upper": 10.0**log_hi,
            "sigma_n_lower_cm2": sigma_low, "sigma_n_upper_cm2": sigma_high,
            "bminusl_mS_1TeV_gBL_0p5_sigma_n_cm2": b_sigma,
            "bminusl_inside_digitized_interval": sigma_low <= b_sigma <= sigma_high,
        })
    assert all(r["sigma_n_lower_cm2"] < r["sigma_n_upper_cm2"] for r in rows)
    assert [r["bminusl_inside_digitized_interval"] for r in rows] == [False, True, False, False]
    assert all(a["sigma_n_lower_cm2"] < b["sigma_n_lower_cm2"] for a, b in zip(rows, rows[1:]))
    assert all(a["sigma_n_upper_cm2"] < b["sigma_n_upper_cm2"] for a, b in zip(rows, rows[1:]))
    payload = {
        "source": "LZ arXiv:2609.02823v1 Fig. 6 top panel (vector SVG)",
        "source_url": "https://arxiv.org/html/2609.02823v1/Fig6_O1_L10_limit_stacked.svg",
        "source_sha256": digest,
        "digitization": "local SVG paths in clip_8 (upper) and clip_9 (lower); linear interpolation in plotted x and log10(C); y-axis calibrated from printed ticks",
        "model_comparator": "B-L Eq. 15, gBL=0.5, mZprime=2*mS, mS=1 TeV",
        "rows": rows,
        "limitations": [
            "Digitized visual cross-check, not an official likelihood or exact recast.",
            "The interval is for isoscalar inelastic O1^s at 1 TeV; it cannot be extrapolated to 2.3 TeV.",
            "B-L model normalization, nuclear response, and physical splitting convention require model-specific implementation.",
        ],
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
