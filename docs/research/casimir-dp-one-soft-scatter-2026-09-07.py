"""Exactly-one soft collision through an infinite homogeneous silica slab."""
import math,json,hashlib
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-coupled-attenuation-branches-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='16e728335769bbfa142a873a44d585de38118fb5a686705517d8866246d7e9f1'
branch=json.loads(p.read_text())['rows'][1]
s=json.loads((base/'casimir-dp-silica-attenuation-2026-09-07.json').read_text())
m=100.;v=776/299792.458;med=.01;eps=1e-6
tau=branch['silica_optical_depth'];a=branch['cross_section_multiplier']
species=[]
for r in s['rows']:
    ma=r['A']*.93149410242;mu=m*ma/(m+ma)
    species.append((ma,mu,r['optical_depth']*a))
p2=m*m*v*v;pp2=p2-2*m*eps
cos_lower=math.sqrt(1-2*max(t[0] for t in species)*eps/pp2)
kupper=p2/pp2/cos_lower
soft_tau=0.;exact_ratio=0.
for ma,mu,ta in species:
    Emax=2*mu*mu*v*v/ma;b=med*med/(2*ma)
    norm=1/b-1/(Emax+b)
    soft_tau+=ta*(1/b-1/(eps+b))/norm
    def integrand(E):
        vp2=v*v-2*E/m
        cosine=(p2-(m+ma)*E)/math.sqrt(p2*(p2-2*m*E))
        sig_ratio=sum(ti/tau*(1+4*ui*ui*v*v/med**2)/(1+4*ui*ui*vp2/med**2) for _,ui,ti in species)
        k=sig_ratio/cosine
        z=tau*(k-1)
        depth_factor=-math.expm1(-z)/z if abs(z)>1e-12 else 1-z/2
        return depth_factor/((E+b)**2*norm)
    exact_ratio+=ta*quad(integrand,0,eps,epsabs=1e-12,epsrel=1e-10)[0]
lower=soft_tau*math.exp(-tau*(kupper-1))
assert 0<lower<=exact_ratio<=soft_tau
endpoints=[]
for A in range(124,137):
    ma=A*.93149410242;mu=m*ma/(m+ma)
    endpoints.append(2*mu*mu*(v*v-2*eps/m)/ma*1e6)
assert min(endpoints)>269.9
out=dict(status='exactly_one_collision_component_in_conditional_slab',
    source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),maximum_loss_keV=eps*1e6,
    initial_slab_optical_depth=tau,soft_optical_depth=soft_tau,
    outgoing_cosine_lower_bound=cos_lower,postcollision_optical_depth_multiplier_upper=kupper,
    one_soft_to_uncollided_transmission_lower=lower,
    one_soft_to_uncollided_transmission_quadrature=exact_ratio,
    uncollided_plus_one_soft_relative_to_uncollided=1+exact_ratio,
    minimum_diagnostic_xenon_endpoint_after_max_loss_keV=min(endpoints),
    limitations=['infinite laterally uniform slab','normal incident uniform beam','point-nucleus Born law',
    'no second collision in this component','not complete transport','not accepted detector counts'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
