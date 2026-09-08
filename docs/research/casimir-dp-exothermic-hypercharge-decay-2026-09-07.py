"""Pure kinetic-mixing neutrino amplitude: both neutral-vector exchanges."""
import hashlib,json,math
from pathlib import Path
import sympy as sy
from scipy.integrate import quad
b=Path(__file__).parent;p=b/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
data=json.loads(p.read_text())
s,M,Z,k,c,w=sy.symbols('s M Z k c w',nonzero=True)
D0=sy.diag(1/s,1/(s-Z),1/(s-M))
K1=sy.Matrix([[0,0,k*c*s],[0,0,-k*w*s],[k*c*s,-k*w*s,0]])
D1=-D0*K1*D0
assert sy.simplify(D1[2,1]-k*w*s/((s-M)*(s-Z)))==0
assert sy.limit(D1[2,1],s,0)==0
partial=M/((M-Z)*(s-M))-Z/((M-Z)*(s-Z))
assert sy.simplify(partial-s/((s-M)*(s-Z)))==0
moment=2.5*quad(lambda u:u*u*(1-u)**1.5,0,1,epsabs=1e-13,epsrel=1e-12)[0]
assert abs(moment-8/63)<1e-12
cw2=1-.23122;mz=91.1876;mv=100.;r=(1/137.035999084)/(4*math.pi);rows=[]
for row in data['rows']:
 d=abs(row['delta_GeV']);ce=r*row['C_nucleon_GeV_minus2']
 width=ce*ce*d**9/(1260*math.pi**3*cw2**2*mz**4)
 correction=2.5*quad(lambda u:u*u*(1-u)**1.5/((1-d*d*u/mz**2)**2*(1-d*d*u/mv**2)**2),0,1,epsabs=1e-13,epsrel=1e-12)[0]/moment
 tau=6.582119569e-25/(width*correction)
 rows.append(dict(mchi_GeV=row['mchi_GeV'],three_flavor_neutrino_partial_lifetime_s=tau,age_over_partial_lifetime=4.35e17/tau,finite_propagator_factor=correction,endpoint_abs_Cnu_over_Ce=d*d/(2*cw2*(mz*mz-d*d))))
out=dict(scope='Pure hypercharge kinetic insertion to first order, no independent X-Z mass mixing/direct neutrino charge; leading heavy dark vector current; three massless active flavors. Baryonic UV completion and population production not supplied.',constants=dict(sin2theta_diagnostic=.23122,mZ_GeV=mz,mX_GeV=mv,abs_Ce0_over_Cb=r),single_flavor_width='Ce0^2 gap^9/(3780 pi^3 cos(theta)^4 mZ^4)',three_flavor_width='Ce0^2 gap^9/(1260 pi^3 cos(theta)^4 mZ^4)',literature='https://arxiv.org/pdf/2105.05255v1 equation B3 translates to the single-flavor coefficient; its flavor-sum convention remains unverified.',rows=rows,checks=dict(symbolic_propagator=True,zero_momentum_cancellation=True,spectral_moment=moment),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
