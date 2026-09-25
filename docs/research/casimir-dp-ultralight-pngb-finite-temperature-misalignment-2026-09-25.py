#!/usr/bin/env python3
"""Finite-temperature e+e- transition plus homogeneous ultralight KG evolution.

Model: one canonical real component of an O(3)/O(2) pNGB, with quadratic
potential V=m^2 X^2/2, negligible initial velocity and standard radiation
domination. Neutrino decoupling is approximated as instantaneous at 2 MeV.
This calculates abundance normalization only; it does not generate U(1) charge
or evolve perturbations/structure into boson stars.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from scipy.integrate import quad, solve_ivp
from scipy.interpolate import PchipInterpolator
from scipy.optimize import brentq

M_PHI_EV = 1.0e-17
M_PHI_GEV = M_PHI_EV * 1.0e-9
OMEGA_DM_H2 = 0.1198
H_REDUCED = 0.674
H0_KM_S_MPC = 67.4
M_REDUCED_GEV = 2.435e18
M_PLANCK_GEV = 1.22089e19
M_E_GEV = 0.51099895e-3
T_NU_DECOUPLE_GEV = 2.0e-3
T0_GEV = 2.348e-13
G_S0 = 3.91
F_PNGB_GEV = 6.7e17
FRACTIONS = (0.10, 1.0)
P_CURVATURE = 2.1e-9
BETA_ISO_MAX = 0.038
HBAR_GEV_S = 6.582119569e-25
MPC_KM = 3.0856775814913673e19
N_ELECTRON_POSITRON = 4.0
G_NU = 5.25


def fermion_rho_pressure_over_t4(y: float) -> tuple[float, float]:
    """One e-/e+ Dirac pair: rho/T^4, P/T^4, with y=m/T."""
    def occupation_energy(x: float) -> float:
        e = math.hypot(x, y)
        if e > 700.0:
            return 0.0
        return 1.0 / (math.exp(e) + 1.0)

    def rho_integrand(x: float) -> float:
        e = math.hypot(x, y)
        return x * x * e * occupation_energy(x)

    def pressure_integrand(x: float) -> float:
        e = math.hypot(x, y)
        return x**4 / e * occupation_energy(x) if e else 0.0

    rho_i = quad(rho_integrand, 0.0, np.inf, epsabs=1e-11, epsrel=2e-9, limit=160)[0]
    pressure_i = quad(pressure_integrand, 0.0, np.inf, epsabs=1e-11, epsrel=2e-9, limit=160)[0]
    return (
        N_ELECTRON_POSITRON * rho_i / (2.0 * math.pi**2),
        N_ELECTRON_POSITRON * pressure_i / (6.0 * math.pi**2),
    )


def thermal_dof(T_gev: float) -> tuple[float, float, float, float]:
    """Return g*, g*s, total rho/T^4, neutrino temperature ratio."""
    rho_e, p_e = fermion_rho_pressure_over_t4(M_E_GEV / T_gev)
    gs_e = 45.0 / (2.0 * math.pi**2) * (rho_e + p_e)
    gs_em = 2.0 + gs_e
    _, p_e_dec = fermion_rho_pressure_over_t4(M_E_GEV / T_NU_DECOUPLE_GEV)
    rho_e_dec, _ = fermion_rho_pressure_over_t4(M_E_GEV / T_NU_DECOUPLE_GEV)
    gs_em_dec = 2.0 + 45.0 / (2.0 * math.pi**2) * (rho_e_dec + p_e_dec)
    if T_gev >= T_NU_DECOUPLE_GEV:
        tnu_ratio = 1.0
    else:
        tnu_ratio = (gs_em / gs_em_dec) ** (1.0 / 3.0)
    rho_gamma = math.pi**2 / 15.0
    rho_nu = math.pi**2 / 30.0 * G_NU * tnu_ratio**4
    rho_total_over_t4 = rho_gamma + rho_e + rho_nu
    g_star = 30.0 / math.pi**2 * rho_total_over_t4
    g_star_s = gs_em + G_NU * tnu_ratio**3
    return g_star, g_star_s, rho_total_over_t4, tnu_ratio


H0_GEV = H0_KM_S_MPC / MPC_KM * HBAR_GEV_S
RHO_CRIT0_GEV4 = 3.0 * H0_GEV**2 * M_REDUCED_GEV**2
OMEGA_DM = OMEGA_DM_H2 / H_REDUCED**2
RHO_DM0_GEV4 = OMEGA_DM * RHO_CRIT0_GEV4

# Tabulate thermodynamics, including finite-mass e+e- and instantaneously
# decoupled neutrinos, then interpolate in N=ln(a).
T_GRID_GEV = np.geomspace(1.0e-6, 1.0e-2, 520)  # 0.001 to 10 MeV
g_values, gs_values, rho_r_values, nu_ratio_values = [], [], [], []
for temp in T_GRID_GEV:
    g, gs, rho_r, nu_ratio = thermal_dof(float(temp))
    g_values.append(g)
    gs_values.append(gs)
    rho_r_values.append(rho_r)
    nu_ratio_values.append(nu_ratio)
g_values = np.asarray(g_values)
gs_values = np.asarray(gs_values)
rho_r_values = np.asarray(rho_r_values)
nu_ratio_values = np.asarray(nu_ratio_values)
a_values = (T0_GEV / T_GRID_GEV) * (G_S0 / gs_values) ** (1.0 / 3.0)
N_values = np.log(a_values)
order = np.argsort(N_values)
N_values = N_values[order]
T_values = T_GRID_GEV[order]
g_values = g_values[order]
gs_values = gs_values[order]
rho_r_values = rho_r_values[order]
lnH_values = 0.5 * np.log((math.pi**2 / 30.0) * g_values * T_values**4 / (3.0 * M_REDUCED_GEV**2))
lnH_of_N = PchipInterpolator(N_values, lnH_values)
dlnH_dN = lnH_of_N.derivative()
lnT_of_N = PchipInterpolator(N_values, np.log(T_values))
gstar_of_N = PchipInterpolator(N_values, g_values)
rho_r_over_T4_of_N = PchipInterpolator(N_values, rho_r_values)

T_start = 1.0e-2  # 10 MeV, safely H >> m
N_start = math.log((T0_GEV / T_start) * (G_S0 / float(thermal_dof(T_start)[1])) ** (1.0 / 3.0))
T_min = float(T_GRID_GEV[0])
N_min = float(np.min(N_values))
N_start = max(N_start, N_min)

def h_over_m_at_N(N: float) -> float:
    return math.exp(float(lnH_of_N(N))) / M_PHI_GEV

N_stop = brentq(lambda n: h_over_m_at_N(n) - 0.01, N_start, float(np.max(N_values)))

def rhs(N: float, state: np.ndarray) -> tuple[float, float]:
    y, dy_dN = state
    H_over_m = h_over_m_at_N(N)
    m_over_H = 1.0 / H_over_m
    return (
        dy_dN,
        -(3.0 + float(dlnH_dN(N))) * dy_dN - m_over_H**2 * y,
    )

solution = solve_ivp(
    rhs,
    (N_start, N_stop),
    (1.0, 0.0),
    method="DOP853",
    rtol=2.0e-9,
    atol=2.0e-11,
    max_step=0.001,
    dense_output=True,
)
if not solution.success:
    raise RuntimeError(solution.message)

# Average the comoving scalar energy over the final oscillation cycle.
def phase_rate(N: float) -> float:
    return 1.0 / h_over_m_at_N(N)

phase_window = brentq(
    lambda start: quad(phase_rate, start, N_stop, epsabs=1e-9, epsrel=2e-7)[0] - 2.0 * math.pi,
    N_stop - 0.2,
    N_stop - 1.0e-8,
)
N_cycle = np.linspace(phase_window, N_stop, 1000)
state_cycle = solution.sol(N_cycle)
H_cycle = np.exp(np.asarray(lnH_of_N(N_cycle)))
comoving_energy_per_initial_phi2 = (
    np.exp(3.0 * N_cycle)
    * 0.5
    * ((H_cycle * state_cycle[1]) ** 2 + (M_PHI_GEV * state_cycle[0]) ** 2)
)
C_COMOVING = float(np.mean(comoving_energy_per_initial_phi2))

rows = []
for f_phi in FRACTIONS:
    phi_initial = math.sqrt(f_phi * RHO_DM0_GEV4 / C_COMOVING)
    for temp_mev in (2.0, 1.0, 0.5, 0.2, 0.1, 0.05):
        temp = temp_mev * 1.0e-3
        N = math.log((T0_GEV / temp) * (G_S0 / thermal_dof(temp)[1]) ** (1.0 / 3.0))
        if N < N_start or N > N_stop:
            continue
        y, dy_dN = solution.sol(N)
        H = math.exp(float(lnH_of_N(N)))
        rho_phi = 0.5 * phi_initial**2 * ((H * dy_dN) ** 2 + (M_PHI_GEV * y) ** 2)
        rho_r = float(rho_r_over_T4_of_N(N)) * temp**4
        rows.append({
            "f_phi_of_total_DM": f_phi,
            "temperature_MeV": temp_mev,
            "H_over_m": H / M_PHI_GEV,
            "rho_phi_over_radiation": rho_phi / rho_r,
        })

summary = {}
for f_phi in FRACTIONS:
    rowset = [row for row in rows if row["f_phi_of_total_DM"] == f_phi]
    phi_required = math.sqrt(f_phi * RHO_DM0_GEV4 / C_COMOVING)
    p_iso_max = BETA_ISO_MAX / (1.0 - BETA_ISO_MAX) * P_CURVATURE
    # Conditional pre-inflationary, light-spectator, uncorrelated-CDI bound:
    # P_S = f_phi^2 (H_I / (pi X_i))^2.
    h_inflation_max = math.pi * phi_required * math.sqrt(p_iso_max) / f_phi
    summary[str(f_phi)] = {
        "initial_canonical_real_field_GeV": phi_required,
        "initial_angle_for_f_6p7e17": phi_required / F_PNGB_GEV,
        "conditional_H_inflation_upper_GeV_from_CDI_isocurvature": h_inflation_max,
        "rho_phi_over_radiation_at_sampled_BBN_temperatures_envelope": [
            min(row["rho_phi_over_radiation"] for row in rowset),
            max(row["rho_phi_over_radiation"] for row in rowset),
        ],
    }

result = {
    "status": "finite-temperature homogeneous KG abundance normalization; not a boson-star or full BBN calculation",
    "model": {
        "potential": "V(X)=m_phi^2 X^2/2 for one canonical real component of the pNGB field",
        "mass_eV": M_PHI_EV,
        "initial_condition": "X_i=1 in normalized solver, dX/dln(a)=0 at 10 MeV; linearity then sets the required X_i",
        "neutrino_decoupling": "instantaneous at 2 MeV; T_nu/T follows EM entropy conservation thereafter",
        "cosmology": "standard radiation domination with finite-temperature e+e- equation of state",
        "charge": "single-axis real misalignment; generated U(1) charge is zero",
        "isocurvature_bound": "conditional on symmetry broken before inflation, light spectator fluctuations deltaX=H_I/(2pi), no restoration, and uncorrelated scale-invariant CDM isocurvature",
    },
    "inputs": {
        "Omega_DM_h2": OMEGA_DM_H2,
        "h": H_REDUCED,
        "f_phi_grid": list(FRACTIONS),
        "f_pNGB_reference_GeV": F_PNGB_GEV,
        "Planck_uncorrelated_CDI_beta_upper": BETA_ISO_MAX,
        "curvature_power_at_pivot": P_CURVATURE,
        "electron_mass_MeV": M_E_GEV * 1.0e3,
        "neutrino_decoupling_MeV": T_NU_DECOUPLE_GEV * 1.0e3,
    },
    "outputs": {
        "H_over_m_at_start": h_over_m_at_N(N_start),
        "H_over_m_at_stop": h_over_m_at_N(N_stop),
        "T_start_MeV": math.exp(float(lnT_of_N(N_start))) * 1.0e3,
        "T_stop_MeV": math.exp(float(lnT_of_N(N_stop))) * 1.0e3,
        "finite_temperature_gstar_at_T_0p1MeV": float(gstar_of_N(math.log((T0_GEV / 1.0e-4) * (G_S0 / thermal_dof(1.0e-4)[1]) ** (1.0 / 3.0)))),
        "comoving_energy_per_initial_field2_GeV2": C_COMOVING,
        "fractions": summary,
        "BBN_temperature_samples": rows,
    },
    "numerical": {
        "thermodynamics_grid_points": len(T_GRID_GEV),
        "solver": "SciPy solve_ivp DOP853, rtol=2e-9, atol=2e-11, max_step=0.001 in ln(a)",
        "final_cycle_samples": len(N_cycle),
        "comoving_energy_cycle_relative_scatter": float(np.std(comoving_energy_per_initial_phi2) / np.mean(comoving_energy_per_initial_phi2)),
    },
    "limitations": [
        "Neutrino decoupling is instantaneous at 2 MeV; non-instantaneous neutrino heating and QED corrections are omitted.",
        "The scalar potential is treated as exactly harmonic with constant mass; the full O(3)/O(2) potential and radial mode are not included.",
        "The scalar is a canonical real displacement with no angular rotation, so it carries no U(1) charge and does not initialize the charged-star solution.",
        "The quoted inflation bound does not apply unchanged if the symmetry is restored after inflation, the pNGB is heavy during inflation, inflationary fluctuations are suppressed or correlated, or other isocurvature sources compensate.",
        "BBN ratios are background diagnostics only, not an abundance/light-element likelihood or perturbation calculation.",
        "No isocurvature transfer, late structure formation, star fraction, IDM relic, gamma-ray rate, xenon response or Casimir-DP response is computed.",
    ],
}

out = Path(__file__).with_suffix(".json")
out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))
