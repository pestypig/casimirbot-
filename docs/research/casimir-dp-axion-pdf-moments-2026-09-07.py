"""Native-Q CT14lo moment extraction; interpolation comparison, no extrapolation."""
import hashlib,json
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator,CubicSpline
from numpy.polynomial.legendre import leggauss
base=Path(__file__).parent/'casimir-dp-axion-pdf-intake-2026-09-07'
raw=(base/'CT14lo_0000.dat').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='1358d9c6da6d720006adc6d1d75371446978b56a0fa635868014b6fb1b4dbffe'
info=(base/'CT14lo.info').read_bytes()
assert hashlib.sha256(info).hexdigest()=='f8158114ae9527dd086326c72049f889e0e6d65142cce4249c257a8c0068777c'
blocks=[z.strip().splitlines() for z in raw.decode().split('---')[1:] if z.strip()]
assert len(blocks)==1,'Only inspected single-subgrid layout supported'
b=blocks[0];x=np.fromstring(b[0],sep=' ');Q=np.fromstring(b[1],sep=' ');fl=[int(z) for z in b[2].split()]
v=np.array([np.fromstring(line,sep=' ') for line in b[3:]])
assert v.shape==(len(x)*len(Q),len(fl))
v=v.reshape(len(x),len(Q),len(fl));lx=np.log(x)

def integrate(values,kind='pchip',order=16):
    interp=(PchipInterpolator if kind=='pchip' else CubicSpline)(lx,values,axis=0,extrapolate=False)
    z,w=leggauss(order);mid=(lx[1:]+lx[:-1])/2;half=np.diff(lx)/2
    t=mid[:,None]+half[:,None]*z
    fv=interp(t);weights=half[:,None]*w
    moments=np.sum(fv*np.exp(t)[...,None]*weights[...,None],axis=(0,1))
    valence=np.sum(fv*weights[...,None],axis=(0,1))
    first_decade=np.sum(fv*np.exp(t)[...,None]*weights[...,None]*(np.exp(t)<1e-8)[...,None],axis=(0,1))
    return moments,valence,first_decade
rows=[];refine=[];diff=[]
for j,q in enumerate(Q):
    m,val,tail=integrate(v[:,j,:]);m2,_,_=integrate(v[:,j,:],order=32);mc,_,_=integrate(v[:,j,:],'cubic')
    refine.append(max(abs(m-m2)));diff.append(max(abs(m-mc)))
    moment={str(k):float(z) for k,z in zip(fl,m)}
    rows.append(dict(Q_GeV=float(q),momentum_sum=float(sum(m)),up_valence=float(val[fl.index(2)]-val[fl.index(-2)]),down_valence=float(val[fl.index(1)]-val[fl.index(-1)]),up_plus=float(m[fl.index(2)]+m[fl.index(-2)]),down_plus=float(m[fl.index(1)]+m[fl.index(-1)]),bottom_plus=float(m[fl.index(5)]+m[fl.index(-5)]),gluon=float(m[-1]),first_tabulated_decade_total_momentum=float(sum(tail)),max_interpolator_absolute_moment_difference=float(max(abs(m-mc))),flavor_moments=moment))
checks={'shape_and_order':v.shape==(len(x),len(Q),len(fl)),
        'quadrature_refinement':max(refine)<1e-12,
        'momentum_sum_close':max(abs(r['momentum_sum']-1) for r in rows)<.002,
        'valence_sums_close':max(max(abs(r['up_valence']-2),abs(r['down_valence']-1)) for r in rows)<.005}
checks={k:bool(z) for k,z in checks.items()};assert all(checks.values()),checks
out=dict(scope='Native Q knots, x>=1e-9, PCHIP log-x interpolation independently compared to cubic; not LHAPDF implementation parity or PDF uncertainty',checks=checks,shape=list(v.shape),max_refinement=max(refine),max_interpolator_moment_difference=max(diff),rows=rows,small_x_tail_bounded=False,below_Qmin_allowed=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'shape':out['shape'],'max_refinement':max(refine),'max_interpolator_difference':max(diff),'selected':[r for r in rows if r['Q_GeV'] in [1.295,4.75,10.9657,75.0724,104.712]]},indent=2))
