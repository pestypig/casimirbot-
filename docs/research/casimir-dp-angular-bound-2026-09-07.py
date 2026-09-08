"""Apply analytic low-scatter bound to the simulated near-normal high flux."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent
p=base/'casimir-dp-low-high-spectrum-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ad144256c1a951b96cde8a8d45f22a5077351079fc2fddd edebdbc1bc952f472'.replace(' ','')
n={'__file__':str(p)};exec(p.read_text().split('\nrows=[]')[0],n)
s=n['s'];old='high=summary(rv[6:].sum(axis=0))'
assert s.count(old)==1
s=s.replace(old,old+',near_high=summary(rv[6:].sum(axis=0)*(uz>=.9)),oblique_high=summary(rv[6:].sum(axis=0)*(uz<.9))')
t=n['t'];oldcut=t['oldcut'];cut=t['vcut'];exec(s,t);t['oldcut']=oldcut;t['vcut']=cut
bp=base/'casimir-dp-single-scatter-bound-2026-09-07.json'
assert hashlib.sha256(bp.read_bytes()).hexdigest()=='1352382c5385a70f694e74b3f9158e0cbaa2c33692dec1a3e6a6e5921c3d715e'
b=json.loads(bp.read_text());bound=next(r['exactly_one_low_to_exactly_one_high_ratio_lower'] for r in b['rows'] if r['column_g_cm2']==300 and r['incident_cosine_min']==.9)
previous=json.loads(p.with_suffix('.json').read_text())
rows=[]
for i,(bias,ebias) in enumerate([(.7,.5),(.65,.6)]):
 parts=[t['run'](500000,9510+2*i+j,t['a']*3.9,bias,ebias,physical) for j,physical in enumerate([True,False])]
 K=t['branch']['unattenuated_reference_count']*t['a']*3.9
 def pool(key,factor=1):
  return dict(mean=factor*sum(r[key]['mean'] for r in parts)/2,se=factor*math.hypot(*(r[key]['se'] for r in parts))/2)
 row=dict(bias=bias,energy_bias=ebias,normalization=pool('total'),raw_high=pool('high',K),near_high=pool('near_high',K),oblique_high=pool('oblique_high',K),parts=parts)
 assert math.isclose(row['raw_high']['mean'],previous['rows'][i]['raw_high']['mean'],rel_tol=1e-12)
 assert math.isclose(row['raw_high']['mean'],row['near_high']['mean']+row['oblique_high']['mean'],rel_tol=1e-12)
 row['near_fraction_point_estimate']=row['near_high']['mean']/row['raw_high']['mean']
 row['conditional_lower_bound_coefficient_estimate']=pool('near_high',K*bound)
 rows.append(row);print(json.dumps({k:v for k,v in row.items() if k!='parts'}),flush=True)
out=dict(status='conditional_bound_coefficient_estimate_not_statistical_lower_limit',rows=rows,
 bound_multiplier=bound,source_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest(),bp.name:hashlib.sha256(bp.read_bytes()).hexdigest()},
 checks=['source hashes','same-seed high-spectrum replay','disjoint angular partition'],
 limitations=['Monte Carlo estimate of a conditional analytic lower-bound coefficient, not a confidence lower bound',
 'same chosen silica source transport and uniform illumination','300 g/cm2 ideal xenon slab, not actual LZ geometry',
 'exactly one physical collision is not reconstructed selection','Born validity and other channels not resolved','no accepted counts or exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
