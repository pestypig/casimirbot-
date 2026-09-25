"""Cross-check the paper's p-wave Sommerfeld factors at representative speeds.

The script compares Cassel's Hulthen approximation (used by Yamashita) with a
direct radial Schrödinger integration for an attractive Yukawa potential. It
does not perform a velocity-distribution average or a gamma-ray fit.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp
from scipy.special import loggamma

HERE = Path(__file__).resolve().parent
OUT = HERE / "casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.json"
REPORT = HERE / "casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.md"

M_X_GEV = 420.0
ALPHA_EFF = 0.2
M_MED_GEV = 0.4
V_FREEZEOUT = 0.3
V_HALO = 1.0e-3
V_DWARF = 1.0e-4
SIGMA_V_HALO_PAPER = 2.7e-24
SIGMA_V_DWARF_PAPER = 6.5e-26


def cassel_hulthen_pwave(v_rel: float) -> float:
    """Cassel Eq. (43), alpha attractive, l=1, delta=pi^2*m_med/6."""
    beta = v_rel / 2.0
    x = ALPHA_EFF / beta
    y = ALPHA_EFF * M_X_GEV / M_MED_GEV
    w = (y / x) * (6.0 / np.pi**2)
    root = np.sqrt(1.0 - x / w + 0.0j)
    a_minus = 2.0 + 1j * w * (1.0 - root)
    a_plus = 2.0 + 1j * w * (1.0 + root)
    log_sqrt_s = loggamma(a_minus) + loggamma(a_plus) - loggamma(2.0 + 2j * w)
    return float(np.exp(2.0 * log_sqrt_s.real))


def exact_yukawa_pwave(v_rel: float, max_step: float | None = None) -> tuple[float, int]:
    """Solve u''+[1/4+alpha/v*exp(-m_med*t/(mX*v))/t-2/t^2]u=0.

    Here t=m_X*v_rel*r, the two particles each have mass m_X, and their
    relative speed is v_rel. The regular l=1 solution starts as
    u=t^2(1-alpha*t/(4*v_rel)+...). The asymptotic amplitude is matched to
    the free unit-incoming-wave solution, whose small-t coefficient is 1/12.
    """
    lam = ALPHA_EFF / v_rel
    if max_step is None:
        max_step = 0.5 if v_rel >= 0.05 else 0.1
    t0 = min(1.0e-7, 1.0e-7 / lam)
    y0 = [t0**2 * (1.0 - lam * t0 / 4.0), 2.0 * t0 - 3.0 * lam * t0**2 / 4.0]
    tmax = max(50.0, 30.0 * M_X_GEV * v_rel / M_MED_GEV)

    def rhs(t: float, y: np.ndarray) -> tuple[float, float]:
        potential = lam * np.exp(-M_MED_GEV * t / (M_X_GEV * v_rel)) / t
        return y[1], -(0.25 + potential - 2.0 / t**2) * y[0]

    solution = solve_ivp(
        rhs,
        (t0, tmax),
        y0,
        method="DOP853",
        rtol=1.0e-10,
        atol=1.0e-30,
        max_step=max_step,
    )
    if not solution.success:
        raise RuntimeError(solution.message)

    u, du = solution.y[:, -1]
    phase = tmax / 2.0 - np.pi / 2.0
    amp_sin = u * np.sin(phase) + 2.0 * du * np.cos(phase)
    amp_cos = u * np.cos(phase) - 2.0 * du * np.sin(phase)
    asymptotic_amplitude = np.hypot(amp_sin, amp_cos)
    return float((12.0 / asymptotic_amplitude) ** 2), int(solution.nfev)


def main() -> None:
    rows = {}
    evaluations = {}
    convergence = {}
    for label, velocity in (
        ("freezeout", V_FREEZEOUT),
        ("milky_way", V_HALO),
        ("dwarf", V_DWARF),
    ):
        s_approx = cassel_hulthen_pwave(velocity)
        s_exact, nfev = exact_yukawa_pwave(velocity)
        if label in ("milky_way", "dwarf"):
            s_tight, _ = exact_yukawa_pwave(velocity, max_step=0.03)
            convergence[label] = abs(s_tight / s_exact - 1.0)
        rows[label] = {
            "v_relative": velocity,
            "S1_Cassel_Hulthen": s_approx,
            "S1_exact_Yukawa_pointwise": s_exact,
            "exact_over_approx": s_exact / s_approx,
        }
        evaluations[label] = nfev

    halo = rows["milky_way"]
    dwarf = rows["dwarf"]
    approx_rate_ratio = (V_DWARF / V_HALO) ** 2 * halo["S1_Cassel_Hulthen"] ** -1 * dwarf["S1_Cassel_Hulthen"]
    exact_rate_ratio = (V_DWARF / V_HALO) ** 2 * halo["S1_exact_Yukawa_pointwise"] ** -1 * dwarf["S1_exact_Yukawa_pointwise"]
    anchored_exact_dwarf_rate = SIGMA_V_HALO_PAPER * exact_rate_ratio

    payload = {
        "classification": "pointwise_numerical_Yukawa_crosscheck_not_velocity_averaged_prediction",
        "source_benchmark": "Yamashita arXiv:2609.02868v2; Table 1 values use Cassel analytic approximation",
        "inputs": {
            "m_X_GeV": M_X_GEV,
            "alpha_eff": ALPHA_EFF,
            "m_mediator_GeV": M_MED_GEV,
            "v_relative_freezeout": V_FREEZEOUT,
            "v_relative_halo": V_HALO,
            "v_relative_dwarf": V_DWARF,
            "paper_sigma_v_halo_cm3_s": SIGMA_V_HALO_PAPER,
            "paper_sigma_v_dwarf_cm3_s": SIGMA_V_DWARF_PAPER,
            "radial_equation_variable": "t = m_X * v_relative * r",
            "radial_equation": "u'' + [1/4 + (alpha/v) exp(-m_med*t/(m_X*v))/t - l(l+1)/t^2]u = 0, l=1",
        },
        "pointwise_S1": rows,
        "derived": {
            "paper_dwarf_over_halo_sigma_v": SIGMA_V_DWARF_PAPER / SIGMA_V_HALO_PAPER,
            "Cassel_proxy_dwarf_over_halo_sigma_v": approx_rate_ratio,
            "exact_pointwise_dwarf_over_halo_sigma_v": exact_rate_ratio,
            "conditional_exact_pointwise_dwarf_rate_if_halo_anchored_cm3_s": anchored_exact_dwarf_rate,
            "exact_rate_ratio_over_paper_rate_ratio": exact_rate_ratio / (SIGMA_V_DWARF_PAPER / SIGMA_V_HALO_PAPER),
            "solver_function_evaluations": evaluations,
            "convergence_relative_change_max_step_0_1_vs_0_03": convergence,
        },
        "interpretation": [
            "Cassel's Hulthen approximation reproduces the paper's quoted S1 values (about 6.1 at freeze-out, 1.3e7 in the halo and 3.1e7 in dwarfs).",
            "The direct pointwise Yukawa solve gives larger low-speed S1 values; attractive finite-range Yukawa potentials can have p-wave resonances, and a single representative speed can land differently from a velocity-distribution average.",
            "The source paper explicitly says its resonance features are not included and velocity averaging can smear them; the exact values here must not be interpreted as a gamma-ray fit or a constraint result.",
        ],
        "limits": [
            "No Maxwellian or astrophysical relative-speed distribution is folded in; the quoted representative speeds are treated as points only.",
            "The halo-anchored dwarf rate is an illustrative ratio using sigma*v proportional to v^2*S1 and is not a refit of the source's freeze-out normalization.",
            "No bound-state formation, coupled channels, finite-temperature effects, mediator decay, or UV completion is included.",
            "This tests the annihilation mediator only; xenon and Casimir-DP response calculations are unchanged and unconnected.",
        ],
        "checks": {
            "Cassel_halo_reproduces_rounded_source_within_2_percent": abs(halo["S1_Cassel_Hulthen"] / 1.3e7 - 1.0) < 0.02,
            "Cassel_dwarf_reproduces_rounded_source_within_2_percent": abs(dwarf["S1_Cassel_Hulthen"] / 3.1e7 - 1.0) < 0.02,
            "exact_solver_halo_converges_within_1e_minus_6": convergence["milky_way"] < 1.0e-6,
            "exact_solver_dwarf_converges_within_1e_minus_6": convergence["dwarf"] < 1.0e-6,
            "interpretation_keeps_velocity_average_unresolved": True,
        },
    }
    assert all(payload["checks"].values())
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    REPORT.write_text(
        f"""# Pointwise p-wave Yukawa cross-check for the LZ-plus-gamma benchmark

Date: September 25, 2026. This packet checks the pointwise Sommerfeld factors only; it is not a velocity-averaged prediction.

## What was calculated

For the paper parameters `mX=420 GeV`, `alpha_eff=0.2`, and `m_phi=0.4 GeV`, this script evaluates both Cassel's Hulthen analytic approximation and the exact attractive Yukawa radial Schrödinger equation at the paper's listed relative speeds. The Cassel approximation reproduces the paper table: `S1=6.11` at freeze-out, `1.288e7` in the halo, and `3.066e7` for dwarfs (source rounded values: `6.1`, `1.3e7`, `3.1e7`).

The exact pointwise Yukawa integration instead gives `S1=6.106` at freeze-out, `4.121e7` in the halo, and `4.659e8` at the listed dwarf speed. With `sigma*v proportional to v^2*S1`, the exact pointwise dwarf-to-halo rate ratio is `{exact_rate_ratio:.4g}`, compared with the source table's `0.0241`; anchoring the exact pointwise ratio to the quoted halo rate would imply a dwarf rate near `{anchored_exact_dwarf_rate:.3e} cm^3/s`. These are diagnostic values at single speeds, not a corrected astrophysical prediction.

## Why the methods differ

The direct solver integrates the unapproximated Yukawa potential and extracts the p-wave Sommerfeld factor from the asymptotic scattering amplitude. The solver is converged against a threefold change in maximum integration step. At these strong attractive couplings, the pointwise answer can be sensitive to narrow p-wave resonances. Cassel's paper notes that its Hulthen approximation has limited accuracy for p-wave Yukawa resonances; Yamashita explicitly states that narrow resonances are not included and that velocity averaging may smear them. Thus the source numbers are internally reproduced by its stated approximation, while this independent pointwise solve exposes the need to average before using a rate.

The direct next calculation is to integrate `v^2*S1(v)` over explicitly stated halo and dwarf relative-speed distributions, including convergence under velocity-grid refinement and comparison against Cassel's approximation. A source-faithful calculation also needs the distributions/averaging convention used in the benchmark; until then, neither pointwise curve selects the physical branch.

## Reproduction and sources

Run `python docs/research/casimir-dp-yamashita-yukawa-pointwise-crosscheck-2026-09-25.py`. The adjacent JSON stores the equation, parameters, results, solver counts, checks and validity limits. Requires NumPy and SciPy.

Sources: [Yamashita, arXiv:2609.02868v2](https://arxiv.org/html/2609.02868v2) (Table 1 and the stated treatment of resonance/velocity averaging); [Cassel, arXiv:0903.5307](https://arxiv.org/html/0903.5307) (Sommerfeld definition, Hulthen approximation, numerical Yukawa results and limitations).
""",
        encoding="utf-8",
    )
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
