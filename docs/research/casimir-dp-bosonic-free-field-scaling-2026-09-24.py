"""Free-field boson-star and elastic-xenon scale checks for the compatibility goal.

Inputs: stated benchmark particle masses; not a fit to LZ or astrophysical data.
"""
from pathlib import Path
import json

M_PLANCK_GEV = 1.22089e19  # sqrt(hbar*c/G)
GEV_C2_KG = 1.7826619216278976e-27
M_SUN_KG = 1.98847e30
M_XE129_GEV = 129 * 0.93149410242
C_KM_S = 299792.458
V_CAP_KM_S = 798.0  # inherited from the prior exothermic screening assumptions
KAUP_COEFFICIENT = 0.633
QUARTIC_MASS_COEFFICIENT = 0.1  # Mmax/Msun ~= 0.1 sqrt(lambda)/(m/GeV)^2
S_MBH_MSUN = 4.02e6
LZ_RECOIL_KEV = 248.0


def free_field_max_mass(mass_gev: float) -> tuple[float, float]:
    mass_kg = KAUP_COEFFICIENT * M_PLANCK_GEV**2 / mass_gev * GEV_C2_KG
    return mass_kg, mass_kg / M_SUN_KG


def xe_elastic_recoil_ceiling_kev(mass_gev: float, speed_km_s: float) -> float:
    """Nonrelativistic maximum recoil: 2 mu^2 v^2 / m_target."""
    v = speed_km_s / C_KM_S
    mu = mass_gev * M_XE129_GEV / (mass_gev + M_XE129_GEV)
    return 2 * mu**2 * v**2 / M_XE129_GEV * 1e6


def quartic_lambda_for_mass(mass_gev: float, target_msun: float) -> float:
    """Asymptotic repulsive-quartic scaling only; not a validated completion."""
    sqrt_lambda = target_msun * mass_gev**2 / QUARTIC_MASS_COEFFICIENT
    return sqrt_lambda**2


benchmarks = [
    ("EHT Sgr A* illustrative field", 1e-26, "GeV"),  # 1e-17 eV
    ("LZ illustrative inelastic model", 45.0, "GeV"),
    ("cluster line energy floor", 43.2, "GeV"),
    ("Milky Way continuum lower fit", 500.0, "GeV"),
    ("Milky Way continuum upper fit", 800.0, "GeV"),
]
rows = []
for label, mass_gev, unit in benchmarks:
    max_kg, max_msun = free_field_max_mass(mass_gev)
    rows.append({
        "benchmark": label,
        "particle_mass_GeV": mass_gev,
        "free_field_Kaup_max_mass_kg": max_kg,
        "free_field_Kaup_max_mass_solar": max_msun,
        "elastic_Xe129_max_recoil_keV_at_798_km_s": xe_elastic_recoil_ceiling_kev(mass_gev, V_CAP_KM_S),
    })

m_ultralight_ev = 1e-17
ultralight_mmax_solar = free_field_max_mass(m_ultralight_ev * 1e-9)[1]
heavy_rows = [row for row in rows if row["particle_mass_GeV"] >= 43.2]
assert abs(ultralight_mmax_solar / S_MBH_MSUN - 2.1041692749) < 1e-9
assert all(row["elastic_Xe129_max_recoil_keV_at_798_km_s"] < LZ_RECOIL_KEV for row in heavy_rows if row["benchmark"] in ("LZ illustrative inelastic model", "cluster line energy floor"))
assert all(row["elastic_Xe129_max_recoil_keV_at_798_km_s"] > LZ_RECOIL_KEV for row in heavy_rows if "continuum" in row["benchmark"])

out = {
    "evidence_class": "reproducible analytic scaling and kinematic screen",
    "constants": {
        "planck_mass_GeV": M_PLANCK_GEV,
        "Kaup_coefficient": KAUP_COEFFICIENT,
        "xenon_isotope_mass_GeV": M_XE129_GEV,
        "speed_cap_km_s": V_CAP_KM_S,
        "LZ_candidate_recoil_keV": LZ_RECOIL_KEV,
    },
    "ultralight_SgrA_benchmark": {
        "field_mass_eV": m_ultralight_ev,
        "free_field_max_star_mass_solar": ultralight_mmax_solar,
        "SgrA_mass_solar": S_MBH_MSUN,
        "max_mass_to_SgrA_ratio": ultralight_mmax_solar / S_MBH_MSUN,
    },
    "benchmarks": rows,
    "quartic_repulsive_scaling_lambda_required": {
        "formula_scope": "Mmax/Msun ~= 0.1 sqrt(lambda)/(m/GeV)^2; asymptotic repulsive quartic model only",
        "45_GeV_for_1_solar_mass": quartic_lambda_for_mass(45, 1.0),
        "45_GeV_for_SgrA_mass": quartic_lambda_for_mass(45, S_MBH_MSUN),
        "500_GeV_for_SgrA_mass": quartic_lambda_for_mass(500, S_MBH_MSUN),
        "800_GeV_for_SgrA_mass": quartic_lambda_for_mass(800, S_MBH_MSUN),
    },
    "limits": [
        "Free-field Kaup limit applies only to the minimally coupled massive scalar with no self-interaction; alternative potentials change the result.",
        "798 km/s is an inherited illustrative speed cap, not a universal halo model or official LZ assumption.",
        "Elastic recoil uses nonrelativistic two-body kinematics and Xe-129 mass approximation; no detector response or rate likelihood is computed.",
        "The quartic coupling values are scaling illustrations, not perturbative-consistency checks or viable particle models.",
        "No astrophysical occurrence rate, annihilation yield, local population, or interferometer observable is inferred.",
    ],
}
path = Path(__file__).with_suffix(".json")
path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
