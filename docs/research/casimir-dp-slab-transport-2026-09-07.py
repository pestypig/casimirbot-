"""Elastic high-window transport in the previously defined point-nucleus slab."""
import json,hashlib,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-coupled-attenuation-branches-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='16e728335769bbfa142a873a44d585de38118fb5a686705517d8866246d7e9f1'
branch=json.loads(p.read_text());a=branch['rows'][1]['cross_section_multiplier']
source=base/'casimir-dp-darkelf-xenon-match-2026-09-07.py'
# Definitions only; no execution of the prior script's output driver.
ns={'__file__':str(source)}
exec(source.read_text().split('# Analytic integrated')[0],ns)
window_fraction=ns['coefficient'](200,220)/ns['coefficient'](200,269.9)
m=100.;med=.01;vi=776/299792.458
ma=np.array([28,16])*.93149410242;mu=m*ma/(m+ma)
s=json.loads((base/'casimir-dp-silica-attenuation-2026-09-07.json').read_text())
tau_species=np.array([r['optical_depth'] for r in s['rows']])
xe=np.array([ns['mass'](mass) for _,mass,_ in ns['iso']])
vcut=float(np.min(np.sqrt(200e-6*xe/(2*(m*xe/(m+xe))**2))))
assert np.min(2*(m*xe/(m+xe))**2*(650/299792.458)**2/xe*1e6)>220

def run(N,seed,scale):
    rng=np.random.default_rng(seed)
    z=np.zeros(N);uz=np.ones(N);v=np.full(N,vi)
    status=np.zeros(N,int);hits=np.zeros(N,int)
    for step in range(1000):
        ids=np.flatnonzero(status==0)
        if len(ids)==0:break
        rates=scale*tau_species[None,:]*(med**2+4*mu[None,:]**2*vi**2)/(med**2+4*mu[None,:]**2*v[ids,None]**2)
        total=rates.sum(axis=1)
        travel=rng.exponential(size=len(ids))/total
        zn=z[ids]+uz[ids]*travel
        forward=zn>=1;back=zn<=0
        status[ids[forward]]=1;status[ids[back]]=2
        inside=~(forward|back);j=ids[inside];z[j]=zn[inside]
        if not len(j):continue
        typ=(rng.random(len(j))>rates[inside,0]/total[inside]).astype(int)
        M=ma[typ];U=mu[typ];old=v[j]**2
        emax=2*U**2*old/M;b=med**2/(2*M);u=rng.random(len(j))
        E=b*u*emax/(b+emax*(1-u))
        new=old-2*E/m
        assert np.all(new>0) and np.all(E<=emax)
        ct=(m*m*old-(m+M)*E)/(m*m*np.sqrt(old*new))
        assert np.max(np.abs(ct))<1+1e-12
        ct=np.clip(ct,-1,1)
        uz[j]=uz[j]*ct+np.sqrt(np.maximum(0,1-uz[j]**2))*np.sqrt(np.maximum(0,1-ct**2))*np.cos(2*np.pi*rng.random(len(j)))
        v[j]=np.sqrt(new);hits[j]+=1
        status[j[v[j]<vcut]]=3
    assert np.all(status!=0)
    forward=status==1;fast=forward&(v*299792.458>=650)
    frac=float(np.mean(forward));f650=float(np.mean(fast))
    return dict(seed=seed,N=N,cross_section_scale=scale,status_counts=np.bincount(status,minlength=4).tolist(),
        forward_capable_fraction=frac,forward_capable_standard_error=math.sqrt(frac*(1-frac)/N),
        forward_above_650_fraction=f650,forward_above_650_standard_error=math.sqrt(f650*(1-f650)/N),
        forward_speed_quantiles_kms=np.quantile(v[forward]*299792.458,[0,.1,.5,.9,1]).tolist(),
        forward_cosine_quantiles=np.quantile(uz[forward],[0,.1,.5,.9,1]).tolist(),
        forward_collision_quantiles=np.quantile(hits[forward],[0,.1,.5,.9,1]).tolist(),
        forward_speed_histogram_counts=np.histogram(v[forward]*299792.458,bins=np.arange(600,781,10))[0].tolist(),
        forward_speed_histogram_edges_kms=np.arange(600,781,10).tolist(),
        uncollided_count=int(np.sum(hits==0)),
        subset_raw_200_220_count_lower_estimate=branch['unattenuated_reference_count']*scale*f650*window_fraction)

# Thin-slab uncollided probability validates path-length sampling independently.
control=run(100000,111,1.)
p0=math.exp(-sum(tau_species));err=math.sqrt(p0*(1-p0)/control['N'])
assert abs(control['uncollided_count']/control['N']-p0)<6*err
rows=[run(30000,seed,a) for seed in [20260907,20260908]]
delta=abs(rows[0]['forward_capable_fraction']-rows[1]['forward_capable_fraction'])
assert delta<6*math.hypot(*[r['forward_capable_standard_error'] for r in rows])
out=dict(status='conditional_repeated_collision_transport_above_recoil_cut',
    branch_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),matching_script_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    terminal_status_labels=['unresolved','far_exit_capable','entrance_exit','below_200keV_Xe_capability'],
    speed_cut_kms=vcut*299792.458,raw_initial_200_220_to_200_269p9_ratio=window_fraction,
    thin_slab_control=control,rows=rows,
    limitations=['chosen infinite silica slab','normal uniform incident flux','stationary point nuclei and Born law',
    'stops at loss of high-window capability, not at capture','no electrons/inelastic material response',
    'no real detector acceptance','Monte Carlo errors exclude model uncertainties'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
