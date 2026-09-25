"""Moment-matched Maxwell proxy for the finite-range Yukawa p-wave rate.

Uses the published Stenhouse-release Jeans Milky-Way p-wave moment and its
packaged Boddy dwarf moment to set Maxwell relative-speed PDFs by RMS speed.
The PDFs are explicit proxies, not the source-specific phase-space PDFs.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
from scipy.special import gamma, roots_genlaguerre

HERE = Path(__file__).resolve().parent
POINTWISE = HERE / "casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.py"
OUT = HERE / "casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.json"
REPORT = HERE / "casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.md"
C_KMS = 299_792.458
# Pinned public release inputs: Totani-Reanalysis Public-Release, commit
# e66f34c40a81d883cbcc81079d12b446e3697777.
U_HALO = 1.0099905412758712e-6  # <(v_rel/c)^2>_rho^2, NFW/Jeans ROI
U_DWARF = 9.711106443809227e-9  # Boddy J-weighted summary <(v_rel/c)^2>
ORDERS = (24, 48, 96)

spec = importlib.util.spec_from_file_location("yukawa_pointwise", POINTWISE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load solver at {POINTWISE}")
pointwise = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pointwise)


def average(u_rms: float, order: int, exact: bool) -> float:
    """Average v_rel^2*S1 over a Maxwell PDF matched to <v_rel^2>=u_rms*c^2."""
    mean = np.sqrt(u_rms) * np.sqrt(2.0 / 3.0)
    nodes, weights = roots_genlaguerre(order, 0.5)
    speeds = mean * np.sqrt(np.pi) / 2.0 * np.sqrt(nodes)
    values = []
    for v in speeds:
        s1 = (pointwise.exact_yukawa_pwave(float(v))[0] if exact
              else pointwise.cassel_hulthen_pwave(float(v)))
        values.append(float(v * v) * s1)
    return float(np.dot(weights / gamma(1.5), values))


def main() -> None:
    moments = {"milky_way": U_HALO, "dwarf": U_DWARF}
    rows = {}
    for name, u in moments.items():
        rms = np.sqrt(u) * C_KMS
        mean = rms * np.sqrt(2.0 / 3.0)
        rows[name] = {
            "input_u_rms_relative_squared": u,
            "rms_relative_speed_km_s": float(rms),
            "maxwell_mean_relative_speed_km_s": float(mean),
            "averages_by_order": {},
        }
        for n in ORDERS:
            rows[name]["averages_by_order"][str(n)] = {
                "exact_yukawa_v2S1": average(u, n, exact=True),
                "cassel_hulthen_v2S1": average(u, n, exact=False),
            }

    ex = rows["milky_way"]["averages_by_order"]["96"]["exact_yukawa_v2S1"]
    ed = rows["dwarf"]["averages_by_order"]["96"]["exact_yukawa_v2S1"]
    ca_h = rows["milky_way"]["averages_by_order"]["96"]["cassel_hulthen_v2S1"]
    ca_d = rows["dwarf"]["averages_by_order"]["96"]["cassel_hulthen_v2S1"]
    exact_ratio, cassel_ratio = ed / ex, ca_d / ca_h
    source_ratio = pointwise.SIGMA_V_DWARF_PAPER / pointwise.SIGMA_V_HALO_PAPER
    exact_anchor = pointwise.SIGMA_V_HALO_PAPER * exact_ratio
    convergence = {}
    for name, r in rows.items():
        q = r["averages_by_order"]
        convergence[name] = {
            key: abs(q["96"][key] / q["48"][key] - 1.0)
            for key in ("exact_yukawa_v2S1", "cassel_hulthen_v2S1")
        }
    payload = {
        "classification": "RMS_moment_matched_Maxwell_proxy_not_source_phase_space_or_likelihood",
        "solver": "adjacent exact Yukawa l=1 radial solver compared with Cassel-Hulthen approximation",
        "source_code": {
            "repository": "https://github.com/trinitystenhouse/Totani-Reanalysis",
            "branch": "Public-Release",
            "commit": "e66f34c40a81d883cbcc81079d12b446e3697777",
            "inputs": {
                "u_halo_pwave": U_HALO,
                "u_dwarf_pwave": U_DWARF,
                "u_halo_file": "Totani_reanalysis/velocity_dep/halo_moments.csv",
                "u_dwarf_file": "Totani_reanalysis/velocity_dep/boddy_moments_0d5.csv",
            },
        },
        "kernel": "v_rel^2 * S1(v_rel)",
        "maxwell_definition": "untruncated Maxwell relative-speed PDF; mean=sqrt(2/3)*RMS so its second moment exactly matches supplied u_pwave",
        "quadrature_orders": ORDERS,
        "populations": rows,
        "derived_at_order_96": {
            "exact_yukawa_dwarf_over_halo_rate_ratio": exact_ratio,
            "cassel_hulthen_dwarf_over_halo_rate_ratio": cassel_ratio,
            "source_quoted_representative_rate_ratio": source_ratio,
            "exact_over_cassel_ratio": exact_ratio / cassel_ratio,
            "exact_halo_anchored_dwarf_rate_cm3_s": exact_anchor,
            "exact_anchored_rate_over_source_quoted_dwarf_rate": exact_anchor / pointwise.SIGMA_V_DWARF_PAPER,
            "relative_change_48_to_96": convergence,
        },
        "limits": [
            "The RMS inputs are source-release moments, but a Maxwellian shape is assumed; it is not the release's spatially resolved or per-dwarf phase-space posterior.",
            "Gauss-Laguerre order convergence does not prove all narrow resonance structure is resolved between nodes.",
            "The halo-anchored dwarf rate is a rate-ratio illustration, not a refit to the Fermi data or to stacked dwarf likelihoods.",
            "No relic-density, xenon detector likelihood, Casimir-DP response, or boson-star population calculation is included.",
        ],
    }
    assert all(v < 1.0e-4 for env in convergence.values() for v in env.values())
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(f"""# Jeans-moment-matched Maxwell proxy for the finite-range Yukawa rate

Date: September 25, 2026. This continues the pure-law comparison with a finite-mass mediator, but remains an explicit distribution proxy rather than a source likelihood calculation.

## Calculation

I took the release's NFW/Jeans Milky-Way second relative-speed moment `u_h={U_HALO:.8g}` and its packaged Boddy dwarf J-weighted moment `u_d={U_DWARF:.8g}`. These correspond to RMS relative speeds of {rows['milky_way']['rms_relative_speed_km_s']:.1f} km/s and {rows['dwarf']['rms_relative_speed_km_s']:.1f} km/s. For each system I constructed an untruncated Maxwell relative-speed PDF with that same RMS moment, then averaged `v_rel^2*S1(v_rel)` using Gauss-Laguerre orders {', '.join(map(str, ORDERS))}. This kernel is the p-wave short-distance rate multiplied by the exact attractive Yukawa l=1 enhancement, with the Cassel-Hulthen expression evaluated on the same nodes as a control.

At order 96, the exact Yukawa proxy gives a dwarf/halo rate ratio of **{exact_ratio:.4f}**, versus **{cassel_ratio:.4f}** for Cassel-Hulthen. The paper's representative-speed ratio is **{source_ratio:.4f}**. If only the exact proxy ratio is anchored to the paper's quoted halo rate (`{pointwise.SIGMA_V_HALO_PAPER:.2g} cm^3/s`), it implies `{exact_anchor:.3g} cm^3/s` in dwarfs, about `{exact_anchor / pointwise.SIGMA_V_DWARF_PAPER:.2g}` times the paper's quoted dwarf rate. The 48-to-96 quadrature changes are below `1e-4` for all four averages.

## Interpretation

This adds evidence that the finite-range benchmark's dwarf prediction is sensitive to using the exact Yukawa solution: in this RMS-matched Maxwell proxy it is about 3.8 times the Cassel rate ratio. It does not show that the exact ratio is the astrophysical answer. The public numbers provide second moments, not the full joint distribution in radius, line of sight and velocity; untruncated Maxwell PDFs discard that structure. Narrow p-wave resonances also require dedicated adaptive velocity scans beyond a quadrature-order check.

The next model-quality step is to evaluate the Yukawa kernel against the release's full Jeans velocity field through the Milky-Way ROI and each dwarf's posterior samples, including adaptive resonance resolution, then refit the gamma spectra with a common normalization. Compare that result with thermal abundance before calling the gamma branch viable. The xenon event and Casimir-DP gravitational-residual experiment remain independent observables until the scattering/material response is derived; the ultralight boson star remains a separate component pending a portal and cosmological history.

## Reproduction

Run `python docs/research/casimir-dp-yamashita-yukawa-jeans-moment-maxwell-2026-09-25.py`. Requires NumPy and SciPy; imports the adjacent pointwise Yukawa solver. The JSON records inputs, quadrature values and convergence.

Sources: [Stenhouse et al., arXiv:2607.08552v1](https://arxiv.org/html/2607.08552v1), [public analysis release](https://github.com/trinitystenhouse/Totani-Reanalysis/tree/Public-Release), [Yamashita et al., arXiv:2609.02868v2](https://arxiv.org/abs/2609.02868).
""", encoding="utf-8")
    print(json.dumps(payload["derived_at_order_96"], indent=2))


if __name__ == "__main__":
    main()