"""Validity screen for electron-loop low-energy radiative estimates."""
import hashlib,json
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-exothermic-common-rate-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
d=json.loads(p.read_text());me=.00051099895;E=.000248;xe=131.293*.93149410242
rows=[]
for r in d['rows']:
    gap=abs(r['delta_GeV'])
    rows.append(dict(mchi_GeV=r['mchi_GeV'],gap_over_me=gap/me,gap_squared_over_pair_threshold_squared=(gap/(2*me))**2,pair_closed=gap<2*me,gap_at_most_me=gap<=me))
crossing=E*xe/(me-E)
assert abs(E*(1+xe/crossing)/me-1)<1e-14
out=dict(scope='Kinematic applicability only; no radiative lifetime or error bound assigned.',rows=rows,mass_for_gap_equal_me_GeV=crossing,infinite_mass_gap_over_me=E/me,source='https://arxiv.org/pdf/2105.05255 AppendixB EqB4',checks=dict(crossover_substitution=True),survival_established=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
