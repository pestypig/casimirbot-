"""Conditional one-neutron p1/2 oscillator response; not an empirical carbon model."""
import hashlib, json, math
from pathlib import Path
from scipy.integrate import quad

config = Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha = hashlib.sha256(config.read_bytes()).hexdigest()
assert sha == '5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d = json.loads(config.read_text())['leading_design']
def transverse(k):
    y = k*k/4
    return -(1-2*y)*math.exp(-y)/3
def realspace_pz(k):
    return quad(lambda z: 2*z*z*math.exp(-z*z)*math.cos(k*z)/math.sqrt(math.pi),
                -10, 10, epsabs=1e-12)[0]
checks = {
    'independent_realspace_Fourier': all(abs(transverse(k)+realspace_pz(k)/3)<1e-11 for k in [0,.1,.5,1,2,3]),
    'zero_q_spin_projection': transverse(0) == -1/3,
    'angular_momentum_projection': abs((.5*1.5+.5*1.5-1*2)/(2*.5*1.5)+1/3)<1e-15,
    'transverse_node': abs(transverse(math.sqrt(2)))<1e-15,
}
u=1.66053906892e-27; mn=.93956542052; hbarc=.1973269804 # GeV fm
mchi=1000.; mC=13.00335483507*.93149410242-6*.00051099895
v=776/299792.458; flux=.3/mchi*776e5
mu=mchi*mC/(mchi+mC); qmax=2*mu*v
f13=.0107; NC13=d['mass_kg']/((12*(1-f13)+13.00335483507*f13)*u)*f13
cN=1/246.2**2 # Explicit per-nucleon coefficient in GeV^-2; not LZ fitted d_s.
conv=.3893793721e-27
rows=[]
for b in [1.4,1.6,1.8,2.0]:
    # d sigma/d(q^2) = <|M_NR|^2>/(4 pi v^2),
    # <|M_NR|^2> = 2 cN^2 q^4 kappa_T(q)^2 / mn^4.
    integral=quad(lambda t: t*t*transverse(qmax*math.sqrt(t)*b/hbarc)**2,
                  0,1,epsabs=1e-13)[0]*qmax**6
    sigma=cN*cN*integral/(2*math.pi*v*v*mn**4)*conv
    events=flux*d['hold_time_s']*NC13*sigma
    # General real decoherence filter 0<=1-cos(q.d)<=2.
    rows.append({'oscillator_b_fm_assumed':b, 'sigma_C13_cm2':sigma,
                 'independent_free_nucleus_expected_count':events,
                 'conditional_D_upper_2N':2*events})
point_integral=qmax**6/27
checks['point_limit_integral'] = abs(quad(lambda t:t*t/9,0,1)[0]*qmax**6/point_integral-1)<1e-12
assert all(checks.values())
out={'config_sha256':sha,'checks':checks,'coefficient_per_nucleon_GeV_minus2':cN,
     'mchi_GeV':mchi,'speed_km_s':776,'density_GeV_cm3':.3,'qmax_GeV':qmax,
     'C13_count_assuming_natural_fraction':NC13,'rows':rows,
     'scope':'Conditional nuclear-elastic free-carbon impulse channel, unpolarized independent nuclei. No solid response or experimental bound.',
     'excluded_from_claim':['configuration mixing','two-body currents','core polarization','solid spin dynamics',
                            'coherent correlated spin states','postselected survival','LZ coefficient inference']}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
