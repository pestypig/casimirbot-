import ast,math,json
from pathlib import Path
import numpy as np
from numpy.polynomial.legendre import leggauss
base=Path(__file__).parent
tree=ast.parse((base/'casimir-dp-photon-charge-tail-2026-09-06.py').read_text())
iso=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='iso' for t in n.targets))
assert abs(sum(f for _,_,f in iso)-1)<1e-12
med=.01;gap=.01;v=776/299792.458
exposure=2840/(sum(m*f for _,m,f in iso)*1.66053906892e-27)*365*86400*.003*776e5

def kernel(A,Z,n):
 R=1.2*A**(1/3)/.1973269804;x=med*R
 gx,gw=leggauss(n)
 r=np.concatenate([R*(gx+1)/2,R+20/med*(gx+1)/2])
 w=np.concatenate([R*gw/2,20/med*gw/2])
 y=med*r
 u=np.empty_like(r);inside=r<R
 u[inside]=3/(med**2*R**3)*(1-(1+x)*math.exp(-x)*np.sinh(y[inside])/y[inside])
 u[~inside]=3/(med**2*R**3)*(x*math.cosh(x)-math.sinh(x))*np.exp(-y[~inside])/y[~inside]
 def W(q):
  return -4*math.pi*Z**2*np.sum(w*r*r*u*u*np.sinc(np.asarray(q)[...,None]*r/math.pi),axis=-1)
 return W

def run(n):
 gx,gw=leggauss(80);counts=[]
 for lo,hi in [(200,269.9),(5.4,200)]:
  total=0.
  for A,m,f in iso:
   ma=m*.93149410242-54*.00051099895;mu=100*ma/(100+ma);end=min(hi,2*mu**2*v*v/ma*1e6)
   if end<=lo:continue
   E=lo+(end-lo)*(gx+1)/2;q=np.sqrt(2*ma*E*1e-6)
   W=kernel(A,54,n)(q)
   ds=ma/(2*math.pi*v*v)*W*W*.3893793721e-27*1e-6
   total+=f*(end-lo)/2*np.sum(gw*ds)
  counts.append(exposure*total)
 return counts
coarse=run(384);fine=run(768)
assert max(abs(a/b-1) for a,b in zip(coarse,fine))<1e-5
B=1/math.sqrt(fine[0]);alpha=math.sqrt(B*gap)
C0=float(kernel(12,6,768)(0)*B)
out=dict(status='conditional_uniform_nucleus_virtual_raw_normalization',mediator_GeV=med,gap_GeV=gap,
 B_alpha_squared_over_gap_GeV_inverse=B,effective_alpha_product=alpha,
 raw_low_high_ratio=fine[1]/fine[0],carbon_forward_W_GeV_minus2=C0,
 refinement_relative=max(abs(a/b-1) for a,b in zip(coarse,fine)),
 assumptions=['100 GeV particle; mono-speed 776 km/s; density 0.003/cm3; 2.84 tonne-year',
 'uniform nuclear charge radius 1.2 A^(1/3) fm; nuclear-only potential',
 'local large-gap second Born; one raw high-window event, no detector acceptance',
 'carbon forward coefficient only; no assembled diamond rate or external constraints'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
