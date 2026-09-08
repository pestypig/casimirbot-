"""Conditional leading-density component, not a complete virtual model rate."""
from pathlib import Path
import json,hashlib
base=Path(__file__).resolve().parent
names=['casimir-dp-electron-scalar-twist-fit-2026-09-07.json','casimir-dp-electron-unit-contact-2026-09-07.json','casimir-dp-electron-box-ward-2026-09-07.json']
raw=[(base/n).read_bytes() for n in names];fit,response,ward=map(json.loads,raw)
c=fit['rows'][0];m=.00051099895
W=2*m*(c['c0_conditional_GeV_minus3']+.75*c['c2_conditional_GeV_minus3'])
assert abs(W/ward['conditional_W_magnitude_GeV_minus2']-1)<1e-10
rows=[dict(response=r['response'],D_leading_density_covered=r['unit_contact_D']*W*W,inherited_grid_refinement_relative=r['refinement_relative']) for r in response['rows']]
out=dict(status='conditional_leading_NR_density_component_not_full_model_prediction',source_sha256={n:hashlib.sha256(b).hexdigest() for n,b in zip(names,raw)},W_density_GeV_minus2=W,rows=rows,
coverage=dict(energy_eV=[5.5,50],momentum_max_keV=30.614),
limitations=['leading nonrelativistic density term only','complete Majorana and nonforward matching unresolved','no kinetic/stress or spin response included','no subgap surface or multi-constituent contribution','not measured sensitivity or exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
