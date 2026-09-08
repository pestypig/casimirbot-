"""Conditional two-target Born kernel. Not an LZ fit or a solid-response closure."""
import csv
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad
from scipy.special import k0

base = Path('docs/research')
config = Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
cfg = json.loads(config.read_text(encoding='utf-8'))
design = cfg['leading_design']
u_kg, u_GeV = 1.66053906892e-27, .93149410242
hbc_GeVm, GeV2_cm2 = 1.973269804e-16, .3893793721e-27
year, c_kms = 365.25*86400, 299792.458
mchi, rho, v_kms, alpha_ref = 1000., .3, 776., 1e-20
v = v_kms/c_kms
flux = rho/mchi*v_kms*1e5
Axe, Ac = 131.293, 12.
mxe = Axe*u_GeV
Nxe = 2.84*1000/(Axe*u_kg)
charge = design['mass_kg']/u_kg
R = design['radius_m']/hbc_GeVm
dR = design['branch_separation_m']/design['radius_m']
hold = design['hold_time_s']
Rxe = 1.2*Axe**(1/3)*1e-15/hbc_GeVm
mu = mchi*mxe/(mchi+mxe)
Emax = 2*mu*mu*v*v/mxe

def form(x):
    return 1-x*x/10+x**4/280 if abs(x)<1e-3 else 3*(math.sin(x)-x*math.cos(x))/x**3

def loss_filter(x):
    return x*x/6-x**4/120+x**6/5040 if abs(x)<1e-3 else 1-math.sin(x)/x

def dsigma_dE(E, mediator, finite=True):
    q = math.sqrt(2*mxe*E)
    f2 = form(q*Rxe)**2 if finite else 1.
    return 8*math.pi*mxe*Axe*Axe/(v*v*(q*q+mediator*mediator)**2)*f2

def xe_kernel(mediator, finite=True):
    hi = min(270e-6, Emax)
    if hi<=200e-6: return 0.
    sigma = quad(lambda E:dsigma_dE(E,mediator,finite),200e-6,hi,epsabs=0,epsrel=2e-10)[0]
    return sigma*GeV2_cm2*flux*Nxe*year

def local_kernel(mediator, cutoff=80., separation_ratio=dR):
    a = mediator*R
    # x=qR; log grid resolves mediator and spatial-filter scales.
    xmin = min(a,1.)*1e-7
    def integrand(logx):
        x=math.exp(logx)
        return 2*x*x/(x*x+a*a)**2*form(x)**2*loss_filter(x*separation_ratio)
    val=quad(integrand,math.log(xmin),math.log(cutoff),epsabs=0,epsrel=2e-8,limit=600)[0]
    return 4*math.pi*charge**2/v**2*R**2*val*GeV2_cm2*flux*hold

def central_eikonal_per_alpha(mediator):
    a=mediator*R
    # Uniform sphere projected density convolved with Yukawa line integral.
    if a>100:
        integral=quad(lambda y:y*math.sqrt(max(0.,1-(y/a)**2))*k0(y),0,100,epsabs=1e-12)[0]/a**2
    else:
        integral=quad(lambda z:z*math.sqrt(1-z*z)*k0(a*z),0,1,epsabs=0,epsrel=2e-10)[0]
    return 6*charge/v*integral

rows=[]
for mev in [.001,.01,.1,1.,10.,1e3,1e6,1e9]:
    mediator=mev*1e-9
    kxe,kpoint=xe_kernel(mediator),xe_kernel(mediator,False)
    kd=local_kernel(mediator)
    chi=central_eikonal_per_alpha(mediator)
    # alpha for D=.029511... is an inverse diagnostic, NOT a fitted coupling.
    needed=math.sqrt(cfg['frozen_diosi']['gaussian_exponent_at_hold']/kd)
    rows.append({'mediator_eV':mev,'K_Xe_200to270keV_per_alpha2':kxe,
        'K_Xe_point_per_alpha2':kpoint,'K_D_soft_per_alpha2':kd,
        'D_per_Xe_raw_band_count':kd/kxe,
        'Xe_raw_at_alpha_reference':kxe*alpha_ref**2,
        'D_soft_at_alpha_reference':kd*alpha_ref**2,
        'central_phase_at_alpha_reference':chi*alpha_ref,
        'alpha_for_DP_comparator_exponent':needed,
        'central_phase_at_comparator_alpha':chi*needed,
        'comparator_extrapolation_passes_phase_screen':chi*needed<.1,
        'D_at_central_phase_point_one':kd*(.1/chi)**2,
        'Xe_raw_at_comparator_alpha':kxe*needed**2,
        'soft_cutoff_40_to_80_relative_change':abs(kd-local_kernel(mediator,40))/kd})

test_m=1e-9
analytic=(4*math.pi*Axe*Axe/v**2)*(
    1/(2*mxe*200e-6+test_m**2)-1/(2*mxe*270e-6+test_m**2))
numeric=xe_kernel(test_m,False)/(GeV2_cm2*flux*Nxe*year)
tests={
    'point_Xe_integral_matches_analytic':abs(numeric/analytic-1)<1e-10,
    'uniform_form_zero_limit':form(0.)==1.,
    'coincident_branches_no_decoherence':local_kernel(test_m,separation_ratio=0.)==0.,
    'finite_Xe_reduces_point_rate':all(r['K_Xe_200to270keV_per_alpha2']<r['K_Xe_point_per_alpha2'] for r in rows),
    'reference_central_phase_below_point_one':all(r['central_phase_at_alpha_reference']<.1 for r in rows),
    'positive_two_target_kernels':all(r['K_D_soft_per_alpha2']>0 and r['K_Xe_200to270keV_per_alpha2']>0 for r in rows),
    'large_mR_eikonal_limit':abs(central_eikonal_per_alpha(1e-3)/(6*charge/(v*(1e-3*R)**2))-1)<1e-8,
    'all_comparator_extrapolations_flagged':all(not r['comparator_extrapolation_passes_phase_screen'] for r in rows),
}
assert all(tests.values()),tests
result={'evidence_class':'conditional_Born_isotropic_monochromatic_uniform_density_soft_channel',
    'model':{'potential':'V(r)=-alpha*A*exp(-m_phi*r)/r, natural units; uniform source convolution',
        'alpha_definition':'g_chi*g_N/(4*pi)','g_p_equals_g_n':True,'g_e':0,
        'mchi_GeV':mchi,'rho_GeV_cm3':rho,'speed_kms':v_kms,
        'directions':'isotropic shell, not Standard Halo Model','alpha_reference':alpha_ref,
        'Xe_mean_A':Axe,'Xe_uniform_radius_fm':Rxe*hbc_GeVm/1e-15,
        'Xe_exposure_tonne_year':2.84,'Xe_true_energy_band_keV':[200,270],
        'Xe_efficiency':1,'local_qR_cutoff':80,'local_qmax_eV':80/R*1e9,
        'object_effective_nucleon_count':charge,'hold_seconds':hold,
        'boundary_dependence':False,'isotropic_phase_prediction':0},
    'config_sha256':hashlib.sha256(config.read_bytes()).hexdigest(),
    'rows':rows,'checks':tests,
    'limitations':['not LZ response fit','uniform Xe density is not authenticated isotope response',
        'local result includes only rigid coherent low-q elastic channel',
        'no actual branch ramp histories','no screening/transport or external-admission calculation',
        'central eikonal phase is a perturbativity screen, not full Born error certificate',
        'comparator inversion is not evidence of a measured local residual']}
out=base/'casimir-dp-shared-yukawa-screen-2026-09-06.json'
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
with (base/'casimir-dp-shared-yukawa-screen-2026-09-06.csv').open('w',newline='',encoding='utf-8') as f:
    writer=csv.DictWriter(f,fieldnames=list(rows[0])); writer.writeheader();writer.writerows(rows)
with (base/'casimir-dp-shared-yukawa-xe-spectrum-2026-09-06.csv').open('w',newline='',encoding='utf-8') as f:
    writer=csv.writer(f)
    writer.writerow(['mediator_eV','true_recoil_keV','raw_counts_per_keV_per_alpha2_in_2p84_tonne_year'])
    for row in rows:
        for energy in range(1,271):
            val=dsigma_dE(energy*1e-6,row['mediator_eV']*1e-9)*1e-6*GeV2_cm2*flux*Nxe*year
            writer.writerow([row['mediator_eV'],energy,val if energy*1e-6<=Emax else 0.])
print(json.dumps({'rows':rows,'checks':tests},indent=2))
