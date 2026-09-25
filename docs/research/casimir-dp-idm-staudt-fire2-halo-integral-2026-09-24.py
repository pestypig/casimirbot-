"""Fold the Staudt et al. FIRE-2 local DM speed model through an IDM Xe recoil.

The model is isotropic in the Galactic frame; this screen applies a fixed
magnitude lab boost and computes the halo integral by direct quadrature. It is
not an LZ likelihood or a fitted Milky Way phase-space posterior.
"""
from __future__ import annotations
import json, math
from pathlib import Path

VMIN = 786.009560806017  # km/s; 1080 GeV, Xe-131, delta=369 keV, ER=248 keV
VLAB = 254.0
K = 0.0350


def simpson(func, a: float, b: float, n: int) -> float:
    if n % 2: n += 1
    h = (b - a) / n
    total = func(a) + func(b)
    total += 4.0 * sum(func(a + i*h) for i in range(1, n, 2))
    total += 2.0 * sum(func(a + i*h) for i in range(2, n, 2))
    return total * h / 3.0


def sigmoid(x: float) -> float:
    if x >= 0:
        e = math.exp(-x)
        return 1.0 / (1.0 + e)
    e = math.exp(x)
    return e / (1.0 + e)


def unnormalized_gal_speed_density(v: float, v0: float, vdamp: float) -> float:
    # f_gal(v) in 3D velocity space, before normalization.
    return math.exp(-(v/v0)**2) * sigmoid(K*(vdamp-v))


def normalization(v0: float, vdamp: float) -> float:
    return simpson(lambda v: 4*math.pi*v*v*unnormalized_gal_speed_density(v, v0, vdamp), 0, 1600, 2400)


def eta_fire(vmin: float, v0: float, vdamp: float, n_speed: int = 1200, n_mu: int = 300) -> float:
    """eta=integral_{|u|>vmin} f_gal(|u+v_lab|)/|u| d^3u."""
    norm = normalization(v0, vdamp)
    def angular_integral(speed: float) -> float:
        def at_mu(mu: float) -> float:
            vg = math.sqrt(max(0.0, speed*speed + VLAB*VLAB + 2*speed*VLAB*mu))
            return unnormalized_gal_speed_density(vg, v0, vdamp) / norm
        return simpson(at_mu, -1.0, 1.0, n_mu)
    return 2*math.pi*simpson(lambda speed: speed*angular_integral(speed), vmin, 1600.0, n_speed)


def eta_fire_galactic_speed_band(vmin: float, v0: float, vdamp: float,
                                 gal_speed_max: float | None,
                                 n_speed: int = 1200, n_mu: int = 400) -> float:
    """Portion of eta contributed by a Galactic-frame speed interval [0,max] or (max,infinity)."""
    norm = normalization(v0, vdamp)
    threshold = 2.30 * v0
    def angular_integral(speed: float) -> float:
        def at_mu(mu: float) -> float:
            vg = math.sqrt(max(0.0, speed*speed + VLAB*VLAB + 2*speed*VLAB*mu))
            selected = vg <= threshold if gal_speed_max is not None else vg > threshold
            return unnormalized_gal_speed_density(vg, v0, vdamp) / norm if selected else 0.0
        return simpson(at_mu, -1.0, 1.0, n_mu)
    return 2*math.pi*simpson(lambda speed: speed*angular_integral(speed), vmin, 1600.0, n_speed)


def eta_truncated_shm(vmin: float, v0: float, vesc: float, vlab: float) -> float:
    z, x, y = vesc/v0, vmin/v0, vlab/v0
    norm = math.erf(z) - 2/math.sqrt(math.pi)*z*math.exp(-z*z)
    if vmin >= vesc + vlab: return 0.0
    if vmin < vesc - vlab:
        numerator = math.erf(x+y)-math.erf(x-y)-4/math.sqrt(math.pi)*y*math.exp(-z*z)
    else:
        numerator = math.erf(z)-math.erf(x-y)-2/math.sqrt(math.pi)*(z-x+y)*math.exp(-z*z)
    return numerator/(2*norm*vlab)


def main() -> None:
    source = eta_truncated_shm(VMIN, 238.0, 544.0, VLAB)
    central_eta = eta_fire(VMIN, 257.0, 455.0, 1200, 400)
    eta_within_paper_band = eta_fire_galactic_speed_band(VMIN, 257.0, 455.0, 2.30*257.0)
    eta_beyond_paper_band = eta_fire_galactic_speed_band(VMIN, 257.0, 455.0, None)
    assert abs((eta_within_paper_band + eta_beyond_paper_band) / central_eta - 1.0) < 1e-10
    assert abs(eta_fire(VMIN, 257.0, 455.0, 600, 200) / central_eta - 1.0) < 2e-5
    cases = [
        ("central", 257.0, 455.0),
        ("parameter low corner (diagnostic only)", 249.0, 447.0),
        ("parameter high corner (diagnostic only)", 265.0, 463.0),
    ]
    outputs = []
    for label, v0, vdamp in cases:
        eta = eta_fire(VMIN, v0, vdamp)
        outputs.append({"case": label, "v0_km_s": v0, "vdamp_km_s": vdamp,
            "k_per_km_s": K, "lab_boost_km_s": VLAB,
            "eta_per_km_s": eta, "eta_ratio_to_IDM_source_SHM": eta/source,
            "rho_times_eta_ratio_vs_rho_0p3_SHM": (0.42/0.3)*eta/source,
            "minimum_galactic_speed_that_can_contribute_km_s": VMIN-VLAB})
    result = {
        "classification": "conditional simulation-calibrated halo-integral screen; not LZ likelihood or dark-matter evidence",
        "source": "https://arxiv.org/html/2403.04122",
        "recoil_benchmark_source": "https://arxiv.org/html/2609.06571",
        "model": {"form": "f_gal(v) proportional exp(-(v/v0)^2)/(1+exp(-k*(vdamp-v)))", "k_per_km_s": K,
                  "Staudt_Fire2_MW_central_v0_km_s": 257.0, "Staudt_Fire2_MW_central_vdamp_km_s": 455.0,
                  "paper_reported_parameter_intervals_km_s": {"v0": [249.0,265.0], "vdamp": [447.0,463.0]},
                  "density_GeV_cm3": 0.42, "density_uncertainty_GeV_cm3": 0.06},
        "inputs": {"vmin_km_s": VMIN, "v_lab_magnitude_km_s_fixed_to_IDM_source": VLAB,
                   "IDM_SHM_v0_km_s":238.0, "IDM_SHM_vesc_km_s":544.0,
                   "source_SHM_eta_per_km_s":source},
        "central_tail_diagnostic": {
            "paper_systematic_table_max_galactic_speed_km_s": 2.30*257.0,
            "eta_contribution_at_or_below_table_max_per_km_s": eta_within_paper_band,
            "eta_contribution_above_table_max_per_km_s": eta_beyond_paper_band,
            "fraction_of_central_eta_from_un_tabulated_tail": eta_beyond_paper_band/central_eta,
            "relative_eta_quadrature_change_600x200_vs_1200x300": abs(eta_fire(VMIN,257.0,455.0,600,200)/central_eta-1.0),
        },
        "outputs": outputs,
        "method_limits": [
            "Assumes the paper's isotropic Galactic-frame speed distribution and applies a fixed-magnitude 254 km/s lab boost; no annual modulation, velocity anisotropy, or streams are modeled.",
            "The paper's quoted total galaxy-to-galaxy systematic band is not propagated. Its tabulated residuals stop at v/v0=2.30, while the threshold requires Galactic-frame speeds of at least 532 km/s; tail extrapolation is therefore a material limitation.",
            "The plus/minus parameter corner cases vary v0 and vdamp independently and are diagnostic envelopes, not joint posterior intervals.",
            "The rho-times-eta comparison assumes rho=0.42 GeV/cm^3 for this model and rho=0.30 GeV/cm^3 for the source SHM; the ratio is a conditional normalization comparison, not a detector prediction."
        ],
        "falsification_test": "A common-convention Milky Way velocity model with adequately quantified high-speed tail uncertainty must provide a robust, non-negligible halo integral at vmin=786 km/s before this inelastic xenon benchmark can be treated as a stable prediction."
    }
    Path(__file__).with_suffix('.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result, indent=2))

if __name__ == '__main__': main()
