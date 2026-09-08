"""Conditional cancellation tolerance, not a force-data recast."""
from pathlib import Path
import json,hashlib,math
p=Path(__file__).with_name('casimir-dp-yukawa-force-screen-2026-09-06.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='8d9c3bb9f1adf98b246cbe094bf4fcad6777644fc85f627af640700dcb4a50f4'
d=json.loads(p.read_text());rows=[]
for r in d['rows']:
 eps=1/r['minimum_over_screen_ceiling']
 rows.append(dict(mass_eV=r['mediator_eV'],inherited_residual_force_fraction=eps,linear_coupling_mismatch_fraction=eps/2,linear_mass_mismatch_fraction_at_r_equals_range=2*eps))
# Force radial factor is (1+mr)*exp(-mr), not merely exp(-mr).
def logfactor(x):return math.log1p(x)-x
shift=1e-6;log_charge_ratio2=logfactor(1)-logfactor(1+shift)
res={str(x):-math.expm1(log_charge_ratio2+logfactor(x*(1+shift))-logfactor(x)) for x in [.5,1.,2.]}
assert abs(res['1.0'])<1e-14
out=dict(rows=rows,relative_mass_shift_demo=shift,force_residuals_after_matching_at_one_range=res,DM_static_amplitude_relative_to_scalar_for_gchiV_over_gchiS={'0':1,'1':0,'-1':2},scope='Equal ordinary-charge scalar/vector cancellation toy. Inherited single-force ceilings only motivate relative precision; no two-mediator geometric likelihood or allowed model. DM ratios use equal mediator mass and matched ordinary couplings, leading static limit.',model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
