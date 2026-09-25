"""B-L excited-state lifetime under both readings of the quoted splitting."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

BASE = Path("docs/research")
NOTATION = BASE / "casimir-dp-bminusl-splitting-notation-audit-2026-09-25.json"
CARBON = BASE / "casimir-dp-bminusl-scalar-lz-carbon-screen-2026-09-24.json"
OUT = BASE / "casimir-dp-bminusl-excited-state-lifetime-2026-09-25.json"
notation = json.loads(NOTATION.read_text())
carbon = json.loads(CARBON.read_text())
GF = 1.1663787e-5
HBAR = 6.582119569e-25
G_BL = 0.5
AGE = 13.8e9 * 365.25 * 24 * 3600

def width_three_nu(mS, delta):
    """Return tree-level Z'-mediated width for delta in GeV.

    Uses the source paper's off-diagonal scalar current and B-L neutrino charge.
    For each light flavor, dG/dq2=C^2 |p_S|^3/(24*pi^3), with
    C=g_BL^2/m_Zprime^2 and m_Zprime=2*mS (resonant benchmark).
    """
    mP = mS + delta
    mZ = 2*mS
    c_eff = G_BL**2 / mZ**2
    # Factorized Kallen function avoids catastrophic cancellation when the
    # literal source reading produces an eV-scale gap beside a TeV mass.
    def p3(q2):
        phase = max(0.0, ((mP-mS)**2-q2)*((mP+mS)**2-q2))
        return phase**1.5/(8*mP**3)
    integral, error = quad(
        p3,
        0.0, delta*delta, epsabs=0.0, epsrel=1e-10, limit=1000)
    # The integrand above equals |p_S|^3 = lambda^(3/2)/(8 mP^3).
    partial = c_eff*c_eff*integral/(24*math.pi**3)
    total = 3*partial
    return {"mZprime_GeV":mZ, "effective_coefficient_GeV_minus2":c_eff,
            "phase_integral_GeV5":integral, "quadrature_error_GeV5":error,
            "width_per_nu_flavor_GeV":partial, "width_three_flavors_GeV":total,
            "lifetime_s":HBAR/total, "lifetime_years":HBAR/total/(365.25*24*3600),
            "universe_age_over_lifetime":AGE/(HBAR/total)}

rows=[]
for massrow in notation["rows"]:
    mS=massrow["mS_TeV"]*1e3
    for quoted in massrow["literal_sqrt_difference_reading"]:
        q_keV=quoted["quoted_sqrt_mass_squared_difference_keV"]
        delta_eV=quoted["physical_gap_eV"]
        literal=width_three_nu(mS,delta_eV*1e-9)
        phys=width_three_nu(mS,q_keV*1e-6)
        rows.append({"mS_TeV":massrow["mS_TeV"], "quoted_sqrt_mass_squared_difference_keV":q_keV,
          "literal_read_physical_gap_eV":delta_eV, "literal_read_lifetime":literal,
          "literal_read_carbon_open":quoted["carbon_endothermic_open_at_vcap"],
          "literal_read_xenon_vmin_km_s":quoted["xe_vmin_km_s"],
          "literal_read_independent_carbon_D_upper":quoted["independent_carbon_decoherence_upper"]["D_upper_if_open"],
          "inverse_P_to_S_D_upper_transfer_assumption":"same near-degenerate cross-section, halo flux, and D<=2-per-collision ceiling as the S-to-P screen",
          "physical_gap_read_delta_keV":q_keV, "physical_gap_read_lifetime":phys,
          "physical_gap_read_carbon_open":False,
          "physical_gap_read_xenon_vmin_km_s":next(x["xe_vmin_km_s"] for x in massrow["physical_mass_gap_reading"] if x["physical_gap_keV"]==q_keV)})

literal_survivals=[r["literal_read_lifetime"]["universe_age_over_lifetime"] for r in rows]
physical_ages=[r["physical_gap_read_lifetime"]["universe_age_over_lifetime"] for r in rows]
result={
 "classification":"conditional_B-L_Zprime_excited_state_lifetime_and_notation_fork",
 "inputs":{
   "notation_audit_sha256":hashlib.sha256(NOTATION.read_bytes()).hexdigest(),
   "carbon_screen_sha256":hashlib.sha256(CARBON.read_bytes()).hexdigest(),
   "gBL":G_BL, "mZprime_relation":"2*mS on the source's resonant thermal-relic branch",
   "source_reported_reference_sigma_p_cm2":"order 1e-45", "active_neutrino_flavors":3,
   "age_universe_s":AGE, "assumed_neutrino_coupling":"B-L charge magnitude 1; massless light neutrinos",
 },
 "rows":rows,
 "checks":{
   "all_literal_gaps_are_below_one_eV":max(r["literal_read_physical_gap_eV"] for r in rows)<1,
   "literal_read_excited_state_survives_cosmic_age":min(literal_survivals)<1,
   "physical_100_to_300keV_excited_state_decays_within_universe_age":min(physical_ages)>1,
   "literal_read_keeps_carbon_open":all(r["literal_read_carbon_open"] for r in rows),
   "physical_gap_read_keeps_carbon_closed":not any(r["physical_gap_read_carbon_open"] for r in rows),
   "literal_carbon_D_remains_below_one_sigma":max(r["literal_read_independent_carbon_D_upper"] for r in rows)<carbon["inputs"]["registered_one_sigma_D"],
 },
 "branch_verdict":{
   "literal_q_reading":"P can survive cosmologically in the tree-level Zprime estimate and C-12 scattering is open, but the eV-scale gap makes the xenon spectrum effectively elastic and the generous independent-carbon D ceiling remains below 4e-27 per hold.",
   "physical_100_to_300keV_gap_reading":"the high-recoil xenon shift is retained, but ground-state S upscattering on carbon is closed and primordial P is depleted well before the present halo age.",
   "decision":"Neither reading yields a measurable shared xenon/Casimir-DP channel; resolve the source notation before using this model for any recoil-spectrum claim.",
 },
 "limitations":[
   "This is a tree-level off-shell Zprime-to-light-neutrino decay estimate, not a full branching-ratio calculation.",
   "It assumes gBL=0.5 and mZprime=2mS on the resonant benchmark; width scales as gBL^4/mZprime^4 at fixed gap.",
   "Majorana-neutrino current normalization, scalar/sterile-neutrino channels and radiative corrections can alter the width by order-one factors; they do not change the qualitative lifetime split between sub-eV and 100-keV gaps.",
   "The carbon D ceiling transfers the source's order-1e-45 cm2 nucleon normalization, takes all local density in the scattering state, F_C^2=1 and D<=2 per event; applying the literal-read S-to-P bound to inverse P-to-S assumes the same near-degenerate cross section and is a conservative independent-nucleus event-count estimate, not a material response.",
   "No LZ likelihood, gamma spectrum, boson-star solution or late-time P repopulation is computed.",
 ]
}
assert all(result["checks"].values()), result["checks"]
OUT.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps(result,indent=2))
