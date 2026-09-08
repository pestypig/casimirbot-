"""Deterministic two-component mixture importance sampling of slab histories."""
import hashlib,json,math,sys
from pathlib import Path
import numpy as np
base=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).parent
p=base/'casimir-dp-weighted-slab-2026-09-07.py'
expected='f76b4fb2ea33eeef0165adec20109014d99333c8dd6a43a2a55c3367cadade1d'
assert hashlib.sha256(p.read_bytes()).hexdigest()==expected
n={'__file__':str(p)};exec(p.read_text().split('rows=[]')[0],n)
s=n['s']
def change(old,new):
 global s
 assert s.count(old)==1,old
 s=s.replace(old,new)
change('bias=1.,ebias=1.):','bias=1.,ebias=1.,physical=False):')
change('rng=np.random.default_rng(seed)','rng=np.random.default_rng(seed)\n    samplebias=1. if physical else bias\n    sampleebias=1. if physical else ebias')
change('/(bias*total)','/(samplebias*total)')
change('E=bb*u*emax/(bb+emax*(1-u))','bs=b*sampleebias\n        E=bs*u*emax/(bs+emax*(1-u))')
change('weights=np.exp(logw)','weights=2*np.exp(-np.logaddexp(0.,-logw))\n    assert np.all((weights>=0)&(weights<=2))')
change('capable=summary(weights*forward),','capable=summary(weights*forward),below_old=summary(weights*forward*(v<oldcut)),above_old=summary(weights*forward*(v>=oldcut)),')
t={'__file__':str(p)};exec(s,t);t['oldcut']=t['vcut'];t['vcut']*=np.sqrt(5.4/200)
rows=[]
for k,(factor,bias,ebias,N) in enumerate([(1,1,1,100000),(3.9,.7,.5,500000),(3.9,.65,.6,500000)]):
 parts=[t['run'](N,9410+2*k+j,t['a']*factor,bias,ebias,physical) for j,physical in enumerate([True,False])]
 pooled={}
 for obs in ['total','capable','below_old','above_old','fast']:
  pooled[obs]=dict(mean=sum(r[obs]['mean'] for r in parts)/2,se=math.hypot(*(r[obs]['se'] for r in parts))/2)
 z=abs(pooled['total']['mean']-1)/pooled['total']['se'] if pooled['total']['se'] else 0
 assert z<6
 rows.append(dict(factor=factor,parts=parts,pooled=pooled,normalization_z=z))
 print(json.dumps(rows[-1]),flush=True)
out=dict(status='bounded_weight_mixture_control_not_validated_physical_model',source_sha256=expected,
 sampling='equal fixed allocations to physical P and biased Q; weight P/(0.5P+0.5Q)',
 weight_bound=2,lower_capability_keV=5.4,rows=rows,
 checks=['source hash','inherited kinematics and termination','weights bounded by two','pooled normalization within six sampling standard errors'],
 limitations=['normalization does not prove rare-exit convergence','component mean weights need not individually equal one','sampling errors exclude model uncertainty','no detector response or accepted counts','conditional stationary point-nucleus silica slab','lower-energy histories remain censored'])
(base/'casimir-dp-defensive-mixture-2026-09-07.json').write_text(json.dumps(out,indent=2)+'\n')
