"""Mass-family lifetime bound for the declared vector transition only."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-semivisible-lifetime-2026-09-07.py'
ns={'__file__':str(p.resolve())};exec(p.read_text().split('m1,m2,ma,me=')[0],ns)
a=ns['a'];ma=.01;me=.00051099895;EA=50.;hc=1.973269804e-16
assert (EA*2*me/ma**2)**2>1.25
length=6*math.pi*hc/(a*a*ma)*math.sqrt((EA/ma)**2-1)
prob=-math.expm1(-10/length)
rng=np.random.default_rng(9810);checks=[]
for _ in range(100):
    m1=rng.uniform(0,(ma-2*me)/2)
    m2=rng.uniform(m1+2*me,ma-m1)
    width=ns['width'](m1,m2,ma,me)
    upper=a*a*m2**5/(6*math.pi*ma**4)
    ratio=width/upper
    assert 0<=ratio<=1+1e-12
    Estar=(ma*ma+m2*m2-m1*m1)/(2*ma)
    momentum=math.sqrt(max(0,Estar*Estar-m2*m2))
    Emin=EA/ma*(Estar-math.sqrt(1-(ma/EA)**2)*momentum)
    assert Emin>=EA*m2*m2/ma**2*(1-1e-12)
    lab=hc/width*math.sqrt((Emin/m2)**2-1)
    assert lab>=length
    checks.append(dict(m1_GeV=m1,m2_GeV=m2,width_over_upper=ratio,lab_length_m=lab))
out=dict(status='analytic_mass_family_bound_with_numerical_checks',mediator_GeV=ma,product=a,
    parent_energy_GeV=EA,min_lab_length_m=length,max_decay_probability_in_10m=prob,
    domain='m1>=0, m2-m1>2me, m1+m2<mA; declared off-diagonal vector interaction',
    source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),checks=checks,
    limitations=['Tree transition width; no new channels or enhanced transition charge',
      'On-shell parent at specified energy and chosen path distance, not full NA64 acceptance',
      'Parent production branching and light-state cosmology not supplied',
      'Not a global exclusion of semivisible sectors'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:out[k] for k in ['min_lab_length_m','max_decay_probability_in_10m']}))
