"""Conditional active-neutrino contact decay and optimized population ceiling."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.optimize import minimize_scalar
b=Path(__file__).parent;p=b/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
data=json.loads(p.read_text())
# Explicit Dirac trace checks the PL normalization in the leading J_dark^0 kernel.
I=np.eye(2);Z=np.zeros((2,2));pauli=[np.array([[0,1],[1,0]]),np.array([[0,-1j],[1j,0]]),np.diag([1,-1])]
g=[np.block([[I,Z],[Z,-I]])]+[np.block([[Z,p],[-p,Z]]) for p in pauli]
g5=1j*g[0]@g[1]@g[2]@g[3];PL=(np.eye(4)-g5)/2
assert np.allclose(PL@PL,PL)
def slash(p):return p[0]*g[0]-sum((p[i+1]*g[i+1] for i in range(3)),np.zeros((4,4),complex))
errors=[]
for costheta in [-.8,-.2,.3,.8]:
 a=slash([1.,0,0,1.]);z=slash([1.,math.sqrt(1-costheta**2),0,costheta])
 v=np.trace(a@g[0]@z@g[0]);left=np.trace(a@g[0]@PL@z@g[0]@PL)
 errors.append(float(abs(left/v-.5)))
assert max(errors)<1e-14
age=4.35e17;hbar=6.582119569e-25;rtest=(1/137.035999084)/(4*math.pi);rows=[]
for w in data['rows']:
 gap=abs(w['delta_GeV']);C=w['C_nucleon_GeV_minus2']
 tau0=hbar*60*math.pi**3/(C*C*gap**5)
 crit=math.sqrt(2*tau0/(3*math.e*age))
 decay_b=age/tau0*1.5*rtest**2
 # Optimize in z=b*x to check the analytic strength ceiling without wide x bounds.
 opt=minimize_scalar(lambda z:-z*math.exp(-z),bounds=(.01,10),method='bounded')
 ceiling=1/(math.e*decay_b)
 assert abs((-opt.fun/decay_b)/ceiling-1)<1e-10
 rows.append(dict(mchi_GeV=w['mchi_GeV'],massless_vector_tau0_s=tau0,equal_three_flavor_r_max_f0_1=crit,equal_three_flavor_r_max_f0_half=crit/math.sqrt(2),illustrative_r_test=rtest,neutrino_only_max_strength_at_r_test=ceiling,neutrino_only_max_strength_at_r_1=crit**2,other_channels_included=False))
out=dict(operator='sum_i Cnu_i (chi_bar gamma_mu chi_star+h.c.) nu_bar_i gamma^mu PL nu_i; PL=(1-gamma5)/2',width_GeV='gap^5 sum_i abs(Cnu_i)^2 / (120 pi^3)',population='x=sigma/sigma_ref; S=x*f0*exp(-b*x); b=age/tau0*sum_i abs(Cnu_i/Cb)^2/2; max S=f0/(e*b)',scope='Leading gap/mchi, massless active neutrinos, constant contacts and coupling ratios, primordial population with no replenishment. Necessary survival condition, not full mediator matching or external exclusion.',age_s=age,rows=rows,checks=dict(chiral_trace_max_error=max(errors),numerical_population_optimum=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
