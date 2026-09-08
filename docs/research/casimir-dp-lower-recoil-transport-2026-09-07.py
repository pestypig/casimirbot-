"""Lower-recoil transport extension; sampling diagnostics, no detector response."""
import hashlib,json
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-weighted-slab-2026-09-07.py'
expected='f76b4fb2ea33eeef0165adec20109014d99333c8dd6a43a2a55c3367cadade1d'
assert hashlib.sha256(p.read_bytes()).hexdigest()==expected
n={'__file__':str(p.resolve())};exec(p.read_text().split('rows=[]')[0],n)
s=n['s'];old='capable=summary(weights*forward),'
assert s.count(old)==1
s=s.replace(old,old+'below_old=summary(weights*forward*(v<oldcut)),above_old=summary(weights*forward*(v>=oldcut)),')
t={'__file__':str(p.resolve())};exec(s,t)
t['oldcut']=t['vcut'];t['vcut']*=np.sqrt(5.4/200)
rows=[]
for factor,bias,ebias,N,seed in [(1,1,1,100000,9310),(3.9,.7,.5,500000,9311),(3.9,.65,.6,500000,9312)]:
 r=t['run'](N,seed,t['a']*factor,bias,ebias)
 r['factor_relative_to_strong_root']=factor
 assert np.isclose(r['capable']['mean'],r['below_old']['mean']+r['above_old']['mean'],rtol=1e-12,atol=0)
 rows.append(r);print(json.dumps(r),flush=True)
out=dict(status='exploratory_lower_energy_transport_not_response_fold',input_sha256=expected,
 lower_true_recoil_capability_keV=5.4,speed_cut_kms=t['vcut']*299792.458,
 old_speed_cut_kms=t['oldcut']*299792.458,rows=rows,
 checks=['source hash','inherited exact collision kinematics and termination','disjoint exit partition'],
 limitations=['5.4 keV is a diagnostic stopping choice, not a hard acceptance threshold',
 'histories below this capability remain censored, not captured',
 'finite-sample errors and ESS do not bound unseen weight tails',
 'chosen silica column and stationary point-nucleus Born model, not actual site transport',
 'no detector response, accepted counts, exclusion or shared measurable prediction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
