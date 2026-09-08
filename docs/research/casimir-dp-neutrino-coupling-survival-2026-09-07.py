"""Shared production/decay coupling scaling and conditional global envelope."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from numpy.polynomial.legendre import leggauss
from scipy.optimize import minimize_scalar
base=Path(__file__).parent
parent=base/'casimir-dp-neutrino-highflux-survival-2026-09-07.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='d8bc97433ba2f9c3e00b42516ba94f143c49ed817f83add86f385fb4f296f4e6'
a={'__file__':str(parent)}
exec(compile(parent.read_text().split('\noverlap=[]')[0],str(parent),'exec'),a)
j=a['j'];joint=j['a'];p=j['p'];hc=j['hc']
source=base/'casimir-dp-neutrino-joint-2026-09-07.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='304d14b518c27317c4d75b058e6996f7532a73091e15a066a2c94dc59473d747'
local=json.loads(source.read_text())['rows']

def nodes(m,med,width,domain,n=64,nE=128):
    low,high,flog=(.01,1e4,a['dunelog']) if domain=='DUNE_below_10TeV' else (1e4,1e8,a['highlog'])
    tx,tw=leggauss(n);ex,ew=leggauss(nE)
    weights=[];decay_per_m=[]
    for A,atomic,f in p['iso']:
        M=atomic*.93149410242-54*.00051099895
        for Tk,wT in zip((202+269.9)/2+(269.9-202)/2*tx,tw):
            T=Tk*1e-6;lo=max(low,joint['emin'](T,M,m))
            if lo>=high:continue
            le=(math.log(lo)+math.log(high))/2+(math.log(high)-math.log(lo))/2*ex;E=np.exp(le)
            W=ew*(math.log(high)-math.log(lo))/2*np.exp(flog(le)-le)
            W*=f*wT*joint['coefficient'](T,M,m,A,54,med)*(269.9-202)/2*1e-6*p['xe_atoms']*p['year']
            weights.extend(W);decay_per_m.extend(width/(hc*np.sqrt((E-T)**2-m*m)/m))
    return np.array(weights),np.array(decay_per_m)

def solve(W,b,path):
    # x = (ychi*yq / reference_product)^2. Both production and slice width scale x.
    def rate(logx):
        x=math.exp(logx);return float(np.sum(W*x*np.exp(-path*b*x)))
    grid=np.linspace(-35,25,181);v=np.array([rate(t) for t in grid])
    peaks=[i for i in range(1,len(v)-1) if v[i]>=v[i-1] and v[i]>=v[i+1] and v[i]>0]
    fits=[minimize_scalar(lambda t:-rate(t),bounds=(grid[i-1],grid[i+1]),method='bounded') for i in peaks]
    best=min(fits,key=lambda r:r.fun)
    x=math.exp(best.x)
    bound=float(np.sum(W/(math.e*path*b)))
    return dict(best_located_x=x,best_located_count=-float(best.fun),pointwise_global_envelope=bound,
                r_GeV_inverse=.02*x**.25,grid_boundary_max=float(max(v[0],v[-1])))

rows=[];checks=[]
for r in j['decays']:
    m=r['mchi_GeV'];med=r['mediator_GeV'];width=r['width_GeV']['mean']
    for domain in ['DUNE_below_10TeV','NuFlux_above_10TeV_off_horizon_unattenuated']:
        W,b=nodes(m,med,width,domain)
        result=solve(W,b,.01)
        W2,b2=nodes(m,med,width,domain,n=96,nE=256)
        refined=solve(W2,b2,.01)
        result['quadrature_relative']=abs(refined['best_located_count']/result['best_located_count']-1)
        twice=solve(W,b,.02)
        checks.append(math.isclose(twice['best_located_count']*2,result['best_located_count'],rel_tol=1e-7))
        result.update(mchi_GeV=m,mediator_GeV=med,domain=domain,path_m=.01,
                      equal_yukawa=.02*med*result['best_located_x']**.25)
        if domain=='DUNE_below_10TeV':
            d=next(v['D_independent_carbon_upper'] for v in local if v['mchi_GeV']==m and v['mediator_GeV']==med)
            result['same_x_local_D_independent_carbon_upper']=d*result['best_located_x']
        rows.append(result)
tests={'path_scaling':all(checks),'envelope_above_located_maximum':all(r['best_located_count']<=r['pointwise_global_envelope'] for r in rows),
       'interior_optimum':all(r['grid_boundary_max']<r['best_located_count']*1e-4 for r in rows),
       'quadrature_refinement':all(r['quadrature_relative']<1e-4 for r in rows)}
assert all(tests.values()),tests
out=dict(scope='Conditional fixed-path coupling optimization with width and production scaling together; separate flux domains, no detector acceptance or full theory uncertainty',
         full_model_admitted=False,checks=tests,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
