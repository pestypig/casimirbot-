"""Bracket p-wave Yukawa averages over a range of proxy velocity widths.

Maxwell relative-speed means are varied around the representative halo/dwarf
speeds in Yamashita et al. This is an uncertainty screen, not a fitted halo.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
from scipy.special import gamma, roots_genlaguerre

HERE = Path(__file__).resolve().parent
OUT = HERE / "casimir-dp-yamashita-yukawa-speed-width-sensitivity-2026-09-25.json"
REPORT = HERE / "casimir-dp-yamashita-yukawa-speed-width-sensitivity-2026-09-25.md"
POINTWISE = HERE / "casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.py"
spec = importlib.util.spec_from_file_location("yukawa_pointwise", POINTWISE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load pointwise solver at {POINTWISE}")
pointwise = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pointwise)

BASE_MEAN = {"milky_way": 1.0e-3, "dwarf": 1.0e-4}
MEAN_MULTIPLIERS = (0.5, 1.0, 2.0)
ORDERS = (24, 48)


def average(mean_speed: float, order: int, exact: bool) -> float:
    nodes, weights = roots_genlaguerre(order, 0.5)
    scale = mean_speed * np.sqrt(np.pi) / 2.0
    values = []
    for node in nodes:
        speed = scale * np.sqrt(node)
        s1 = pointwise.exact_yukawa_pwave(float(speed))[0] if exact else pointwise.cassel_hulthen_pwave(float(speed))
        values.append(speed**2 * s1)
    return float(np.dot(weights / gamma(1.5), values))


def main() -> None:
    means = {
        population: {str(mult): base * mult for mult in MEAN_MULTIPLIERS}
        for population, base in BASE_MEAN.items()
    }
    result = {}
    for population, population_means in means.items():
        result[population] = {}
        for mult, mean in population_means.items():
            result[population][mult] = {"mean_relative_speed": mean, "quadrature": {}}
            for order in ORDERS:
                result[population][mult]["quadrature"][str(order)] = {
                    "Cassel_avg_v2S1": average(mean, order, False),
                    "exact_Yukawa_avg_v2S1": average(mean, order, True),
                }

    pairs = {}
    for halo_mult in map(str, MEAN_MULTIPLIERS):
        for dwarf_mult in map(str, MEAN_MULTIPLIERS):
            h = result["milky_way"][halo_mult]["quadrature"]["48"]
            d = result["dwarf"][dwarf_mult]["quadrature"]["48"]
            pairs[f"halo_x{halo_mult}_dwarf_x{dwarf_mult}"] = {
                "Cassel_dwarf_over_halo_rate_ratio": d["Cassel_avg_v2S1"] / h["Cassel_avg_v2S1"],
                "exact_Yukawa_dwarf_over_halo_rate_ratio": d["exact_Yukawa_avg_v2S1"] / h["exact_Yukawa_avg_v2S1"],
            }

    convergence = {}
    for population, population_means in result.items():
        for mult, data in population_means.items():
            q24 = data["quadrature"]["24"]
            q48 = data["quadrature"]["48"]
            convergence[f"{population}_x{mult}"] = {
                "Cassel_24_to_48_relative_change": abs(q48["Cassel_avg_v2S1"] / q24["Cassel_avg_v2S1"] - 1.0),
                "exact_24_to_48_relative_change": abs(q48["exact_Yukawa_avg_v2S1"] / q24["exact_Yukawa_avg_v2S1"] - 1.0),
            }

    exact_ratios = [row["exact_Yukawa_dwarf_over_halo_rate_ratio"] for row in pairs.values()]
    cassel_ratios = [row["Cassel_dwarf_over_halo_rate_ratio"] for row in pairs.values()]
    payload = {
        "classification": "Maxwell_proxy_velocity_width_sensitivity_not_astrophysical_fit",
        "inputs": {
            "m_X_GeV": pointwise.M_X_GEV,
            "alpha_eff": pointwise.ALPHA_EFF,
            "mediator_mass_GeV": pointwise.M_MED_GEV,
            "distribution": "untruncated Maxwell relative-speed PDF, mean varied by 0.5x, 1x, 2x around the paper's representative speed",
            "base_mean_relative_speeds": BASE_MEAN,
            "mean_multipliers": MEAN_MULTIPLIERS,
            "quadrature_orders": ORDERS,
        },
        "averaged_rates": result,
        "dwarf_halo_combinations_order48": pairs,
        "derived": {
            "exact_ratio_envelope": [min(exact_ratios), max(exact_ratios)],
            "Cassel_ratio_envelope": [min(cassel_ratios), max(cassel_ratios)],
            "exact_ratios_all_below_unity": max(exact_ratios) < 1.0,
            "exact_ratios_exceed_Cassel_for_all_pairs": all(pairs[k]["exact_Yukawa_dwarf_over_halo_rate_ratio"] > pairs[k]["Cassel_dwarf_over_halo_rate_ratio"] for k in pairs),
            "quadrature_24_to_48_changes": convergence,
        },
        "limits": [
            "Mean speed variation is a proxy width sensitivity, not an uncertainty posterior or a source-specific velocity distribution.",
            "No truncation, anisotropy, substructure, spatially varying central halo, or dwarf-specific Jeans model is included.",
            "Gauss-Laguerre order convergence does not guarantee narrow resonance peaks between nodes are resolved; targeted adaptive integration remains necessary.",
            "No Fermi-LAT spectral likelihood, LZ refit, xenon scattering change, or Casimir-DP response is calculated.",
        ],
        "checks": {
            "all_exact_24_to_48_changes_below_1_percent": all(v["exact_24_to_48_relative_change"] < 0.01 for v in convergence.values()),
            "all_Cassel_24_to_48_changes_below_1_percent": all(v["Cassel_24_to_48_relative_change"] < 0.01 for v in convergence.values()),
            "dwarf_rate_lower_than_halo_over_tested_proxy_grid": max(exact_ratios) < 1.0,
        },
    }
    assert all(payload["checks"].values())
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(
        f"""# Velocity-width sensitivity of the p-wave Yukawa rate

Date: September 25, 2026. This brackets the earlier Maxwell-proxy average; it is not a source-specific astrophysical fit.

## Scan definition

Hold the 420 GeV mass, 0.2 attractive strength and 400 MeV mediator fixed. For each population, use untruncated Maxwell relative-speed proxies and vary the mean speed by factors 0.5, 1 and 2 around the paper's representative values (`1e-3` Milky Way, `1e-4` dwarf). Average `v^2*S1(v)` at Gauss-Laguerre orders 24 and 48, then take all nine halo/dwarf combinations.

Across these combinations, the exact Yukawa dwarf/halo rate ratio ranges from `{min(exact_ratios):.4g}` to `{max(exact_ratios):.4g}`; the Cassel Hulthen proxy ranges from `{min(cassel_ratios):.4g}` to `{max(cassel_ratios):.4g}`. The exact ratio stays below one across this proxy grid, so the Milky Way remains the brighter annihilation environment under the tested finite-range potential, while the exact calculation gives a larger dwarf share than Cassel in every pair. Order-24 to order-48 changes are below 1% at every tested width (see JSON).

This tests only the velocity-width sensitivity under one assumed family. It does not resolve resonances between nodes, model the Milky Way center or individual dwarf phase spaces, or compare to gamma likelihoods. Do not interpret the envelope as a confidence interval or use it to accept/reject the paper's signal explanation.

## Consequence for the boson-star connection

The ultralight mediator substitution is still qualitatively different: its unsaturated Coulomb p-wave scaling raises the relative dwarf rate as velocity falls, whereas the finite 400 MeV Yukawa branch remains halo-enhanced in this proxy range. This makes a separate ultralight star-forming component with a finite-range heavy particle the less strained architecture at this stage. Neither architecture yet provides the required same-parameter xenon plus Casimir-DP prediction; the 316 keV inelastic carbon channel remains closed.

Next replace the proxy family with truncated halo distributions and dwarf-specific kinematic models, adaptively resolve exact Yukawa peaks, and refold a common annihilation spectrum through Galactic and dwarf likelihoods. The gamma-side test must pass before expanding the shared-field branch.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-yukawa-speed-width-sensitivity-2026-09-25.py`. It imports the adjacent pointwise solver and requires NumPy/SciPy. All proxy means, quadrature orders, pairwise ratios and convergence checks are saved in JSON.

Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2); [Cassel, arXiv:0903.5307](https://arxiv.org/html/0903.5307).
""",
        encoding="utf-8",
    )
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
