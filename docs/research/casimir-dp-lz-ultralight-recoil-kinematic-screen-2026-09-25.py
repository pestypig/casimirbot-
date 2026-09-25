"""Kinematic bridge screen for ultralight pNGB vs inelastic IDM and LZ Xe recoil."""
import json, math
from pathlib import Path

# Experimental event values from LZ's 2026 extended nuclear-recoil analysis.
ER_KEV=248.0
ER_SIGMA_KEV=math.hypot(23.0,23.0)
ER_RANGE_KEV=(ER_KEV-ER_SIGMA_KEV,ER_KEV+ER_SIGMA_KEV)
M_XE_GEV=131.293*0.93149410242
V_MAX_KMS=800.0 # deliberately generous lab-frame speed cap for kinematic screen
V_MAX=V_MAX_KMS/299792.458
M_PHI_EV=1e-17
M_PHI_GEV=M_PHI_EV*1e-9
M_IDM_GEV=1080.0
DELTA_IDM_KEV=369.0

def reduced(m1,m2): return m1*m2/(m1+m2)
def vmin_elastic(Egev,mchi,M):
    mu=reduced(mchi,M)
    return math.sqrt(M*Egev/(2*mu*mu))
def vmin_endothermic(Egev,mchi,M,delta_gev):
    mu=reduced(mchi,M)
    return (M*Egev/mu+delta_gev)/math.sqrt(2*M*Egev)
def delta_max(Egev,mchi,M,v):
    mu=reduced(mchi,M)
    return v*math.sqrt(2*M*Egev)-M*Egev/mu

ER_GEV=ER_KEV*1e-6
mu_phi=reduced(M_PHI_GEV,M_XE_GEV)
ERMAX_PHI_GEV=2*mu_phi**2*V_MAX**2/M_XE_GEV
mureq=math.sqrt(ER_GEV*M_XE_GEV/(2*V_MAX**2))
MIN_ELASTIC_MASS=mureq*M_XE_GEV/(M_XE_GEV-mureq)
mu_idm=reduced(M_IDM_GEV,M_XE_GEV)
v_idm=vmin_endothermic(ER_GEV,M_IDM_GEV,M_XE_GEV,DELTA_IDM_KEV*1e-6)
result={
 "status":"two-body kinematics only; no interaction rate or detector likelihood",
 "inputs":{"LZ_event_recoil_keV":ER_KEV,"combined_recoil_uncertainty_keV":ER_SIGMA_KEV,"xenon_nucleus_mass_GeV":M_XE_GEV,"generous_lab_speed_cap_km_s":V_MAX_KMS,"ultralight_mass_eV":M_PHI_EV,"IDM_benchmark_mass_GeV":M_IDM_GEV,"IDM_endothermic_splitting_keV":DELTA_IDM_KEV},
 "ultralight_elastic":{"maximum_nuclear_recoil_eV":ERMAX_PHI_GEV*1e9,"LZ_event_energy_over_recoil_ceiling":ER_GEV/ERMAX_PHI_GEV,"single_boson_rest_energy_eV":M_PHI_EV,"event_energy_over_single_boson_rest_energy":ER_KEV*1e3/M_PHI_EV,"elastic_mass_required_for_central_recoil_GeV_at_speed_cap":MIN_ELASTIC_MASS},
 "inelastic_IDM":{"reduced_mass_GeV":mu_idm,"minimum_speed_for_central_event_km_s":v_idm*299792.458,"minimum_speed_over_recoil_uncertainty_band_km_s":[vmin_endothermic(E*1e-6,M_IDM_GEV,M_XE_GEV,DELTA_IDM_KEV*1e-6)*299792.458 for E in ER_RANGE_KEV],"maximum_endothermic_splitting_at_central_recoil_keV":delta_max(ER_GEV,M_IDM_GEV,M_XE_GEV,V_MAX)*1e6,"kinematically_allowed_at_speed_cap":v_idm<=V_MAX},
 "equations":{"elastic_max_recoil":"E_R,max=2 mu^2 v^2/M_Xe","endothermic_minimum_speed":"v_min(E_R)=(M_Xe E_R/mu+delta)/sqrt(2 M_Xe E_R)"},
 "limitations":["The 800 km/s speed cap is a deliberately generous kinematic ceiling, not a halo distribution or expected rate.","The elastic mass threshold is a two-body kinematic minimum at that cap; LZ signal fits and rates impose stronger model-dependent requirements.","The 1080 GeV, 369 keV IDM point is a repository benchmark, not an official LZ best fit. Its v_min must be folded through the actual halo distribution and detector response.","A coherent multiparticle process or nonstandard energy-transfer mechanism is outside the single-particle WIMP recoil screen.","LZ reports one NR-compatible 248 keV event with global 2.6 sigma significance; this is not a confirmed dark-matter detection." ]
}
out=Path(__file__).with_suffix('.json'); out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8'); print(json.dumps(result,indent=2))