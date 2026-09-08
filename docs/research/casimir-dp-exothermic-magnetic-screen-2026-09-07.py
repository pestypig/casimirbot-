"""Conditional magnetic-moment and rigid-channel comparison, not a joint fit."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-exothermic-all-speed-envelope-2026-09-07.json'
x=json.loads(p.read_text()); r=x['rows'][1]; f=r['excited_fraction']
K=r['D_any_speed_distribution_upper']*f*f/(1-f)
alpha=1/137.035999084; mmu=.1056583755
def coefficient(med):
    r=med/mmu
    return alpha/(2*math.pi)*quad(lambda z:2*z*(1-z)**2/((1-z)**2+r*r*z),0,1,epsabs=1e-13)[0]
coef=coefficient(1.)
# Independent change of variable z=1-t.
alt=alpha/(2*math.pi)*quad(lambda t:2*(1-t)*t*t/(t*t+(1-t)/mmu**2),0,1,epsabs=1e-13)[0]
assert abs(alt/coef-1)<1e-12
heavy=alpha/(3*math.pi)*(mmu/100.)**2
assert abs(coefficient(100.)/heavy-1)<1e-3
upper=(38+1.96*63)*1e-11; eps2=upper/coef
rows=[]
for cap in [.1,1.]:
    fmin=1.7e-17/(cap*eps2)
    rows.append(dict(alpha_D_cap=cap,minimum_excited_fraction=fmin,
                     conditional_D_upper=K*(1-fmin)/fmin**2))
out=dict(status='conditional_gaussian_magnetic_screen',source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
    theory_source='https://arxiv.org/abs/2505.21476v3',
    delta_a_mu_mean=38e-11,delta_a_mu_sigma=63e-11,
    prescription='upper endpoint of central Gaussian 95 percent interval; no cancellation from other new physics',
    coefficient_per_epsilon_squared=coef,epsilon_upper=math.sqrt(eps2),rows=rows,
    limitations=['Inherited uniform rigid additive channel only; not total material response',
    'Fixed illustrative xenon product; not an official LZ likelihood normalization',
    'No population-history solution or attainable sensitivity demonstrated',
    'Coupling caps are declared scope, not perturbative matching certification'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
