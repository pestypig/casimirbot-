"""Instrument flight times without changing archived collision sampling."""
import hashlib,json
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-xenon-recoil-transport-2026-09-07.py'
s=p.read_text().split('\nrows=[];archive={}')[0]
def replace(old,new):
    global s
    assert s.count(old)==1
    s=s.replace(old,new)
replace('state=np.zeros(N,int);deposit=', 'clock=np.zeros(N);state=np.zeros(N,int);deposit=')
replace('        zz=z[ids]+uz[ids]*travel',
        '        boundary=np.where(uz[ids]>0,(1-z[ids])/uz[ids],-z[ids]/uz[ids])\n        clock[ids]+=np.minimum(travel,boundary)/v[ids]\n        zz=z[ids]+uz[ids]*travel')
replace('np.column_stack([j,z[j],E*1e6,A[typ]])','np.column_stack([j,z[j],E*1e6,A[typ],clock[j]])')
replace('np.empty((0,4))','np.empty((0,5))')
t={'__file__':str(p.resolve())};exec(s,t)
receipt=json.loads(p.with_suffix('.json').read_text())
arc=base/receipt['archive'];assert hashlib.sha256(arc.read_bytes()).hexdigest()==receipt['archive_sha256']
old=np.load(arc,allow_pickle=False);saved={};checks=[]
for i,r in enumerate(receipt['rows']):
    result,arrays=t['run'](r['speed_kms'],r['N'],r['seed'],r['column_scale'])
    for key,arr in arrays.items():
        previous=old[f'run{i}_{key}']
        assert np.array_equal(arr[:,:4] if key=='recoils' else arr,previous),key
        saved[f'run{i}_{key}']=arr
    rec=arrays['recoils']
    assert np.all(rec[:,4]>=0)
    order=np.lexsort((rec[:,4],rec[:,0]))
    # Recoil records are generated in advancing simulation steps; verify per-history monotonicity.
    ids=rec[:,0].astype(int)
    for history in np.unique(ids):
        assert np.all(np.diff(rec[ids==history,4])>=0)
    checks.append(dict(run=i,exact_collision_replay=True,recoils=len(rec)))
outarc=Path(__file__).with_suffix('.npz');np.savez_compressed(outarc,**saved)
out=dict(status='exact_replay_with_dimensionless_collision_times',checks=checks,
    source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),input_archive_sha256=receipt['archive_sha256'],
    archive=outarc.name,archive_sha256=hashlib.sha256(outarc.read_bytes()).hexdigest(),
    recoil_columns=['history_id','normalized_depth','energy_keV','isotope_A','flight_time_c_over_slab_thickness'],
    conversion='physical flight time = final column * slab thickness in cm / 29979245800',
    limitations=['No physical slab thickness or liquid density authenticated','No light propagation or electron drift added',
      'No pulse widths, areas or selection response','Same conditional collision kernel and energy floor'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(checks))
