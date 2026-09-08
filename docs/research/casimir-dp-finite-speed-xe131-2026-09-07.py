from pathlib import Path
import numpy as np,math
from scipy.special import spherical_jn,spherical_yn
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-helm-potential-2026-09-07.py');
import hashlib,json
assert hashlib.sha256(p.read_bytes()).hexdigest()=='391e8c9346f3954e7adaef14a398594e8c2fa8d187e863c52530538568a89096'
n={'__file__':str(p)};exec(p.read_text(encoding='utf-8-sig').split('\nrows=[]')[0],n)
pot,_,_=n['build'](24001)
def phases(k,g,h=.002,end=24,extra=0):
 ell=np.arange(int(np.ceil(12*k))+20+extra);ll=ell*(ell+1)
 x=np.arange(1,round(end/h)+1)*h;W=np.array([pot(v) for v in x]);start=3*(ell+1)
 um=np.zeros(len(ell));u=um.copy();saved=[]
 for i in range(1,len(x)-1):
  ids=start==i
  if ids.any():
   u[ids]=1
   def regular_series(z):
    term=np.ones(np.sum(ids));value=term.copy()
    for order in range(1,21):
     term*= -z*z/(2*order*(2*ell[ids]+2*order+1));value+=term
    return value
   um[ids]=(x[i-1]/x[i])**(ell[ids]+1)*regular_series(k*x[i-1])/regular_series(k*x[i])
  qm=ll/x[i-1]**2+g*W[i-1]-k*k;q=ll/x[i]**2+g*W[i]-k*k;qp=ll/x[i+1]**2+g*W[i+1]-k*k
  up=(2*(1+5*h*h*q/12)*u-(1-h*h*qm/12)*um)/(1-h*h*qp/12)
  if i%100==0 and i<len(x)-8:
   norm=np.maximum(np.maximum(abs(up),abs(u)),1e-200);up/=norm;u/=norm
  um,u=u,up
  if i>=len(x)-6:saved.append(u.copy())
 deriv=(25*saved[-1]-48*saved[-2]+36*saved[-3]-16*saved[-4]+3*saved[-5])/(12*h)
 z=k*x[-1];j=z*spherical_jn(ell,z);y=z*spherical_yn(ell,z)
 jp=k*(spherical_jn(ell,z)+z*spherical_jn(ell,z,True));yp=k*(spherical_yn(ell,z)+z*spherical_yn(ell,z,True))
 delta=np.arctan2(j*deriv-jp*u,y*deriv-yp*u)
 delta=(delta+np.pi/2)%np.pi-np.pi/2
 return delta

from numpy.polynomial.legendre import leggauss,legvander
nodes,weights=leggauss(240)
def rates(speed,g,h=.002,end=24,extra=0):
 k=n['mu']*(speed/299792.458)/.01
 d=phases(k,g,h,end,extra)-phases(k,0.,h,end,extra);ell=np.arange(len(d))
 coeff=(2*ell+1)*np.exp(1j*d)*np.sin(d)/k
 def integrate(lo,hi):
  if hi<=lo:return None
  c=lo+(nodes+1)*(hi-lo)/2
  q=np.sqrt(2*k*k*(1-c));z=q*n['R']
  F=3*spherical_jn(1,z)/z*np.exp(-.5*(q*n['s'])**2)
  exact=abs(legvander(c,len(d)-1)@coeff)**2
  born=(g*F/(1+q*q))**2
  fac=2*np.pi*(hi-lo)/2
  return dict(exact=float(fac*(weights@exact)),born=float(fac*(weights@born)),ratio=float((weights@exact)/(weights@born)))
 total=integrate(-1,1)
 partial=4*np.pi/k**2*np.sum((2*ell+1)*np.sin(d)**2)
 assert abs(total['exact']/partial-1)<1e-7
 emax=2*(n['mu']**2)*(speed/299792.458)**2/n['mA']*1e6
 bands={}
 for name,lo,hi in [('low',5.4,10),('high',200,269.9)]:
  bands[name]=integrate(1-2*min(hi,emax)/emax,1-2*lo/emax) if lo<emax else None
 return dict(speed_kms=speed,g=g,h=h,end=end,lmax=int(ell[-1]),total=total,bands=bands)
rows=[]
for speed in [100,650,776]:
 for sign in [-1,1]:
  coarse=rates(speed,sign*n['lam'],.001,30,20)
  fine=rates(speed,sign*n['lam'],.0005,36,40)
  for key in ['total']:
   assert abs(coarse[key]['exact']/fine[key]['exact']-1)<.002
  for name in ['low','high']:
   if fine['bands'][name]:
    print('band_refinement',speed,sign,name,coarse['bands'][name]['exact']/fine['bands'][name]['exact']-1,flush=True)
    assert abs(coarse['bands'][name]['exact']/fine['bands'][name]['exact']-1)<.01
  rows.append(dict(coarse=coarse,fine=fine));print(json.dumps(fine),flush=True)
controls=[]
for sign in [-1,1]:
 r=rates(650,sign*n['lam']*.01,.0005,36,40)
 assert abs(r['total']['ratio']-1)<.002
 assert abs(r['bands']['high']['ratio']-1)<.02
 controls.append(r)
out=dict(status='Xe131_finite_speed_partial_waves_exploratory',rows=rows,weak_controls=controls,
 checks=['upstream potential hash','angular integral versus partial-wave total','step/endpoint/lmax refinement','weak coupling recovery both signs'],
 limitations=['Xe131 only, no isotope average','not a refolded transport or detector spectrum','finite-start approximation controlled by joint numerical refinement','no physical parameter uncertainty band','no screened solid or population response'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
