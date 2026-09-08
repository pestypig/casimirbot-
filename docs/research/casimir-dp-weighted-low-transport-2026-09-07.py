"""Weighted lower-energy outgoing flux; not a detector prediction."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-weighted-slab-2026-09-07.py'
digest=hashlib.sha256(p.read_bytes()).hexdigest()
assert digest=='f76b4fb2ea33eeef0165adec20109014d99333c8dd6a43a2a55c3367cadade1d'
ns={'__file__':str(p.resolve())}
exec(p.read_text().split('rows=[]')[0],ns)
t=ns['ns'];oldcut=t['vcut'];t['vcut']=oldcut*np.sqrt(1/200)
s=ns['s'];s=s[:s.index('    return dict(N=N')]+ '    return status,v,uz,hits,weights\n'
exec(s,t)
t['vcut']=oldcut*np.sqrt(1/200)
def summary(y):
    return dict(mean=float(y.mean()),se=float(y.std(ddof=1)/np.sqrt(len(y))),
        ess=float(y.sum()**2/(y@y)) if y@y else 0,
        max_share=float(y.max()/y.sum()) if y.sum() else 0)
rows=[];archive={}
for i,(scale,bias,ebias,N) in enumerate([(1,1,1,50000),(1,1,.8,50000),(3.9,.7,.5,100000),(3.9,.65,.6,100000)]):
    status,v,cos,hits,w=t['run'](N,9300+i,t['a']*scale,bias,ebias)
    far=status==1
    r=dict(scale=scale,bias=bias,energy_bias=ebias,N=N,seed=9300+i,
        far=summary(w*far),high=summary(w*far*(v>=oldcut)),
        low=summary(w*far*(v<oldcut)),total_weight=summary(w))
    for name,val in dict(status=status,speed=v,cosine=cos,hits=hits,weight=w).items():
        archive[f'run{i}_{name}']=val
    rows.append(r);print(json.dumps(r),flush=True)
for field in ['far','high','low']:
    assert abs(rows[0][field]['mean']-rows[1][field]['mean'])<6*math.hypot(rows[0][field]['se'],rows[1][field]['se'])
outpath=Path(__file__).with_suffix('.npz');np.savez_compressed(outpath,**archive)
out=dict(status='weighted_lower_energy_pilot',source_sha256=digest,
    stop_capability_keV=1,rows=rows,archive=outpath.name,
    archive_sha256=hashlib.sha256(outpath.read_bytes()).hexdigest(),
    limitations=['Finite sample errors may miss rare weights','No detector or cross-section folding',
      'Idealized slab and Born model','No captured density','Below-1-keV response not supplied'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
