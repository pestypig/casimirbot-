"""Static Gaussian-atom screening of the rigid sphere soft charge channel only."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad

config=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha=hashlib.sha256(config.read_bytes()).hexdigest()
assert sha=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(config.read_text())['leading_design']
R=d['radius_m']; separation=d['branch_separation_m']; hc=1.973269804e-7
def sphere(x):return 1-x*x/10+x**4/280 if abs(x)<1e-3 else 3*(math.sin(x)-x*math.cos(x))/x**3
def coherence(x):return x*x/6-x**4/120 if abs(x)<1e-3 else 1-math.sin(x)/x
def screen(x,a):return -math.expm1(-(x*a/R)**2/6)
def integral(a,cut,screened=True):
    def kernel(x):
        if x==0:return 0.
        return 2/x*sphere(x)**2*coherence(x*separation/R)*(screen(x,a)**2 if screened else 1)
    return quad(kernel,0,cut,epsabs=1e-30 if screened else 1e-12,epsrel=1e-8,limit=1000)[0]
rows=[]
for a_nm in [.05,.1,.15]:
    for cut in [1.,10.,80.]:
        a=a_nm*1e-9; screened=integral(a,cut); bare=integral(a,cut,False)
        # Uniform neutral-atom centers: charge amplitude = N_atoms Z (1-fe) F_sphere.
        atoms=d['mass_kg']/(12.011*1.66053906892e-27)
        rows.append({'assumed_electron_rms_nm':a_nm,'qR_cut':cut,'qmax_eV':cut*hc/R,
                     'neutral_integral':screened,'bare_integral':bare,'neutral_to_bare_ratio':screened/bare,
                     'Natom_squared_Z_squared_times_integral':atoms**2*36*screened})
checks={
    'neutral_zero_q':screen(0,.1e-9)==0,
    'quadratic_amplitude_limit':abs(screen(1,.1e-9)/((.1e-9/R)**2/6)-1)<1e-6,
    'quartic_size_scaling':abs(integral(.1e-9,1)/integral(.05e-9,1)/16-1)<1e-6,
    'screening_reduces_soft_channel':all(0<r['neutral_to_bare_ratio']<1 for r in rows),
    'positive_partial_integral':all(rows[i+1]['neutral_integral']>rows[i]['neutral_integral'] for i in [0,1,3,4,6,7]),
}
assert all(checks.values())
out={'config_sha256':sha,'checks':checks,'rows':rows,
     'scope':'Partial qR<=80 rigid elastic charge channel, isotropic mono-speed soft-transfer limit. No all-q or full material bound.',
     'model':'Neutral spherical Gaussian electron cloud per carbon atom; a is rms radius, not measured diamond charge density.',
     'rate_multiplier':'D_soft = flux*hold*alpha*mu_chi^2*(hbar*c)^2*Natom^2*Z^2*integral, mu_chi in GeV^-1 and hbar*c in GeV cm',
     'missing':['magnetic response','electron excitations','bonding and dielectric response','surface charge','all-q atomic/crystal structure','matched xenon likelihood','Born and transport validity at inferred coupling']}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
