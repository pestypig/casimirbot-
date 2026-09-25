"""Reproduce the shape-only inelastic SI xenon sideband screen.

This calculation follows the assumptions in arXiv:2609.26698v1. It does not
fit LZ data, infer a cross section, or treat the 248 keV candidate as signal.
The signal-window integral is used only as a denominator for shape ratios.
Requires NumPy and SciPy.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from scipy.special import erf


ISOTOPES = np.array([128, 129, 130, 131, 132, 134, 136], dtype=float)
# Natural atom fractions, rounded values from standard natural-xenon tables.
ABUNDANCE = np.array([0.01910, 0.26401, 0.04071, 0.21232, 0.26909, 0.10436, 0.08857])
ABUNDANCE /= ABUNDANCE.sum()
GEV_PER_U = 0.93149410242
HBARC_GEV_FM = 0.1973269804
C_KM_S = 299_792.458
V0_KM_S = 238.0
VE_KM_S = 232.0
VESC_KM_S = 544.0
SIGNAL_WINDOW_KEV = (225.0, 271.0)
SIDEBANDS_KEV = ((14.0, 225.0), (271.0, 800.0))
INTEGRATION_N = 4001  # odd number; trapezoid convergence checked against 8001


def mean_inverse_speed(vmin_km_s: np.ndarray) -> np.ndarray:
    """Truncated, shifted Maxwellian eta(vmin), up to the common unit factor."""
    z = VESC_KM_S / V0_KM_S
    normalization = erf(z) - 2.0 * z / math.sqrt(math.pi) * math.exp(-z * z)
    a = (vmin_km_s + VE_KM_S) / V0_KM_S
    b = (vmin_km_s - VE_KM_S) / V0_KM_S
    low = (
        erf(a)
        - erf(b)
        - 4.0 * VE_KM_S / (math.sqrt(math.pi) * V0_KM_S) * math.exp(-z * z)
    ) / (2.0 * normalization * VE_KM_S)
    high = (
        erf(z)
        - erf(b)
        - 2.0 / math.sqrt(math.pi)
        * (VESC_KM_S + VE_KM_S - vmin_km_s) / V0_KM_S
        * math.exp(-z * z)
    ) / (2.0 * normalization * VE_KM_S)
    return np.where(
        vmin_km_s < VESC_KM_S - VE_KM_S,
        low,
        np.where(vmin_km_s < VESC_KM_S + VE_KM_S, high, 0.0),
    )


def helm_form_factor_squared(a: float, recoil_kev: np.ndarray) -> np.ndarray:
    """Helm F^2 using R=1.2 A^(1/3) fm, skin s=0.9 fm."""
    mass_gev = a * GEV_PER_U
    recoil_gev = recoil_kev * 1.0e-6
    q_fm_inv = np.sqrt(2.0 * mass_gev * recoil_gev) / HBARC_GEV_FM
    skin_fm = 0.9
    radius_fm = 1.2 * a ** (1.0 / 3.0)
    effective_radius_fm = math.sqrt(radius_fm * radius_fm - 5.0 * skin_fm * skin_fm)
    x = q_fm_inv * effective_radius_fm
    safe_x = np.maximum(x, 1.0e-14)
    spherical_j1 = np.sin(safe_x) / safe_x**2 - np.cos(safe_x) / safe_x
    form = 3.0 * spherical_j1 / safe_x * np.exp(-0.5 * (q_fm_inv * skin_fm) ** 2)
    form = np.where(x < 1.0e-7, 1.0, form)
    return form * form


def differential_shape(mchi_gev: float, delta_kev: float, recoil_kev: np.ndarray) -> np.ndarray:
    """dR/dE shape for coherent SI endothermic scattering; common factors cancel."""
    recoil_gev = recoil_kev * 1.0e-6
    shape = np.zeros_like(recoil_kev, dtype=float)
    for a, abundance in zip(ISOTOPES, ABUNDANCE, strict=True):
        nucleus_gev = a * GEV_PER_U
        reduced_gev = mchi_gev * nucleus_gev / (mchi_gev + nucleus_gev)
        vmin = (
            (nucleus_gev * recoil_gev / reduced_gev + delta_kev * 1.0e-6)
            / np.sqrt(2.0 * nucleus_gev * recoil_gev)
            * C_KM_S
        )
        # rho/mchi, common normalization, and mu_chi-p terms cancel in ratios.
        # Number-abundance weighting and coherent A^2 are retained.
        shape += (
            abundance
            * a**2
            * helm_form_factor_squared(a, recoil_kev)
            * mean_inverse_speed(vmin)
        )
    return shape


def integrate_shape(
    mchi_gev: float, delta_kev: float, interval_kev: tuple[float, float], n: int = INTEGRATION_N
) -> float:
    energy = np.linspace(interval_kev[0], interval_kev[1], n)
    return float(np.trapezoid(differential_shape(mchi_gev, delta_kev, energy), energy))


def sideband_ratios(mchi_gev: float, delta_kev: float, n: int = INTEGRATION_N) -> tuple[float, float]:
    signal = integrate_shape(mchi_gev, delta_kev, SIGNAL_WINDOW_KEV, n)
    if signal <= 0.0:
        return math.inf, math.inf
    return tuple(integrate_shape(mchi_gev, delta_kev, interval, n) / signal for interval in SIDEBANDS_KEV)


def balanced_point(mchi_gev: float) -> dict[str, float]:
    """Find N_low/N_sig = N_high/N_sig by bisection in the published scan region."""
    bracket = None
    previous = None
    for delta in np.arange(200.0, 451.0, 1.0):
        ratios = sideband_ratios(mchi_gev, float(delta))
        difference = ratios[0] - ratios[1]
        if math.isfinite(difference):
            if previous is not None and previous[1] * difference < 0.0:
                bracket = (previous[0], float(delta), previous[1], difference)
                break
            previous = (float(delta), difference)
    if bracket is None:
        raise ValueError(f"No finite balanced point bracket for mchi={mchi_gev} GeV")
    lo, hi, flo, fhi = bracket
    for _ in range(28):
        mid = 0.5 * (lo + hi)
        rlow, rhigh = sideband_ratios(mchi_gev, mid)
        fmid = rlow - rhigh
        if flo * fmid > 0.0:
            lo, flo = mid, fmid
        else:
            hi, fhi = mid, fmid
    delta = 0.5 * (lo + hi)
    low_ratio, high_ratio = sideband_ratios(mchi_gev, delta)
    total = low_ratio + high_ratio
    # Probability of zero events in both sidebands if N_sig is normalized to 1.
    p_zero = math.exp(-total)
    z_one_sided = _normal_quantile(1.0 - p_zero)
    return {
        "mass_GeV": mchi_gev,
        "delta_balanced_keV": delta,
        "low_sideband_over_signal": low_ratio,
        "high_sideband_over_signal": high_ratio,
        "sum_sideband_over_signal": total,
        "zero_sideband_probability_conditional_on_Nsig_1": p_zero,
        "one_sided_gaussian_equivalent_sigma_conditional": z_one_sided,
    }


def _normal_quantile(probability: float) -> float:
    """Inverse standard-normal CDF by bisection, avoiding another dependency."""
    lo, hi = -10.0, 10.0
    for _ in range(100):
        mid = 0.5 * (lo + hi)
        cdf = 0.5 * (1.0 + math.erf(mid / math.sqrt(2.0)))
        if cdf < probability:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def main() -> None:
    masses = [500.0, 700.0, 1000.0, 1500.0, 2000.0, 3000.0]
    balanced = [balanced_point(mass) for mass in masses]
    table1_deltas = [280.0, 295.0, 310.0, 325.0, 339.0, 355.0]
    table1 = [
        {
            "delta_keV": delta,
            "low_sideband_over_signal": sideband_ratios(1000.0, delta)[0],
            "high_sideband_over_signal": sideband_ratios(1000.0, delta)[1],
        }
        for delta in table1_deltas
    ]
    recoil = np.array([248.0])
    form_factor_squared = sum(
        abundance * helm_form_factor_squared(a, recoil)[0]
        for a, abundance in zip(ISOTOPES, ABUNDANCE, strict=True)
    )
    # Coarse/fine integration convergence at the 1 TeV balanced point.
    point = balanced_point(1000.0)
    fine = sideband_ratios(1000.0, point["delta_balanced_keV"], n=8001)
    coarse = (point["low_sideband_over_signal"], point["high_sideband_over_signal"])
    convergence_max_relative = max(abs(a - b) / b for a, b in zip(coarse, fine, strict=True))
    out = {
        "evidence_class": "shape-only reproduction of a published coherent-SI inelastic sideband screen",
        "source": "https://arxiv.org/abs/2609.26698v1",
        "inputs": {
            "isotopes_A": ISOTOPES.astype(int).tolist(),
            "natural_atom_fractions_rounded_and_renormalized": ABUNDANCE.tolist(),
            "halo_model": "truncated Standard Halo Model",
            "v0_km_s": V0_KM_S,
            "earth_speed_km_s": VE_KM_S,
            "galactic_escape_speed_km_s": VESC_KM_S,
            "helm_R_fm": "1.2 A^(1/3)",
            "helm_skin_fm": 0.9,
            "windows_keV": {
                "low": list(SIDEBANDS_KEV[0]),
                "signal": list(SIGNAL_WINDOW_KEV),
                "high": list(SIDEBANDS_KEV[1]),
            },
            "masses_GeV": masses,
        },
        "outputs": {
            "balanced_points": balanced,
            "one_TeV_table1_reproduction": table1,
            "natural_xenon_Helm_F2_at_248_keV": form_factor_squared,
            "integration_grid_convergence_max_relative_at_1_TeV": convergence_max_relative,
            "published_LZ_response_context_not_used_in_shape_integrals": {
                "WIMP_ROI_S1c_phd": [3.0, 600.0],
                "WIMP_ROI_min_S2_phd": 645.0,
                "WIMP_ROI_S2c_phd": [10.0**2.75, 10.0**4.15],
                "reported_average_NR_efficiency_energy_keV": [14.0, 250.0],
                "candidate_event_recoil_keV": 248.0,
                "candidate_event_S1c_phd": 540.1,
                "naive_linear_S1_upper_cut_proxy_keV": 600.0 * 248.0 / 540.1,
                "high_energy_S1_background_validation_sideband_phd": [800.0, 1700.0],
                "caveat": "The candidate is 1.5 sigma below the NR-band median; event S1 divided by event recoil energy is not a calibrated mean-response model. The S1-space background sideband is not the true-recoil 271-800 keV sideband.",
            },
        },
        "interpretation_limits": [
            "Each ratio divides by the signal-window integral; the published N_sig=1 normalization is used only to express shape ratios and is not a dark-matter event fit.",
            "This is not the LZ detector likelihood or a reconstruction of the event acceptance, energy resolution, backgrounds, or released profile likelihood. LZ reports average NR efficiency only for 14-250 keV; the 271-800 keV sideband was not folded through that response here.",
            "The result is conditional on coherent, momentum-independent SI nuclear scattering, natural xenon, the specified Helm form factor, and the truncated SHM.",
            "The quoted 0.6-3.5 sigma halo/form-factor envelope is from the source preprint and was not independently scanned here.",
            "A mediator with nontrivial q dependence, noncoherent operators, isotope-specific interactions, or a nonstandard velocity distribution requires a new calculation.",
        ],
    }
    output_path = Path(__file__).with_suffix(".json")
    output_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
