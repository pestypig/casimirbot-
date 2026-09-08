import math,json,hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-bl-two-mediator-screen-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ddc698c716a2aa274096819bfdf2694b2d60148ae45313690509bc641bd90d56'
a0=json.loads(p.read_text())['rows'][1]['effective_alpha_products'][0]
g=1e-11;v=200/299792.458
alpha0=4*math.pi*(a0/g)**2
b0=2*alpha0*1e-9/(100*v*v)
rows=[]
for f in [1,.5,.1]:
 a=a0/math.sqrt(f);alpha=4*math.pi*(a/g)**2;b=b0/f
 assert math.isclose(f*a*a,a0*a0,rel_tol=1e-14)
 assert alpha<1 and b<1
 ratio=math.log1p(b**-2)/math.log1p(b0**-2)/f
 rows.append(dict(local_density_fraction=f,product_scale=1/math.sqrt(f),dark_alpha=alpha,
   self_transport_rate_ratio=ratio))
out=dict(status='conditional_abundance_scaling_obstruction_not_halo_exclusion',g_SM=g,
 relative_speed_kms=200,minimum_fraction_for_dark_alpha_le_one=alpha0,rows=rows,
 assumptions=['same velocity distribution and raw xenon rate','both mediator products scale together',
 'light repulsive self-scattering fit; heavy term omitted','local fraction need not equal cosmological fraction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
