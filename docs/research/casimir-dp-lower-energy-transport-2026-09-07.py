"""Extend archived slab histories below the high-window capability cut."""
import hashlib,json
from pathlib import Path
import numpy as np

base=Path(__file__).parent
p=base/'casimir-dp-slab-transport-2026-09-07.py'
digest=hashlib.sha256(p.read_bytes()).hexdigest()
assert digest=='dcb25aeacd1d563858dfa057b5eb70185c1f92a79d49f00acb82a49bf7635113'
source=p.read_text().split('# Thin-slab')[0]
source=source[:source.index('    assert np.all(status!=0)')]+'''
    return status,v,uz,hits
'''
ns={'__file__':str(p.resolve())}
exec(compile(source,str(p),'exec'),ns)
oldcut=ns['vcut']
rows=[]
archive={}
for factor in [1.,3.9]:
    for threshold in [200.,5.4,1.]:
        ns['vcut']=oldcut*np.sqrt(threshold/200)
        for seed in [9101,9102]:
            status,v,cos,hits=ns['run'](20000,seed,ns['a']*factor)
            forward=status==1
            high=forward&(v>=oldcut)
            key=f"scale_{factor}_cut_{threshold}_seed_{seed}"
            archive[key+'_status']=status
            archive[key+'_speed']=v
            archive[key+'_cosine']=cos
            archive[key+'_hits']=hits
            rows.append(dict(scale_relative_strong_root=factor,seed=seed,N=len(v),
                stop_true_Xe_capability_keV=threshold,
                speed_cut_kms=ns['vcut']*299792.458,
                status_counts=np.bincount(status,minlength=4).tolist(),
                far_exit_count=int(forward.sum()),high_capable_far_exit_count=int(high.sum()),
                lower_speed_far_exit_count=int((forward&~high).sum()),
                maximum_collisions=int(hits.max())))
            print(json.dumps(rows[-1]),flush=True)
assert all(r['status_counts'][0]==0 for r in rows), 'Unresolved histories; do not silently classify them.'
archive_path=Path(__file__).with_suffix('.npz')
np.savez_compressed(archive_path,**archive)
out=dict(status='unbiased_lower_threshold_slab_pilot_not_detector_fold',source_sha256=digest,
    history_archive=archive_path.name,history_sha256=hashlib.sha256(archive_path.read_bytes()).hexdigest(),
    labels=['unresolved_at_1000_collisions','far_exit','entrance_exit','below_declared_capability'],
    rows=rows,limitations=['Same idealized stationary point-nucleus silica slab and Born cross sections',
      'Independent sequential random sampling after thresholds diverge; not paired trajectory replay',
      'Finite sample counts cannot resolve rare high-energy tails',
      'Even 1 keV stopping can omit reconstructed migration; no full response supplied',
      'No capture density, detector response, or physically admitted parameter point'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
