"""Couple weighted rock exits to xenon collisions in the planar benchmark."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-xenon-recoil-transport-2026-09-07.py'
s=p.read_text().split('\nrows=[];archive={}')[0]
assert s.count('uz=np.ones(N)')==1
s=s.replace('uz=np.ones(N)','uz=entry_cos.copy()')
t={'__file__':str(p.resolve())};exec(s,t)
receipt=json.loads((base/'casimir-dp-weighted-low-transport-2026-09-07.json').read_text())
arc=base/receipt['archive'];assert hashlib.sha256(arc.read_bytes()).hexdigest()==receipt['archive_sha256']
data=np.load(arc,allow_pickle=False)
ns=t['ns'];column=t['ctx']['column'];area_year=2840*1000/column*ns['year']
crossings=.003*776e5*area_year
# Independent zero-attenuation, first-order high-band normalization identity.
sigma_high=ns['coefficient'](200,269.9)/(ns['targets']*ns['year']*ns['speed_cm'])
lhs=crossings*t['ctx']['number_column']*sigma_high*t['ctx']['scale']
rhs=t['ctx']['b']['unattenuated_reference_count']*t['ctx']['scale']
assert math.isclose(lhs,rhs,rel_tol=1e-12)
def summarize(y):
    return dict(mean=float(y.mean()),se=float(y.std(ddof=1)/np.sqrt(len(y))) if np.any(y) else None,
        sampling_status='nonzero_sample' if np.any(y) else 'no_sampled_event_not_zero_rate',
        ess=float(y.sum()**2/(y@y)) if y@y else 0,
        max_share=float(y.max()/y.sum()) if y.sum() else 0)
rows=[];saved={}
for i in [2,3]:
    mask=data[f'run{i}_status']==1
    speeds=data[f'run{i}_speed'][mask]*299792.458
    weights=data[f'run{i}_weight'][mask]
    t['entry_cos']=data[f'run{i}_cosine'][mask]
    assert np.all(t['entry_cos']>0)
    result,arrays=t['run'](speeds,len(speeds),9700+i)
    recoils=arrays['recoils'];ids=recoils[:,0].astype(int);E=recoils[:,2]
    nlow=np.bincount(ids[(E>=5.4)&(E<200)],minlength=len(speeds))
    nhigh=np.bincount(ids[(E>=200)&(E<=269.9)],minlength=len(speeds))
    nallabove=np.bincount(ids[E>=5.4],minlength=len(speeds))
    outputs={}
    for name,val in dict(at_least_one_5p4_200=nlow>0,exactly_one_above_5p4=nallabove==1,
                         at_least_one_200_269p9=nhigh>0).items():
        per_initial=np.zeros(receipt['rows'][i]['N'])
        per_initial[mask]=weights*val*crossings
        outputs[name]=summarize(per_initial)
    row=dict(rock_run=i,xe_seed=9700+i,simulated_Xe_entries=len(speeds),
        outputs=outputs,energy_balance_max_error_keV=result['energy_balance_max_error_keV'])
    rows.append(row);print(json.dumps(row),flush=True)
    saved.update({f'run{i}_{k}':v for k,v in arrays.items()})
    saved[f'run{i}_weights']=weights;saved[f'run{i}_rock_ids']=np.flatnonzero(mask)
outarc=Path(__file__).with_suffix('.npz');np.savez_compressed(outarc,**saved)
out=dict(status='coupled_planar_true_recoil_pilot_not_LZ_selection',rows=rows,
    source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),rock_archive_sha256=receipt['archive_sha256'],
    incident_crossings_for_exposure=crossings,normalization_relative_error=abs(lhs/rhs-1),
    archive=outarc.name,archive_sha256=hashlib.sha256(outarc.read_bytes()).hexdigest(),
    limitations=['Recoil threshold predicates are not detected-event selection','Rare high recoils may be unsampled',
      'One Xe realization per importance-weighted entry; empirical errors do not guarantee tail coverage',
      'Uniform infinite slab geometry and Born kernel','Missing pulse reconstruction and captured population'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
