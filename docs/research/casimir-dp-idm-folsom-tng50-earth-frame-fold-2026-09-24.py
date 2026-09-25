"""Fold published TNG50 Milky Way analog speed distributions through an IDM recoil.

Input is the CC-BY supplemental JSON from Folsom et al. (Zenodo v1).
The script reports a kinematic halo-integral/rho fold, not an LZ likelihood.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path

VMIN_KM_S = 786.009560806017
SOURCE_RHO_GEV_CM3 = 0.30
SOURCE_SHM_V0_KM_S = 238.0
SOURCE_SHM_VESC_KM_S = 544.0
SOURCE_SHM_VLAB_KM_S = 254.0
EXPECTED_DATA_SHA256 = "9d3e18f95cb373634f57cadfd8d836a62dbf991d20cf0271a968e15dc1a0a9e0"
SOURCE_DATA_URL = "https://zenodo.org/records/15374887"


def trapz(y: list[float], x: list[float]) -> float:
    return sum((x[i+1]-x[i])*(y[i+1]+y[i])*0.5 for i in range(len(x)-1))


def quantile(values: list[float], p: float) -> float:
    vals = sorted(values)
    pos = (len(vals)-1)*p
    lo = int(math.floor(pos)); hi = int(math.ceil(pos))
    return vals[lo] + (pos-lo)*(vals[hi]-vals[lo])


def shm_eta(vmin: float, v0: float, vesc: float, vlab: float) -> float:
    z, x, y = vesc/v0, vmin/v0, vlab/v0
    norm = math.erf(z) - 2/math.sqrt(math.pi)*z*math.exp(-z*z)
    if vmin >= vesc + vlab:
        return 0.0
    if vmin < vesc - vlab:
        numerator = math.erf(x+y)-math.erf(x-y)-4/math.sqrt(math.pi)*y*math.exp(-z*z)
    else:
        numerator = math.erf(z)-math.erf(x-y)-2/math.sqrt(math.pi)*(z-x+y)*math.exp(-z*z)
    return numerator/(2*norm*vlab)


def eta_from_speed_pdf(speed_pdf_1e3_s_per_km: list[float], speeds: list[float], vmin: float) -> float:
    # Published g(v) is a speed probability density in 1e-3 s/km.
    pdf = [q*1e-3 for q in speed_pdf_1e3_s_per_km]
    i = next((j for j, v in enumerate(speeds) if v >= vmin), len(speeds))
    if i == 0 or i == len(speeds):
        raise ValueError("v_min is outside the published geocentric speed grid")
    at_min = pdf[i-1] + (pdf[i]-pdf[i-1])*(vmin-speeds[i-1])/(speeds[i]-speeds[i-1])
    x = [vmin] + speeds[i:]
    y = [at_min] + pdf[i:]
    # eta(vmin)=integral_{vmin}^infty g(v)/v dv; interpolate g at threshold.
    return trapz([density/speed for density, speed in zip(y, x)], x)


def summarize(data: dict, data_sha256: str) -> dict:
    speeds = [float(x) for x in data["speed_geo"]]
    vmin = VMIN_KM_S
    if len(data["haloIDs"]) != 98:
        raise ValueError("Expected the frozen v1 sample of 98 TNG50 halos")
    if any(b <= a for a, b in zip(speeds, speeds[1:])):
        raise ValueError("Geocentric speed grid must be strictly increasing")
    eta_shm_ref = shm_eta(vmin, SOURCE_SHM_V0_KM_S, SOURCE_SHM_VESC_KM_S, SOURCE_SHM_VLAB_KM_S)
    cases: dict[str, object] = {}
    halo_details: dict[str, list[dict]] = {}
    for phase_space in ("scaled", "unscaled"):
        block = data[phase_space]
        distributions = block["geocentric"]["speed_dists"]
        densities = [float(rho) for rho in block["densities"]]
        if len(distributions) != 98 or len(densities) != 98:
            raise ValueError(f"Malformed {phase_space} arrays")
        rows = []
        norms = []
        for halo_id, speed_pdf, rho in zip(data["haloIDs"], distributions, densities):
            if len(speed_pdf) != len(speeds) or any((not math.isfinite(float(x)) or float(x) < 0) for x in speed_pdf):
                raise ValueError(f"Malformed speed PDF for halo {halo_id}")
            pdf = [float(x)*1e-3 for x in speed_pdf]
            norm = trapz(pdf, speeds)
            norms.append(norm)
            if abs(norm-1.0) > 0.005:
                raise ValueError(f"Speed PDF for halo {halo_id} integrates to {norm}, outside 0.5% tolerance")
            eta = eta_from_speed_pdf([float(x) for x in speed_pdf], speeds, vmin)
            eta_ratio = eta/eta_shm_ref
            rate_ratio = rho*eta/(SOURCE_RHO_GEV_CM3*eta_shm_ref)
            rows.append({"halo_id": int(halo_id), "rho_GeV_cm3": rho,
                         "eta_per_km_s": eta, "eta_ratio_to_source_SHM": eta_ratio,
                         "rho_eta_ratio_to_rho0p30_SHM": rate_ratio,
                         "hasGSE": bool(data["hasGSE"][len(rows)]),
                         "hasLMC": bool(data["hasLMC"][len(rows)])})
        etas = [r["eta_per_km_s"] for r in rows]
        eta_ratios = [r["eta_ratio_to_source_SHM"] for r in rows]
        rate_ratios = [r["rho_eta_ratio_to_rho0p30_SHM"] for r in rows]
        rhos = [r["rho_GeV_cm3"] for r in rows]
        rate_quantiles = [quantile(rate_ratios,p) for p in (0,0.16,0.5,0.84,1)]
        cases[phase_space] = {
            "sample_size": len(rows),
            "geocentric_epoch": "2000-03-09 (as specified by the supplement)",
            "speed_pdf_normalization_percentiles": {str(p): quantile(norms,p) for p in (0,0.16,0.5,0.84,1)},
            "fraction_with_nonzero_support_at_vmin": sum(x > 0 for x in etas)/len(etas),
            "rho_GeV_cm3_percentiles_0_16_50_84_100": [quantile(rhos,p) for p in (0,0.16,0.5,0.84,1)],
            "eta_per_km_s_percentiles_0_16_50_84_100": [quantile(etas,p) for p in (0,0.16,0.5,0.84,1)],
            "eta_ratio_to_source_SHM_percentiles_0_16_50_84_100": [quantile(eta_ratios,p) for p in (0,0.16,0.5,0.84,1)],
            "rho_eta_ratio_to_rho0p30_SHM_percentiles_0_16_50_84_100": rate_quantiles,
            "rho_eta_ratio_percentiles_if_local_IDM_fraction_0p9": [0.9*x for x in rate_quantiles],
            "rho_eta_ratio_percentiles_if_local_IDM_fraction_0p1": [0.1*x for x in rate_quantiles],
        }
        halo_details[phase_space] = rows
    near_unity = [i for i, factor in enumerate(data["scale_factors"])
                  if abs(1.0/float(factor)-1.0) < 0.125]
    if len(near_unity) != 7:
        raise ValueError(f"Expected the paper's seven minimally scaled validation halos, found {len(near_unity)}")
    near_unity_validation = {}
    for phase_space in ("scaled", "unscaled"):
        rates = [halo_details[phase_space][i]["rho_eta_ratio_to_rho0p30_SHM"] for i in near_unity]
        near_unity_validation[phase_space] = {
            "sample_size": len(near_unity),
            "halo_ids": [int(data["haloIDs"][i]) for i in near_unity],
            "rho_eta_ratio_to_rho0p30_SHM_percentiles_0_16_50_84_100": [quantile(rates,p) for p in (0,0.16,0.5,0.84,1)],
        }
    return {
        "classification": "published simulation-ensemble fold; not Milky Way posterior or LZ likelihood",
        "source_paper": "https://arxiv.org/abs/2505.07924",
        "source_data": SOURCE_DATA_URL,
        "source_data_sha256": data_sha256,
        "source_data_attribution": "Folsom et al. (2025), CC-BY-4.0 supplemental data, Zenodo record 15374887, v1",
        "benchmark": {"mH_GeV":1080.0,"delta_keV":369.0,"target":"Xe-131","recoil_keV":248.0,
                       "vmin_km_s":vmin,"source_SHM_eta_per_km_s":eta_shm_ref,
                       "source_SHM_density_GeV_cm3":SOURCE_RHO_GEV_CM3,
                       "source_SHM_v0_km_s":SOURCE_SHM_V0_KM_S,"source_SHM_vesc_km_s":SOURCE_SHM_VESC_KM_S,
                       "source_SHM_vlab_km_s":SOURCE_SHM_VLAB_KM_S},
        "data_grid": {"geocentric_bin_count":len(speeds),"min_km_s":speeds[0],"max_km_s":speeds[-1],
                      "pdf_units":"1e-3 s/km","density_speed_pairing":"same simulated halo"},
        "results": cases,
        "near_unity_scaling_validation": near_unity_validation,
        "halos": halo_details,
        "method_limits": [
            "The geocentric PDFs are evaluated for the Earth velocity on 2000-03-09, not annually averaged; the source paper also omits solar gravitational focusing.",
            "Scaled and unscaled TNG50 samples are alternative population constructions, not interchangeable posterior draws. The scaled sample applies the paper's phase-space transformation to match the Milky Way local circular speed.",
            "This transfers only the halo integral and local density into a conditional differential-rate ratio for a 1/v^2 recoil kernel. It does not include LZ efficiencies, isotope response, backgrounds, or likelihood profiling.",
            "The ratio assumes the IDM component traces all local dark matter. For a local IDM fraction f_H, multiply each rho*eta ratio by f_H; its value is not inferred here.",
            "The TNG50 simulation ensemble is a model-based halo-to-halo distribution, not a direct observation or complete posterior for the Milky Way."
        ],
        "falsification_test":"A detector-level prediction must combine one common local component fraction, particle cross section, and response-folded xenon spectrum with the event-level LZ likelihood; the halo fold alone cannot establish the IDM interpretation."
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-json", required=True, help="Folsom-2505-data.json from Zenodo record 15374887 v1")
    parser.add_argument("--output", help="optional JSON output path; defaults beside this script")
    args = parser.parse_args()
    path = Path(args.data_json)
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_DATA_SHA256:
        raise SystemExit(f"Input SHA-256 mismatch: expected {EXPECTED_DATA_SHA256}, got {digest}")
    data = json.loads(raw)
    result = summarize(data, digest)
    output = Path(args.output) if args.output else Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(result["results"], indent=2))

if __name__ == "__main__":
    main()
