"""Energy-updating xenon slab with Helm null-collision sampling."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.special import spherical_jn
base=Path(__file__).parent
p=base/'casimir-dp-slow-xenon-opacity-2026-09-07.py'
ctx={'__file__':str(p.resolve())};exec(p.read_text().split('rows=[]')[0],ctx)
ns=ctx['ns'];m=100.;med=ns['med']
A=np.array([a for a,M,f in ns['iso']]);M=np.array([ns['mass'](M) for a,M,f in ns['iso']]);f=np.array([f for a,M,f in ns['iso']]);mu=m*M/(m+M)
rn=np.sqrt((1.23*A**(1/3)-.60)**2+7*np.pi**2*.52**2/3-5*.9**2)
sig0=ns['sigma']*((ns['q0']**2+med**2)/med**2)**2
pref=ctx['number_column']*ctx['scale']*f*sig0*54**2*(mu/ns['muP'])**2
def run(speed,N,seed,column_scale=1):
    rng=np.random.default_rng(seed);v=np.full(N,speed/299792.458);z=np.zeros(N);uz=np.ones(N)
    state=np.zeros(N,int);deposit=np.zeros(N);hits=np.zeros(N,int);above=np.zeros(N,int);records=[]
    initial=.5*m*v*v*1e6
    for step in range(10000):
        ids=np.flatnonzero(state==0)
        if not len(ids):break
        rates=column_scale*pref[None,:]*med**2/(med**2+4*mu[None,:]**2*v[ids,None]**2)
        total=rates.sum(axis=1);travel=rng.exponential(size=len(ids))/total
        zz=z[ids]+uz[ids]*travel
        state[ids[zz>=1]]=1;state[ids[zz<=0]]=2
        inside=(zz>0)&(zz<1);j=ids[inside];z[j]=zz[inside]
        if not len(j):continue
        cum=np.cumsum(rates[inside],axis=1)/total[inside,None]
        typ=np.sum(rng.random(len(j))[:,None]>cum,axis=1)
        old=v[j]**2;emax=2*mu[typ]**2*old/M[typ];b=med**2/(2*M[typ]);u=rng.random(len(j))
        E=b*u*emax/(b+emax*(1-u));q=np.sqrt(2*M[typ]*E)
        x=q*rn[typ]/.1973269804
        F=np.where(x<1e-5,1-x*x/10,3*spherical_jn(1,x)/x)*np.exp(-.5*(q*.9/.1973269804)**2)
        accept=rng.random(len(j))<F*F
        j=j[accept];E=E[accept];typ=typ[accept];old=old[accept]
        if not len(j):continue
        new=old-2*E/m
        assert np.all(new>0)
        ct=(m*m*old-(m+M[typ])*E)/(m*m*np.sqrt(old*new))
        assert np.max(np.abs(ct))<1+1e-10
        ct=np.clip(ct,-1,1)
        uz[j]=uz[j]*ct+np.sqrt(np.maximum(0,1-uz[j]**2))*np.sqrt(np.maximum(0,1-ct**2))*np.cos(2*np.pi*rng.random(len(j)))
        v[j]=np.sqrt(new);hits[j]+=1;deposit[j]+=E*1e6;above[j]+=(E*1e6>=5.4)
        records.append(np.column_stack([j,z[j],E*1e6,A[typ]]))
        state[j[.5*m*new*1e6<.001]]=3
    residual=.5*m*v*v*1e6
    err=float(np.max(np.abs(deposit+residual-initial)))
    assert err<1e-8 and np.all(state!=0)
    result=dict(speed_kms=speed,N=N,seed=seed,column_scale=column_scale,status_counts=np.bincount(state,minlength=4).tolist(),
        zero_recoil_count=int(np.sum(hits==0)),mean_deposited_keV=float(deposit.mean()),
        above_5p4_counts=np.bincount(np.minimum(above,2),minlength=3).tolist(),energy_balance_max_error_keV=err)
    return result,dict(state=state,speed=v,cosine=uz,deposit=deposit,recoils=np.concatenate(records) if records else np.empty((0,4)))
rows=[];archive={}
for i,(speed,N,col) in enumerate([(776,20000,.1),(98.7743,5000,1),(150,5000,1),(250,5000,1),(776,5000,1)]):
    row,arr=run(speed,N,9500+i,col);rows.append(row)
    archive.update({f'run{i}_{k}':v for k,v in arr.items()});print(json.dumps(row),flush=True)
tau=json.loads((base/'casimir-dp-slow-xenon-opacity-2026-09-07.json').read_text())['rows'][-1]['Helm_tau']*.1
pzero=math.exp(-tau);r=rows[0]
assert abs(r['zero_recoil_count']/r['N']-pzero)<6*math.sqrt(pzero*(1-pzero)/r['N'])
arc=Path(__file__).with_suffix('.npz');np.savez_compressed(arc,**archive)
out=dict(status='conditional_energy_updating_Xe_slab',source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),rows=rows,
    archive=arc.name,archive_sha256=hashlib.sha256(arc.read_bytes()).hexdigest(),
    states=['active','far_exit','entrance_exit','kinetic_energy_below_0.001_keV'],
    recoil_columns=['history_id','normalized_depth','energy_keV','isotope_A'],
    limitations=['Normal incidence diagnostic slab, not LZ geometry','Fixed Born kernel, no strong-amplitude validation',
      'Energy floor is not a capture label','True recoil thresholds are not pulse selection','No coupled incident spectrum or accepted counts'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
