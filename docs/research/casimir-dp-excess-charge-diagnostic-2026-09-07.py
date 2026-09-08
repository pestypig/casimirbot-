"""Formal Born envelope for a one-sign excess-charge distribution."""
import hashlib,json,math
from pathlib import Path
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
cfg=json.loads(p.read_text());d=cfg['leading_design']
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
v=776/299792.458;hc=1.973269804e-5
pref=.003*776e5*d['hold_time_s']*8*math.pi/v**2*hc**2
inventory=6*d['mass_kg']/(12*1.66053906892e-27)
rows=[]
for r in json.loads(p.read_text())['rows']:
 masses=[m*1e9 for m in r['masses_GeV']];cs=r['effective_alpha_products']
 coef=pref*sum(abs(c)/m for c,m in zip(cs,masses))**2
 required=math.sqrt(cfg['frozen_diosi']['gaussian_exponent_at_hold']/coef)
 rows.append(dict(masses_GeV=r['masses_GeV'],formal_D_per_excess_charge_squared_upper=coef,
  formal_required_charge_lower=required,required_over_electron_inventory=required/inventory,
  pointlike_individual_range_strengths_at_required_charge=[2*1e11*required*abs(c)/m for c,m in zip(cs,masses)]))
out=dict(status='formal_Born_charge_scaling_not_nonperturbative_bound',rows=rows,
 carbon_electron_inventory=inventory,
 derivation='|F_excess|<=|Q|; branch filter<=2; L2 triangle inequality integral_0^infty q dq |A|^2 <= (sum |alpha_i|/m_i)^2/2',
 limitations=['one-sign excess-charge distribution; net Q alone does not bound mixed-sign patches',
 'no finite-size suppression, physical kinematic cutoff or destructive mediator interference retained',
 'large required charge is outside any established macroscopic Born validity domain',
 'fully removed electron inventory is a scale comparison, not a realizable stable diamond sphere',
 'not a physical total bound or charged-apparatus prediction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
