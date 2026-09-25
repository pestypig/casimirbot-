"""Compare IDM Xe isotope recoil spectra across published TNG50 Earth-frame PDFs.

This computes the rho_H * eta(v_min) factor from the IDM rate equation, isotope
by isotope, for one published Earth-frame epoch. For a fixed isotope and recoil
energy, its unknown weak nuclear response cancels in the ratio to the source
SHM prediction. This is not an absolute detector prediction or LZ likelihood.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path


EXPECTED_DATA_SHA256 = "9d3e18f95cb373634f57cadfd8d836a62dbf991d20cf0271a968e15dc1a0a9e0"
SOURCE_DATA_URL = "https://zenodo.org/records/15374887"
SOURCE_RHO = 0.30
MCHI_GEV = 1080.0
DELTA_KEV = 369.0
GEV_PER_U = 0.93149410242
C_KM_S = 299_792.458
SHM_V0 = 238.0
SHM_VESC = 544.0
SHM_VLAB = 254.0
ISOTOPES = (128, 129, 130, 131, 132, 134, 136)
ATOM_ABUNDANCE = (0.01910, 0.26401, 0.04071, 0.21232, 0.26909, 0.10436, 0.08857)
DETAIL_ENERGIES_KEV = (14.0, 100.0, 200.0, 202.0, 225.0, 248.0, 250.0, 269.9, 271.0, 294.0, 330.0, 500.0)


def trapz(y: list[float], x: list[float]) -> float:
    return sum((x[i + 1] - x[i]) * (y[i + 1] + y[i]) * 0.5 for i in range(len(x) - 1))


def quantile(values: list[float], p: float) -> float:
    if not values:
        return math.nan
    vals = sorted(values)
    pos = (len(vals) - 1) * p
    lo, hi = int(math.floor(pos)), int(math.ceil(pos))
    return vals[lo] + (pos - lo) * (vals[hi] - vals[lo])


def shm_eta(vmin: float) -> float:
    z, x, y = SHM_VESC / SHM_V0, vmin / SHM_V0, SHM_VLAB / SHM_V0
    norm = math.erf(z) - 2.0 / math.sqrt(math.pi) * z * math.exp(-z * z)
    if vmin >= SHM_VESC + SHM_VLAB:
        return 0.0
    if vmin < SHM_VESC - SHM_VLAB:
        num = math.erf(x + y) - math.erf(x - y) - 4.0 / math.sqrt(math.pi) * y * math.exp(-z * z)
    else:
        num = math.erf(z) - math.erf(x - y) - 2.0 / math.sqrt(math.pi) * (z - x + y) * math.exp(-z * z)
    return num / (2.0 * norm * SHM_VLAB)


def minimum_speed(a: int, recoil_keV: float) -> float:
    nucleus = a * GEV_PER_U
    recoil = recoil_keV * 1.0e-6
    reduced = MCHI_GEV * nucleus / (MCHI_GEV + nucleus)
    delta = DELTA_KEV * 1.0e-6
    return (nucleus * recoil / reduced + delta) / math.sqrt(2.0 * nucleus * recoil) * C_KM_S


def eta_from_pdf(pdf_1e3: list[float], speeds: list[float], vmin: float) -> float:
    pdf = [float(q) * 1.0e-3 for q in pdf_1e3]
    i = next((j for j, speed in enumerate(speeds) if speed >= vmin), len(speeds))
    if i == 0 or i == len(speeds):
        return 0.0
    at_min = pdf[i - 1] + (pdf[i] - pdf[i - 1]) * (vmin - speeds[i - 1]) / (speeds[i] - speeds[i - 1])
    x = [vmin] + speeds[i:]
    y = [at_min] + pdf[i:]
    return trapz([density / speed for density, speed in zip(y, x)], x)


def summarize(data: dict, digest: str) -> dict:
    speeds = [float(x) for x in data["speed_geo"]]
    if len(data["haloIDs"]) != 98:
        raise ValueError("Expected 98 frozen TNG50 halo PDFs")
    if any(b <= a for a, b in zip(speeds, speeds[1:])):
        raise ValueError("Speed grid must be strictly increasing")
    near_unity = [i for i, factor in enumerate(data["scale_factors"]) if abs(1.0 / float(factor) - 1.0) < 0.125]
    if len(near_unity) != 7:
        raise ValueError(f"Expected seven minimally scaled validation halos; got {len(near_unity)}")

    energies = sorted(set(float(e) for e in range(14, 801, 5)) | set(DETAIL_ENERGIES_KEV))
    output_cases = {}
    for phase_space in ("scaled", "unscaled"):
        block = data[phase_space]
        distributions = block["geocentric"]["speed_dists"]
        densities = [float(x) for x in block["densities"]]
        curves = {}
        for a in ISOTOPES:
            rows = []
            for energy in energies:
                vmin = minimum_speed(a, energy)
                eta_ref = shm_eta(vmin)
                per_halo = []
                for halo_id, pdf, rho in zip(data["haloIDs"], distributions, densities):
                    eta = eta_from_pdf(pdf, speeds, vmin)
                    factor = rho * eta / (SOURCE_RHO * eta_ref) if eta_ref > 0 else None
                    per_halo.append({
                        "halo_id": int(halo_id),
                        "rho_eta_GeV_cm3_per_km_s": rho * eta,
                        "ratio_to_source_SHM": factor,
                    })
                valid = [row["ratio_to_source_SHM"] for row in per_halo if row["ratio_to_source_SHM"] is not None]
                rows.append({
                    "recoil_keV": energy,
                    "vmin_km_s": vmin,
                    "source_SHM_eta_per_km_s": eta_ref,
                    "SHM_ratio_defined": eta_ref > 0,
                    "halos_with_nonzero_support": sum(row["rho_eta_GeV_cm3_per_km_s"] > 0 for row in per_halo),
                    "rate_ratio_percentiles_0_16_50_84_100": [quantile(valid, p) for p in (0, 0.16, 0.5, 0.84, 1)] if valid else None,
                    "near_unity_scaling_rate_ratio_percentiles_0_16_50_84_100": [
                        quantile([per_halo[i]["ratio_to_source_SHM"] for i in near_unity
                                  if per_halo[i]["ratio_to_source_SHM"] is not None], p)
                        for p in (0, 0.16, 0.5, 0.84, 1)
                    ] if valid else None,
                    "halo_details": per_halo if energy in DETAIL_ENERGIES_KEV else None,
                })
            curves[str(a)] = rows
        output_cases[phase_space] = curves

    atom_total = sum(ATOM_ABUNDANCE)
    atom_fraction = [x / atom_total for x in ATOM_ABUNDANCE]
    mean_a = sum(a * x for a, x in zip(ISOTOPES, atom_fraction))
    mass_fraction = {str(a): a * x / mean_a for a, x in zip(ISOTOPES, atom_fraction)}
    return {
        "classification": "isotope-resolved rho*eta recoil-spectrum fold; not an absolute xenon spectrum, detector prediction, or LZ likelihood",
        "source_paper": "https://arxiv.org/abs/2609.06571",
        "source_data": SOURCE_DATA_URL,
        "source_data_sha256": digest,
        "source_data_attribution": "Folsom et al. (2025), CC-BY-4.0 supplemental data, Zenodo record 15374887 v1",
        "benchmark": {
            "mH_GeV": MCHI_GEV, "delta_keV": DELTA_KEV,
            "reference_SHM": {"rho_GeV_cm3": SOURCE_RHO, "v0_km_s": SHM_V0,
                              "vesc_km_s": SHM_VESC, "vlab_km_s": SHM_VLAB},
            "isotopes_A": list(ISOTOPES),
            "atom_fractions": {str(a): x for a, x in zip(ISOTOPES, atom_fraction)},
            "mass_fractions_for_rate_equation": mass_fraction,
        },
        "data_grid": {"geocentric_epoch": "2000-03-09", "speed_bin_count": len(speeds),
                      "speed_min_km_s": speeds[0], "speed_max_km_s": speeds[-1],
                      "pdf_units": "1e-3 s/km", "halo_density_speed_pairing": "same simulated halo"},
        "recoil_energies_keV": energies,
        "results_by_phase_space_and_isotope": output_cases,
        "method": [
            "Uses IDM Eq. 11 for each isotope's inelastic v_min and Eq. 16's rho_H/m_H times isotope response times eta(v_min) factor.",
            "The unknown finite-momentum weak nuclear response cancels exactly in each isotope-and-energy ratio to the source SHM, provided the same response is used in numerator and reference denominator.",
            "No isotope-summed natural-xenon ratio is reported because it requires isotope-dependent weak response weights; isotope component ratios are retained separately.",
            "The TNG50 distributions are single-date geocentric PDFs, not annual averages or a Milky Way posterior. The source SHM lab speed is held at 254 km/s for the reference.",
            "Local IDM fraction multiplies rho*eta linearly and is not inferred. Density and velocity distributions are paired halo by halo.",
        ],
        "detector_limits": [
            "No absolute rate is calculated: cross-section normalization and isotope weak responses are not reconstructed here.",
            "No LZ energy migration, efficiency convolution, candidate/background PDF, nuisance prior, or event likelihood is applied.",
            "The spectrum is stopped at 800 keV for kinematic context; LZ's reported extended analysis reaches approximately 270 keV and efficiency drops below 50% above 269.9 keV.",
        ],
        "falsification_test": "The next detector-level step must reproduce the IDM finite-q weak responses and fold the isotope-summed spectrum through the released LZ efficiency/response and event/background likelihood with the same halo and local fraction.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-json", required=True, help="Folsom-2505-data.json from Zenodo record 15374887 v1")
    parser.add_argument("--output", help="optional JSON output path")
    args = parser.parse_args()
    path = Path(args.data_json)
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_DATA_SHA256:
        raise SystemExit(f"Input SHA-256 mismatch: expected {EXPECTED_DATA_SHA256}, got {digest}")
    result = summarize(json.loads(raw), digest)
    output = Path(args.output) if args.output else Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    for phase_space in ("scaled", "unscaled"):
        row = next(x for x in result["results_by_phase_space_and_isotope"][phase_space]["131"] if x["recoil_keV"] == 248.0)
        print(phase_space, "Xe-131 @ 248 keV", json.dumps({k: v for k, v in row.items() if k != "halo_details"}))


if __name__ == "__main__":
    main()
