"""Full high-window raw spectrum folded with weighted outgoing slab flux."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import cumulative_trapezoid
base=Path(__file__).parent
p=base/'casimir-dp-weighted-slab-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='f76b4fb2ea33eeef0165adec20109014d99333c8dd6a43a2a55c3367cadade1d'
ns={'__file__':str(p.resolve())}
exec(p.read_text().split('rows=[]')[0],ns)
t=ns['ns'];xe=t['ns'];initial_v=xe['v']
bins=[(200,220),(220,240),(240,260),(260,269.9)]
energies=np.linspace(200,269.9,8001)
tables=[]
for A,M,f in xe['iso']:
    ma=xe['mass'](M)
    ys=np.array([xe['ds'](E,A,ma) for E in energies])
    tables.append((ma,f,cumulative_trapezoid(ys,energies,initial=0)))
norm=sum(f*c[-1] for _,f,c in tables)
def response(v,cos):
    result=[]
    for lo,hi in bins:
        val=np.zeros(len(v))
        for ma,f,c in tables:
            mu=100*ma/(100+ma)
            emax=2*mu*mu*v*v/ma*1e6
            upper=np.maximum(lo,np.minimum(hi,emax))
            val+=f*(np.interp(upper,energies,c)-np.interp(lo,energies,c))
        result.append(val/norm*(initial_v/v)**2/cos)
    return np.array(result)
# Independent direct recoil quadrature checks the cumulative interpolation.
reference=xe['coefficient'](200,269.9)
checks=[]
for speed in [602,630,650,700,776]:
    vv=speed/299792.458
    xe['v']=vv
    direct=np.array([xe['coefficient'](lo,hi)/reference for lo,hi in bins])
    tabulated=response(np.array([vv]),np.ones(1))[:,0]
    err=float(np.max(np.abs(direct-tabulated)))
    assert err<1e-6
    checks.append(dict(speed_kms=speed,max_absolute_normalized_error=err))
xe['v']=initial_v
t['response']=response
old='    return dict(N=N,seed=seed,bias=bias,energy_bias=ebias,scale=scale,'
assert ns['s'].count(old)==1
modified=ns['s'].replace(old,
    '    rv=np.zeros((4,N));rv[:,forward]=response(v[forward],uz[forward])*weights[forward]\n    return dict(folded=summary(rv.sum(axis=0)),bins=[summary(y) for y in rv],N=N,seed=seed,bias=bias,energy_bias=ebias,scale=scale,')
exec(modified,t)
rows=[]
for factor in [3.8,3.9,4.0]:
    for index,(bias,ebias) in enumerate([(.7,.5),(.65,.6)]):
        seed=7000+int(factor*100)+index
        r=t['run'](500000,seed,t['a']*factor,bias,ebias)
        K=t['branch']['unattenuated_reference_count']*t['a']*factor
        r['relative_to_old_strong_root']=factor
        r['raw_high_count']=K*r['folded']['mean']
        r['raw_high_sampling_se']=K*r['folded']['se']
        r['raw_bin_counts']=[K*q['mean'] for q in r['bins']]
        r['raw_bin_sampling_se']=[K*q['se'] for q in r['bins']]
        assert math.isclose(sum(r['raw_bin_counts']),r['raw_high_count'],rel_tol=1e-12)
        rows.append(r)
        print(json.dumps({k:r[k] for k in ['relative_to_old_strong_root','bias','raw_high_count','raw_high_sampling_se','raw_bin_counts','folded']}),flush=True)
out=dict(status='conditional_raw_high_window_spectrum_not_detector_likelihood',
    weighted_source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bins_keV=bins,
    interpolation_checks=checks,rows=rows,
    estimator='C*a*mean_proposal[W*far_exit*sigma_bin(v)/(sigma_high(v_initial)*cos_exit)]',
    limitations=['infinite uniform slab and incident illumination','thin-target rate convention',
    'no accepted-event or measurement-response convolution','no low-recoil spectrum below 200 keV',
    'empirical weighted errors may underestimate rare-weight tails','no capture solution or allowed point'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
