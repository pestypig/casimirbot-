"""Conservative plot-envelope B-L recast; not a precision likelihood fit."""
import math,json,hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-bl-two-mediator-screen-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ddc698c716a2aa274096819bfdf2694b2d60148ae45313690509bc641bd90d56'
a=json.loads(p.read_text())['rows'][0]['effective_alpha_products'][0]
G=6.70883e-39 # GeV^-2
mu=.93149410242 # GeV
f=.5 # deliberately reduced neutron fraction for platinum-dominated source
limit=1e3 # deliberately weak visual envelope at lambda=19.73 micrometers
sm=math.sqrt(4*math.pi*G*mu**2*limit/f**2)
dark=4*math.pi*a/sm
assert math.isclose(sm*dark/(4*math.pi),a,rel_tol=1e-14)
out=dict(status='conservative_unscreened_vector_perturbative_candidate_rejection',
 mediator_eV=.01,range_m=1.973269804e-5,visual_abs_yukawa_ceiling=limit,
 neutron_fraction_screen=f,SM_coupling_ceiling=sm,required_dark_coupling=dark,
 required_dark_alpha=dark**2/(4*math.pi),
 perturbative_SM_floor=math.sqrt(4*math.pi)*a,
 floor_over_ceiling=math.sqrt(4*math.pi)*a/sm,
 source='https://arxiv.org/pdf/2002.11761',
 source_sha256='ffcddf6d2c1a758f07112a3125ae8583254a3089b1022ac2cf459a052652504c',
 limitations=['visual conservative envelope, not digitized fit',
 'platinum-dominated composition approximation, not layered torque recast',
 'unscreened linear vector force and dark alpha <= 1 criterion',
 'does not constrain the 1 eV row at its different range'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
