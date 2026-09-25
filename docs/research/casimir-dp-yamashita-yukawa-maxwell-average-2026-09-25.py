"""Explore velocity-averaged p-wave rates for the Yamashita Yukawa benchmark.

Uses untruncated Maxwell relative-speed proxies with means set to the paper's
representative velocities. This is not a reconstruction of the paper's halo
or dwarf distributions.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
from scipy.special import gamma, roots_genlaguerre

HERE = Path(__file__).resolve().parent
OUT = HERE / "casimir-dp-yamashita-yukawa-maxwell-average-2026-09-25.json"
REPORT = HERE / "casimir-dp-yamashita-yukawa-maxwell-average-2026-09-25.md"
POINTWISE = HERE / "casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.py"

spec = importlib.util.spec_from_file_location("yukawa_pointwise", POINTWISE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load pointwise solver at {POINTWISE}")
pointwise = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pointwise)

MEAN_SPEEDS = {"milky_way": 1.0e-3, "dwarf": 1.0e-4}
ORDERS = (8, 16, 24)
PAPER_RATE_RATIO = pointwise.SIGMA_V_DWARF_PAPER / pointwise.SIGMA_V_HALO_PAPER


def maxwell_average_v2s1(mean_speed: float, order: int, exact: bool) -> float:
    """Integrate v^2*S1 against a 3-D Maxwell speed PDF using Gauss-Laguerre."""
    nodes, weights = roots_genlaguerre(order, 0.5)
    scale = mean_speed * np.sqrt(np.pi) / 2.0
    speeds = scale * np.sqrt(nodes)
    factors = []
    for speed in speeds:
        s1 = (
            pointwise.exact_yukawa_pwave(float(speed))[0]
            if exact
            else pointwise.cassel_hulthen_pwave(float(speed))
        )
        factors.append(speed**2 * s1)
    return float(np.dot(weights / gamma(1.5), factors))


def main() -> None:
    rows = {}
    for population, mean_speed in MEAN_SPEEDS.items():
        rows[population] = {"mean_relative_speed": mean_speed, "quadrature": {}}
        for order in ORDERS:
            rows[population]["quadrature"][str(order)] = {
                "Cassel_Hulthen_avg_v2S1": maxwell_average_v2s1(mean_speed, order, exact=False),
                "exact_Yukawa_avg_v2S1": maxwell_average_v2s1(mean_speed, order, exact=True),
            }

    final = {key: val["quadrature"]["24"] for key, val in rows.items()}
    cassel_ratio = final["dwarf"]["Cassel_Hulthen_avg_v2S1"] / final["milky_way"]["Cassel_Hulthen_avg_v2S1"]
    exact_ratio = final["dwarf"]["exact_Yukawa_avg_v2S1"] / final["milky_way"]["exact_Yukawa_avg_v2S1"]
    halo_anchored_dwarf = pointwise.SIGMA_V_HALO_PAPER * exact_ratio
    convergence = {}
    for population, data in rows.items():
        q = data["quadrature"]
        convergence[population] = {
            "Cassel_16_to_24_relative_change": abs(q["24"]["Cassel_Hulthen_avg_v2S1"] / q["16"]["Cassel_Hulthen_avg_v2S1"] - 1.0),
            "exact_16_to_24_relative_change": abs(q["24"]["exact_Yukawa_avg_v2S1"] / q["16"]["exact_Yukawa_avg_v2S1"] - 1.0),
        }

    payload = {
        "classification": "illustrative_Maxwell_proxy_average_not_source_distribution_or_gamma_fit",
        "inputs": {
            "m_X_GeV": pointwise.M_X_GEV,
            "alpha_eff": pointwise.ALPHA_EFF,
            "mediator_mass_GeV": pointwise.M_MED_GEV,
            "distribution": "untruncated Maxwell speed PDF f(v)=4/sqrt(pi)*v^2/a^3*exp(-v^2/a^2), a=mean_speed*sqrt(pi)/2",
            "mean_relative_speed_proxies": MEAN_SPEEDS,
            "quadrature_orders": ORDERS,
            "integrand": "v_relative^2 * S1(v_relative), appropriate for a short-distance p-wave sigma*v proportional to v^2*S1",
        },
        "averages": rows,
        "derived_24_point": {
            "paper_representative_rate_ratio_dwarf_over_halo": PAPER_RATE_RATIO,
            "Cassel_Maxwell_proxy_rate_ratio_dwarf_over_halo": cassel_ratio,
            "exact_Yukawa_Maxwell_proxy_rate_ratio_dwarf_over_halo": exact_ratio,
            "exact_over_Cassel_proxy_ratio": exact_ratio / cassel_ratio,
            "exact_proxy_ratio_over_paper_point_ratio": exact_ratio / PAPER_RATE_RATIO,
            "dwarf_rate_if_proxy_ratio_anchored_to_paper_halo_rate_cm3_s": halo_anchored_dwarf,
            "quadrature_convergence_16_to_24": convergence,
        },
        "limits": [
            "The source supplies representative speeds, not the relative-speed distributions; matching their mean with an untruncated Maxwell law is an explicit proxy assumption.",
            "The proxy is not truncated at an escape speed, though its Maxwell tail above the Galactic relative escape cap is negligible for the chosen mean; it is still not a source-specific halo or dwarf model.",
            "The paper quotes fixed-velocity factors and reports omitting narrow resonances; the exact Yukawa average can retain unresolved narrow structure between quadrature nodes.",
            "The halo-anchored dwarf rate is a ratio illustration, not a gamma-spectrum refit, dwarf-likelihood test, relic calculation, or exclusion.",
            "No xenon recoil or Casimir-DP material response is included; those bridges remain open.",
        ],
        "checks": {
            "Cassel_proxy_converges_within_1e_minus_3": all(v["Cassel_16_to_24_relative_change"] < 1.0e-3 for v in convergence.values()),
            "exact_proxy_converges_within_1e_minus_3": all(v["exact_16_to_24_relative_change"] < 1.0e-3 for v in convergence.values()),
            "exact_dwarf_over_halo_exceeds_Cassel_proxy": exact_ratio > cassel_ratio,
            "rate_convention_is_explicit": True,
        },
    }
    assert all(payload["checks"].values())
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    halo = rows["milky_way"]["quadrature"]
    dwarf = rows["dwarf"]["quadrature"]
    REPORT.write_text(
        f"""# Maxwell-proxy average of the p-wave Yukawa enhancement

Date: September 25, 2026. This is a controlled distribution proxy, not a reconstruction of the source paper's astrophysical averages.

## Method

For each environment, use an untruncated Maxwell relative-speed PDF `f(v)=4/sqrt(pi) v^2/a^3 exp(-v^2/a^2)` and set its mean to the paper's representative speed (`1e-3` for the Milky Way, `1e-4` for dwarfs). Average `v^2*S1(v)` using Gauss-Laguerre quadrature at orders 8, 16 and 24. Compare Cassel's Hulthen approximation with the direct Yukawa radial solver from the [pointwise cross-check](casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.md).

The order-24 exact Yukawa proxy gives dwarf/halo `sigma*v = {exact_ratio:.4g}`; Cassel gives `{cassel_ratio:.4g}`. The source's representative-speed rate ratio is `{PAPER_RATE_RATIO:.4g}`. Anchoring only the exact proxy ratio to the paper's Milky-Way rate would imply a dwarf rate of `{halo_anchored_dwarf:.3e} cm^3/s`, about `{halo_anchored_dwarf / pointwise.SIGMA_V_DWARF_PAPER:.2g}` times the quoted source dwarf rate. That anchoring is illustrative only; it does not preserve the source model's likelihood fit.

The exact-to-Cassel ratio of averages is `{exact_ratio / cassel_ratio:.3g}`. Orders 16 and 24 agree to less than 0.1% for both implementations, an encouraging quadrature check. It does not prove narrow resonances between nodes have been fully resolved; the velocity grid and ODE tolerances need targeted refinement around peaks before treating this as a prediction.

## Interpretation

The finite-range p-wave hierarchy still favors the Milky Way over dwarfs in this proxy, but the exact Yukawa and Cassel averages differ materially. The previous unsaturated-Coulomb estimate remains a limiting scaling, not a substitute for this mediator-specific calculation. The original model's gamma interpretation is therefore unresolved until the source's distribution convention, resonance averaging, spectral likelihoods and uncertainty treatment are reproduced. This result does not create an LZ/Casimir-DP connection and does not promote the single-field branch.

Next refine the exact velocity grid adaptively around resonance structure, then fold the p-wave rates through the source gamma spectra and the dwarf likelihoods. Keep the separate ultralight star field plus the finite-range heavy particle as the stronger architecture unless that common-field candidate survives the averaged gamma test and yields an independently calculable detector response.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-yukawa-maxwell-average-2026-09-25.py`; this imports the adjacent pointwise solver. Requires NumPy and SciPy. The JSON records every order and convergence metric.

Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2); [Cassel, arXiv:0903.5307](https://arxiv.org/html/0903.5307).
""",
        encoding="utf-8",
    )
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
