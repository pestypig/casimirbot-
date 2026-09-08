"""Likelihood-weighted transport; explicit tail-quality diagnostics."""
import json,hashlib,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-slab-transport-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='dcb25aeacd1d563858dfa057b5eb70185c1f92a79d49f00acb82a49bf7635113'
s=p.read_text().split('# Thin-slab')[0]
s=s[:s.index('    return dict(seed=seed')]+'''    weights=np.exp(logw)
    def summary(y):
        return dict(mean=float(y.mean()),se=float(y.std(ddof=1)/np.sqrt(N)),
          ess=float(y.sum()**2/(y@y)) if y@y else 0,
          max_share=float(y.max()/y.sum()) if y.sum() else 0)
    return dict(N=N,seed=seed,bias=bias,energy_bias=ebias,scale=scale,
      capable=summary(weights*forward),fast=summary(weights*fast),total=summary(weights))
'''
def replace_once(old,new):
    global s
    assert s.count(old)==1
    s=s.replace(old,new)
replace_once('def run(N,seed,scale):','def run(N,seed,scale,bias=1.,ebias=1.):')
replace_once('status=np.zeros(N,int);hits=np.zeros(N,int)',
             'status=np.zeros(N,int);hits=np.zeros(N,int);logw=np.zeros(N)')
replace_once('travel=rng.exponential(size=len(ids))/total',
    'travel=rng.exponential(size=len(ids))/(bias*total)\n        boundary=np.where(uz[ids]>0,(1-z[ids])/uz[ids],-z[ids]/uz[ids])\n        logw[ids]-=(1-bias)*total*np.minimum(travel,boundary)')
replace_once('if not len(j):continue','if not len(j):continue\n        logw[j]-=np.log(bias)')
replace_once('E=b*u*emax/(b+emax*(1-u))',
    'bb=b*ebias\n        E=bb*u*emax/(bb+emax*(1-u))\n        logw[j]+=np.log(b*(b+emax)/(bb*(bb+emax)))+2*np.log((E+bb)/(E+b))')
ns={'__file__':str(p.resolve())};exec(s,ns)
rows=[]
specs=[(1,1,1,100000,1410),(1,1,.7,100000,2110),
       (3,.85,.5,500000,3101),(3,.75,.6,500000,3102),
       (4,.7,.5,500000,4101),(4,.75,.5,500000,4102)]
for factor,bias,ebias,N,seed in specs:
    r=ns['run'](N,seed,ns['a']*factor,bias,ebias)
    r['relative_to_strong_root']=factor
    K=ns['branch']['unattenuated_reference_count']*ns['a']*factor*ns['window_fraction']
    r['raw_subset_coefficient_estimate']=K*r['fast']['mean']
    r['raw_subset_coefficient_sampling_se']=K*r['fast']['se']
    rows.append(r)
    print(json.dumps(r),flush=True)
for obs in ['capable','fast']:
    assert abs(rows[0][obs]['mean']-rows[1][obs]['mean'])<6*math.hypot(rows[0][obs]['se'],rows[1][obs]['se'])
# Exact no-collision likelihood identity, independent of sampled rare exits.
for tau in [1.,21.,84.]:
    for bias in [.5,.85,1.]:
        assert math.isclose(math.exp(-bias*tau)*math.exp(-(1-bias)*tau),math.exp(-tau),rel_tol=1e-12)
out=dict(status='weighted_method_control_checked_tail_quality_reported_not_joint_model',
 transport_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),rows=rows,
 checks=['resolved-region control agreement','analytic no-collision likelihood identity','inherited collision kinematics and termination'],
 limitations=['finite-sample standard errors can miss unobserved large weights','ESS is diagnostic not accuracy proof',
 'raw subset coefficient not accepted count or full-rate upper bound','same conditional slab/Born model','no capture solution'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
