"""Conditional rigid sum of previously bounded nuclear effective amplitudes."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent; root=base.parents[1]
p=root/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(p.read_text()); d=c['leading_design']
source=base/'casimir-dp-exothermic-companion-bound-2026-09-07.json'
x=json.loads(source.read_text())
m=45.; M=12*.93149410242; mu=m*M/(m+M)
N=d['mass_kg']/(12*1.66053906892e-27)
Ms=d['mass_kg']/1.7826619216278976e-27; mus=m*Ms/(m+Ms)
factor=N*(mus/mu)**2
rows=[]
for row in x['rows']:
    f=row['excited_fraction']; W=row['W_upper_GeV_minus2']
    sigma=mus**2*(N*W)**2/math.pi*.3893793721e-27
    direct=2*(1-f)*.3/m*798e5*d['hold_time_s']*sigma
    scaled=row['D_independent_carbon_upper']*factor
    assert abs(direct/scaled-1)<1e-12
    rows.append(dict(excited_fraction=f,D_rigid_additive_ceiling=direct,
                     ratio_to_DP_forecast=direct/c['frozen_diosi']['gaussian_exponent_at_hold']))
out=dict(status='conditional_additive_effective_amplitude_envelope',
    source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    enhancement_over_independent_ceiling=factor,rows=rows,
    assumptions=['Transfer the bounded single-nucleus effective amplitude unchanged into a rigid sum',
      'Use |sum exp(i q r_j)| <= N at every transfer and D <= 2 events',
      'Not a microscopic solid matching or bound on cross-nucleus virtual vertices; no full-model exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
