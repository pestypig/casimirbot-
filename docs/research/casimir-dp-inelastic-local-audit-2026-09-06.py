"""Model-identifiability and conditional contact-scattering bounds; no LZ fit."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad

base=Path('docs/research')
config=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
cfg=json.loads(config.read_text()); d=cfg['leading_design']
u=1.66053906892e-27; mn=.93956542052; c=29979245800.; conv=.3893793721e-27
speed=776e5; beta=speed/c; rho=.3; hold=d['hold_time_s']
A=d['mass_kg']/u; NC=A/12; R=d['radius_m']/1.973269804e-16
def mu(m,target): return m*target/(m+target)
m=1000.; delta=297e-6; sig=6.5e-43; mun=mu(m,mn); muc=mu(m,12*.93149410242)
cn=math.sqrt(math.pi*sig/conv)/mun
Lambda=math.sqrt(3/cn)
sigmaC=sig*12**2*(muc/mun)**2
# Exothermic contact phase-space factor: v*sigma_down = sigmaC*sqrt(v^2+2 delta/mu).
Ndown=rho/m*NC*hold*sigmaC*c*math.sqrt(beta*beta+2*delta/muc)
mixing=[]
for asym in [0.,.5,1.]:
    center=m+delta/2
    mL=delta*(1-asym)/2; mR=delta*(1+asym)/2
    mD=math.sqrt(center*center-(asym*delta/2)**2)
    eig,U=np.linalg.eigh([[mL,mD],[mD,mR]])
    Q=U.T@np.diag([1.,-1.])@U
    mixing.append({'asymmetry':asym,'physical_masses_GeV':sorted(abs(eig).tolist()),
        'diagonal_Weyl_charge_magnitude':abs(Q[0,0]),'offdiagonal_charge_magnitude':abs(Q[0,1])})

# Published benchmark inputs, not independently derived loop amplitudes.
table=[('3M2D',.00595,1440.,372.,1.26e-47),('5M4D',.0137,7580.,377.3,1.12e-46),
       ('7M6D',.0233,22230.,370.8,4.45e-46),('9M8D',.0343,49080.,363.5,1.22e-45),
       ('11M10D',.0445,83810.,357.5,2.60e-45),('13M12D',.0552,131140.,351.8,5.02e-45)]
def form(x): return 1-x*x/10+x**4/280 if abs(x)<1e-3 else 3*(math.sin(x)-x*math.cos(x))/x**3
def filt(x): return x*x/6-x**4/120 if abs(x)<1e-3 else 1-math.sin(x)/x
ratio=d['branch_separation_m']/d['radius_m']
I=quad(lambda x:2*x*form(x)**2*filt(x*ratio),0,80,epsabs=1e-10,limit=500)[0]
# For x>=80: |F|<=6/x^2 and visibility filter<=2 -> integral tail <=72/80^2.
tail=72/80**2
rows=[]
for name,y,mass,split,sigma in table:
    flux=rho/mass*speed; reduced=mu(mass,mn)
    # Inclusive triangle/kinematic envelope, allowing q up to 2*mchi*v and S<=A^2.
    point_sigma=sigma*A*A*(mass/reduced)**2
    Dupper=2*flux*hold*point_sigma
    coeff=flux*hold*sigma*A*A/(4*reduced**2*beta**2*R**2)
    stable_delta=(y*y*246.22**2/2)/(math.sqrt(mass*mass+y*y*246.22**2/2)+mass)*1e6
    rows.append({'representation':name,'y_source':y,'mchi_GeV':mass,'delta_source_keV':split,
        'delta_replayed_from_rounded_y_keV':stable_delta,'sigma_loop_source_cm2':sigma,
        'inclusive_contact_D_upper':Dupper,'rigid_uniform_soft_D':coeff*I,
        'rigid_uniform_all_q_D_upper':coeff*(I+tail),
        'carbon_max_endothermic_splitting_keV':.5*mu(mass,12*.93149410242)*beta**2*1e6})
tests={
 'fixed_mass_eigenvalues':all(max(abs(a-b) for a,b in zip(z['physical_masses_GeV'],[1000.,1000.+delta]))<1e-9 for z in mixing),
 'equal_Majorana_terms_zero_diagonal_charge':mixing[0]['diagonal_Weyl_charge_magnitude']<1e-14,
 'unequal_terms_nonzero_diagonal_charge':mixing[-1]['diagonal_Weyl_charge_magnitude']>1e-8,
 'effective_scale_replays_cross_section':abs((mun*mun/math.pi*(3/Lambda**2)**2*conv)/sig-1)<1e-12,
 'all_tree_upscatter_closed_on_free_carbon':all(z['carbon_max_endothermic_splitting_keV']<z['delta_source_keV'] for z in rows),
 'rigid_channel_below_inclusive_envelope':all(0<z['rigid_uniform_all_q_D_upper']<z['inclusive_contact_D_upper'] for z in rows),
 'rounded_y_splitting_consistent_one_percent':all(abs(z['delta_replayed_from_rounded_y_keV']/z['delta_source_keV']-1)<.01 for z in rows),
}
tests={k:bool(v) for k,v in tests.items()}
assert all(tests.values()),tests
output={'evidence_class':'conditional_local_channel_audit_not_full_model_admission',
 'source_refs':['https://arxiv.org/html/2609.02608v2','https://arxiv.org/html/2609.04144v1'],
 'config_sha256':hashlib.sha256(config.read_bytes()).hexdigest(),
 'pseudo_Dirac':{'sigma_N_cm2':sig,'c_N_GeV_minus2':cn,'Lambda_GeV':Lambda,
    'all_excited_population_free_carbon_downscatter_count_upper':Ndown,
    'downscatter_decoherence_exponent_upper':2*Ndown,'mixing_degeneracy':mixing},
 'electroweak_rows':rows,'checks':tests,
 'assumptions':['density .3 GeV/cm3, speed support <=776 km/s for inclusive bounds',
  'contact scalar SI elastic amplitude with equal proton/neutron amplitudes',
  'Born single-collision treatment and nucleon amplitude additivity',
  'cold target for inclusive q<=2*mchi*v; no exothermic internal energy release in elastic bound',
  'uniform sphere, isotropic 776 km/s shell and constant separation for rigid-channel integral',
  'published loop cross sections used as conditional inputs, not independently authenticated Wilson coefficients'],
 'open':['factor-four neutral-current normalization comparison','loop nucleon matching and isospin',
         'mediator completion, excited-state history, collider/cosmological constraints',
         'actual detector likelihood and solid dynamics']}
(base/'casimir-dp-inelastic-local-audit-2026-09-06.json').write_text(json.dumps(output,indent=2)+'\n')
print(json.dumps(output,indent=2))
