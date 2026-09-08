"""All-speed bound for the conditional uniform rigid effective-potential model."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent;root=base.parents[1]
p=root/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(p.read_text());d=c['leading_design']
source=base/'casimir-dp-exothermic-additive-coherence-2026-09-07.json'
prior=json.loads(source.read_text())
m=45.;Ms=d['mass_kg']/1.7826619216278976e-27;mu=m*Ms/(m+Ms)
vmax=798/299792.458;R=d['radius_m']/1.973269804e-16
a=d['branch_separation_m']/d['radius_m'];Xmax=2*mu*vmax*R
# J(X) <= min(a^2 X^4/8, 37), without an isotropy assumption.
Xstar=(37*8/a**2)**.25
maximum=37/Xstar
assert Xstar<Xmax
for X in [1e-9,.1,1.,Xstar,10.,100.,Xmax]:
    assert min(a*a*X**3/8,37/X)<=maximum*(1+1e-12)
rows=[dict(excited_fraction=r['excited_fraction'],
    D_any_speed_distribution_upper=r['D_rigid_additive_ceiling']*maximum/Xmax)
    for r in prior['rows']]
out=dict(status='conditional_uniform_sphere_all_speed_envelope',
    source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    Xmax=Xmax,Xstar=Xstar,maximum_J_over_X=maximum,
    maximum_ratio_to_prior_envelope=maximum/Xmax,rows=rows,
    scope='Any normalized speed/direction distribution below 798 km/s, fixed total density; inherited single-nucleus coefficient and uniform rigid additive model only')
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
