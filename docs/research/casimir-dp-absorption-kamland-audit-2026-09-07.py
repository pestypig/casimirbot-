"""Provenance arithmetic and conditional scale transfer; not a KamLAND fit."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent
parent=base/'casimir-dp-absorption-rate-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='fd01b7b9572763638de0ee62f7f5d17ca42b8af1a092aa41ef5605f4354c367a'
prior=json.loads(parent.read_text())
n=[4,2,2,2,2,1,1,1]
b=[3.9,3.1,2.9,2.2,2.1,2.,1.9,1.9]
factor=(11.5/80)**4
rows=[dict(form=r['form_prescription'],conditional_Xe_raw=r['Xe_raw_all_lines_2p84ty']*factor,conditional_local_D_le_2N=r['local_independent_encounter_D_le_2N']*factor) for r in prior['rows']]
checks=dict(recast_total=sum(n)==15,background_total=math.isclose(sum(b),20),inverse_fourth_power=math.isclose(factor*(80/11.5)**4,1),efficiency_rounding=abs(.8*.73-.58)<.005)
assert all(checks.values())
out=dict(scope='Audit arithmetic only. 80 TeV is a reported preliminary bound at 247.5 MeV; transfer to the prior 247 MeV benchmark is illustrative, not an interpolated or reproduced limit.',checks=checks,raw_KamLAND_candidates=18,recast_residual_total=sum(n),recast_background_total=sum(b),independent_25pct_total_sd=math.sqrt(sum((.25*x)**2 for x in b)),fully_correlated_25pct_total_sd=.25*sum(b),rate_factor=factor,inverse_rate_factor=1/factor,rows=rows,independent_exclusion=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
