"""Audit the public IDM/H.E.S.S. scan table against the LZ-fit point.

Read-only, pinned GitHub API intake. This does not execute the paper's
notebooks, calculate the IDM model, or reconstruct a H.E.S.S. likelihood.
"""

from __future__ import annotations

import base64
import json
import math
from pathlib import Path
from urllib.request import Request, urlopen


REPO = "RadicceJustino/IDM-indirect-detection"
COMMIT = "bbf6c4a6a37b4baa1e200569bc228e311a99100b"
DATA_PATH = "data/CA_sig_continuous3"
EXPECTED_BLOB_SHA = "b6970000d511ee1c3fdcff6c713f85243c5f17dc"
NEARBY_BENCHMARK_PATH = "data/CA_sig_13all"
NEARBY_BENCHMARK_SHA = "f72800d0dfff4c80091f5b235dd8c3f869349074"
LIMIT_PATH = "data/ID_HESS13_546h.dat"
LIMIT_BLOB_SHA = "70cac8193b7b45ac3a2f5f1908c826ad9b3200d0"
ROOT = Path(__file__).resolve().parent

LZ = {
    "m_H_GeV": 1080.0,
    "delta_AH_GeV": 369e-6,
    "delta_charged_GeV": 8.17,
    "lambda_L": -1.92e-4,
}


def api_json(url: str) -> dict:
    req = Request(url, headers={"User-Agent": "CasimirBot-dark-sector-research"})
    with urlopen(req, timeout=30) as response:
        return json.load(response)


def load_rows() -> tuple[list[dict[str, float]], dict]:
    url = f"https://api.github.com/repos/{REPO}/contents/{DATA_PATH}?ref={COMMIT}"
    record = api_json(url)
    assert record["sha"] == EXPECTED_BLOB_SHA
    text = base64.b64decode(record["content"]).decode("utf-8")
    lines = [line.split() for line in text.splitlines() if line.strip() and not line.startswith("#")]
    header, *values = lines
    rows = [dict(zip(header, map(float, row), strict=True)) for row in values]
    assert len(rows) == 809
    return rows, record


def fetch_text(path: str, expected_sha: str) -> tuple[str, dict]:
    url = f"https://api.github.com/repos/{REPO}/contents/{path}?ref={COMMIT}"
    record = api_json(url)
    assert record["sha"] == expected_sha
    return base64.b64decode(record["content"]).decode("utf-8"), record


def parse_numeric_table(text: str) -> list[list[float]]:
    rows = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.lower().startswith("mdm"):
            continue
        rows.append([float(value) for value in stripped.split()])
    return rows


def main() -> None:
    rows, record = load_rows()
    benchmark_text, benchmark_record = fetch_text(NEARBY_BENCHMARK_PATH, NEARBY_BENCHMARK_SHA)
    limit_text, limit_record = fetch_text(LIMIT_PATH, LIMIT_BLOB_SHA)
    tree = api_json(
        f"https://api.github.com/repos/{REPO}/git/trees/{COMMIT}?recursive=1"
    )
    paths = [item["path"] for item in tree["tree"]]
    spectrum_paths = [path for path in paths if Path(path).name.startswith("Spectrum") and path.endswith("_all.dat")]

    neighborhood = [
        row for row in rows
        if 900 <= row["MDM"] <= 1250
        and 0.5 <= row["d0"] <= 1.0
        and 6 <= row["d+"] <= 10
    ]
    assert neighborhood
    nearest = min(
        neighborhood,
        key=lambda row: (
            abs(row["MDM"] - LZ["m_H_GeV"]) / LZ["m_H_GeV"]
            + abs(row["d0"] - LZ["delta_AH_GeV"])
            + abs(row["d+"] - LZ["delta_charged_GeV"]) / LZ["delta_charged_GeV"]
        ),
    )
    min_neutral_gap = min(row["d0"] for row in rows)
    benchmark_comment = next(line for line in benchmark_text.splitlines() if line.startswith("#"))
    assert "d0 d+ = 0.500000 5.000000" in benchmark_comment
    limits = parse_numeric_table(limit_text)
    limits.sort(key=lambda row: row[0])
    below = max((row for row in limits if row[0] <= nearest["MDM"]), key=lambda row: row[0])
    above = min((row for row in limits if row[0] >= nearest["MDM"]), key=lambda row: row[0])
    weight = (nearest["MDM"] - below[0]) / (above[0] - below[0])
    limit_at_nearest_mass = 10 ** (
        (1 - weight) * math.log10(below[1]) + weight * math.log10(above[1])
    )
    local_fraction = 0.9
    proxy_ratio = nearest["SigmaV"] / limit_at_nearest_mass
    max_heavy_local_fraction = min(1.0, math.sqrt(1.0 / proxy_ratio))
    result = {
        "status": "pinned public-data audit; no model recast",
        "source": f"https://github.com/{REPO}/tree/{COMMIT}",
        "commit": COMMIT,
        "table_path": DATA_PATH,
        "table_git_blob_sha": record["sha"],
        "nearest_benchmark_table_path": NEARBY_BENCHMARK_PATH,
        "nearest_benchmark_table_sha": benchmark_record["sha"],
        "nearest_benchmark_gap_header": benchmark_comment.lstrip("# ").strip(),
        "hess_limit_table_path": LIMIT_PATH,
        "hess_limit_table_sha": limit_record["sha"],
        "table_bytes": record["size"],
        "table_rows": len(rows),
        "table_columns": list(rows[0]),
        "tracked_spectrum_all_files": spectrum_paths,
        "scan_min_neutral_gap_GeV": min_neutral_gap,
        "lz_point": LZ,
        "nearest_point_in_declared_neighborhood": nearest,
        "nearest_neutral_gap_over_lz_gap": nearest["d0"] / LZ["delta_AH_GeV"],
        "nearest_charged_gap_difference_GeV": nearest["d+"] - LZ["delta_charged_GeV"],
        "nearest_mass_difference_GeV": nearest["MDM"] - LZ["m_H_GeV"],
        "nearby_benchmark_sensitivity_diagnostic": {
            "benchmark_neutral_gap_GeV": 0.5,
            "benchmark_charged_gap_GeV": 5.0,
            "nearest_scan_point_charged_gap_GeV": nearest["d+"],
            "hess_546h_limit_at_nearest_scan_mass_source_units": limit_at_nearest_mass,
            "interpolation": "linear in log10(limit) against log10(mass), bracketed by nearest rows",
            "scan_sigma_v_over_hess_limit": proxy_ratio,
            "co_traced_90pct_density_squared_ratio_at_fixed_sigma_v": (
                local_fraction**2 * nearest["SigmaV"] / limit_at_nearest_mass
            ),
            "max_heavy_local_fraction_if_rate_shape_fixed": max_heavy_local_fraction,
            "min_other_local_fraction_if_components_co_trace": 1.0 - max_heavy_local_fraction,
            "xenon_rate_fraction_at_proxy_hess_threshold_if_microphysics_fixed": max_heavy_local_fraction,
            "status": "nearby benchmark stress-test only; not an exact-point recast",
        },
        "interpretation_limits": [
            "The public continuous scan has no neutral splitting below 0.5 GeV, far above the 369 keV LZ point.",
            "The nearest record is a neighboring scan point, not the LZ best-fit parameter set; Lambda345 and lambda_L use the same coupling combination here, but their fitted values differ in sign and magnitude.",
            "The nearest record is near the full-DM relic abundance, not the reduced Omega h^2=0.10782 target for a 10% ultralight component.",
            "The paper's H.E.S.S. baseline uses tree-level spectra/rates; Sommerfeld effects are a separate comparison and are not included in this source-table diagnostic.",
            "The nearby H.E.S.S. sensitivity curve uses d0=0.5 GeV and d+=5 GeV, versus the neighboring scan record's d+=8.1815 GeV; its benchmark spectrum is not the neighboring record's spectrum.",
            "The repository tree does not contain the Spectrum*_all.dat files referenced by its H.E.S.S. notebook, so its model-specific response fold is not reproducible from the tracked tree alone.",
            "No likelihood or exclusion is inferred from proximity in parameter space.",
        ],
    }
    assert min_neutral_gap >= 0.5
    assert not spectrum_paths
    assert nearest["d0"] / LZ["delta_AH_GeV"] > 1300
    (ROOT / "casimir-dp-idm-hess-public-data-audit-2026-09-25.json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({key: result[key] for key in (
        "table_rows", "table_columns", "scan_min_neutral_gap_GeV",
        "tracked_spectrum_all_files", "nearest_point_in_declared_neighborhood",
        "nearest_neutral_gap_over_lz_gap", "nearby_benchmark_sensitivity_diagnostic",
    )}, indent=2))


if __name__ == "__main__":
    main()
