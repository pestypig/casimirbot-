"""Reproduce the free-complex mini-boson-star Kaup scale screen."""
from decimal import Decimal, getcontext
import json
from pathlib import Path

getcontext().prec = 40
ROOT = Path(__file__).resolve().parent
MPL_GEV = Decimal("1.220890e19")  # unreduced Planck mass, GeV
GEV_PER_EV = Decimal("1e-9")
MSUN_GEV = Decimal("1.115449e57")
KAUP_COEFFICIENT = Decimal("0.633")
MASS_EV = Decimal("1e-17")
TARGET_MSUN = Decimal("4.02e6")

mass_gev = MASS_EV * GEV_PER_EV
kaup_max_msun = KAUP_COEFFICIENT * MPL_GEV**2 / mass_gev / MSUN_GEV
mass_for_target_cap_ev = (
    KAUP_COEFFICIENT * MPL_GEV**2 / (TARGET_MSUN * MSUN_GEV) / GEV_PER_EV
)
result = {
    "status": "scaling screen only; not the selected member's solved ADM mass",
    "inputs": {
        "kaup_coefficient": str(KAUP_COEFFICIENT),
        "unreduced_planck_mass_GeV": str(MPL_GEV),
        "solar_mass_GeV": str(MSUN_GEV),
        "boson_mass_eV": str(MASS_EV),
        "reference_target_mass_solar": str(TARGET_MSUN),
    },
    "outputs": {
        "free_complex_kaup_max_solar": str(kaup_max_msun),
        "target_mass_fraction_of_kaup_max": str(TARGET_MSUN / kaup_max_msun),
        "boson_mass_for_kaup_cap_at_target_eV": str(mass_for_target_cap_ev),
    },
    "formula": "M_Kaup=0.633*M_Pl^2/m; uses the unreduced Planck mass",
    "limitations": [
        "Kaup value is the maximum mass of the free complex scalar family, not the mass at shat_0=6/5.",
        "The selected NHM2 member is preregistered but not implemented or solved; its dimensionless ADM mass is not available here.",
        "This scaling does not establish stability, astrophysical fit, formation, or a connection to xenon or Casimir-DP observables.",
    ],
}
out = ROOT / "casimir-dp-free-complex-star-kaup-scale-2026-09-25.json"
out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, indent=2))