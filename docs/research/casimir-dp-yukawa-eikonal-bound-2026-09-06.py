"""Conservative full-phase elastic bound within the eikonal approximation."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad
from scipy.optimize import brentq
from scipy.special import k0e

base=Path('docs/research')
parent_path=base/'casimir-dp-shared-yukawa-screen-2026-09-06.json'
config_path=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
parent=json.loads(parent_path.read_text())
cfg=json.loads(config_path.read_text())
assert hashlib.sha256(config_path.read_bytes()).hexdigest()==parent['config_sha256']
model=parent['model']; design=cfg['leading_design']
R=design['radius_m']/1.973269804e-16
A=model['object_effective_nucleon_count']
v=model['speed_kms']/299792.458
flux=model['rho_GeV_cm3']/model['mchi_GeV']*model['speed_kms']*1e5
kinetic=model['mchi_GeV']*v*v/2
geo=math.pi*(design['radius_m']*100)**2

def scaled_H(a):
    if a<.1:
        return math.exp(-a)*(1+a*a/10+a**4/280+a**6/15120)
    return 1.5*((a-1)+(a+1)*math.exp(-2*a))/a**3

def bound(mass_eV,alpha,extra=70):
    a=mass_eV*1e-9*R
    B=2*alpha*A/v*scaled_H(a)
    def phase(y): return B*math.exp(a-y)*k0e(y)
    end=a+max(extra,math.log(max(B,1))+extra)
    switch=brentq(lambda y:phase(y)-2,a,end) if phase(a)>2 else a
    integral=2*(switch*switch-a*a)
    integral+=quad(lambda y:y*phase(y)**2,switch,end,epsabs=1e-15,epsrel=1e-10)[0]
    # K0(y) <= sqrt(pi/(2y))*exp(-y); analytic bound on omitted tail.
    tail=B*B*math.pi/4*math.exp(-2*(end-a))
    sigma=4*geo+2*geo/a**2*(integral+tail)
    # At most factor two from 1-cos(q.d); independent of branch orientation.
    D=2*flux*design['hold_time_s']*sigma
    if a<.01:
        center_factor=.5-a/3+a*a/8-a**3/30+a**4/144
    else:
        center_factor=(-math.expm1(-a)-a*math.exp(-a))/a**2
    Vcenter=3*alpha*A/R*center_factor
    return {'mediator_eV':mass_eV,'alpha':alpha,'sigma_el_upper_cm2':sigma,
        'D_upper':D,'visibility_loss_upper':-math.expm1(-D),
        'sigma_upper_over_geometric':sigma/geo,
        'surface_phase':phase(a),'max_potential_over_kinetic':Vcenter/kinetic,
        'kR':model['mchi_GeV']*v*R,
        'tail_upper_integral':tail,'q_cutoff_applied':False}

rows=[]
for p in parent['rows'][:5]:
    row=bound(p['mediator_eV'],p['alpha_for_DP_comparator_exponent'])
    row['Born_comparator_exponent']=cfg['frozen_diosi']['gaussian_exponent_at_hold']
    row['bound_below_comparator']=row['D_upper']<row['Born_comparator_exponent']
    rows.append(row)
ten=rows[-1]
checks={
    'tail_extension_stable':abs(bound(10,ten['alpha'],100)['D_upper']/ten['D_upper']-1)<1e-9,
    'ten_eV_bound_below_comparator':ten['bound_below_comparator'],
    'all_potentials_small_against_kinetic':all(r['max_potential_over_kinetic']<1e-4 for r in rows),
    'all_kR_large':all(r['kR']>1e6 for r in rows),
    'sphere_charge_small_a_limit':abs(scaled_H(.001)*math.exp(.001)-1)<1e-6,
    'exponential_envelope_valid_sample':all(2*(1-math.cos(x))<=min(4,x*x)+1e-14 for x in [.001,.1,1,2,3,10,100]),
}
assert all(checks.values()),checks
output={'evidence_class':'conditional_full_phase_eikonal_upper_bound_not_exact_scattering',
    'parent_sha256':hashlib.sha256(parent_path.read_bytes()).hexdigest(),
    'config_sha256':parent['config_sha256'],'rows':rows,'checks':checks,
    'assumptions':['uniform rigid real Yukawa sphere','same isotropic monochromatic population as parent',
        'straight-line eikonal elastic approximation','interior bounded by unitarity, exterior exact eikonal phase',
        'no absorption, lattice excitation, transport, or detector likelihood'],
    'limitations':['small potential and large kR checks are not a certified error estimate',
        'loose upper bound is not a predicted decoherence rate',
        'long-range cases with high bounds remain undecided']}
lead=[]
for mass,delta in [(1000.,297.),(1100.,377.)]:
    mx=131.293*.93149410242; mc=12*.93149410242
    mux=mass*mx/(mass+mx); muc=mass*mc/(mass+mc)
    vmin=(mx*248e-6/mux+delta*1e-6)/math.sqrt(2*mx*248e-6)*299792.458
    lead.append({'mchi_GeV':mass,'splitting_keV':delta,'mean_Xe_vmin_248keV_kms':vmin,
        'carbon_max_splitting_at_776kms_keV':.5*muc*v*v*1e6,
        'free_carbon_upscatter_open_at_776kms':delta<.5*muc*v*v*1e6})
output['new_lead_kinematics']=lead
(base/'casimir-dp-yukawa-eikonal-bound-2026-09-06.json').write_text(json.dumps(output,indent=2)+'\n')
print(json.dumps(output,indent=2))
