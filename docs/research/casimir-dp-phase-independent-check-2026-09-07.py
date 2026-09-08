"""Independent adaptive radial ODE check of selected Numerov phase shifts."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import solve_ivp
from scipy.special import spherical_jn,spherical_yn
p=Path(__file__).with_name('casimir-dp-finite-speed-xe131-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='e9d2dcfcc01a2ad090edc01c86656950caec3a49a5ef98ce97f32762bfad595c'
n={'__file__':str(p)};exec(p.read_text().split('\nrows=[]')[0],n)
pot=n['pot'];mu=n['n']['mu'];lam=n['n']['lam']
def adaptive(k,g,l,tol=1e-10,end=36):
 x=1e-5
 # Regular finite-central-potential expansion; arbitrary common amplitude.
 y=np.array([1.,(l+1)/x+(g*pot(0)-k*k)*x/(2*l+3)])
 while x<end:
  stop=min(end,2*x if x<1 else x+1)
  sol=solve_ivp(lambda r,u:[u[1],(l*(l+1)/(r*r)+g*pot(r)-k*k)*u[0]],(x,stop),y,method='DOP853',rtol=tol,atol=tol*.01)
  assert sol.success
  y=sol.y[:,-1];y/=np.max(abs(y));x=stop
 z=k*end;j=z*spherical_jn(l,z);v=z*spherical_yn(l,z)
 jp=k*(spherical_jn(l,z)+z*spherical_jn(l,z,True));vp=k*(spherical_yn(l,z)+z*spherical_yn(l,z,True))
 d=math.atan2(j*y[1]-jp*y[0],v*y[1]-vp*y[0])
 return (d+math.pi/2)%math.pi-math.pi/2
rows=[]
speed=650;k=mu*(speed/299792.458)/.01
for sign in [-1,1]:
 g=sign*lam
 ref=n['phases'](k,g,.0005,36,40)-n['phases'](k,0.,.0005,36,40)
 for l in [0,1,2,5,10,20,40]:
  value=adaptive(k,g,l);fine=adaptive(k,g,l,1e-11)
  err=abs((value-ref[l]+math.pi/2)%math.pi-math.pi/2)
  assert abs(value-fine)<1e-7
  assert err<1e-6
  rows.append(dict(sign=sign,l=l,numerov=float(ref[l]),adaptive=value,absolute_phase_difference=err,adaptive_refinement=abs(value-fine)))
  print(json.dumps(rows[-1]),flush=True)
controls=[dict(l=l,free_phase=adaptive(k,0,l)) for l in [0,10,40]]
assert max(abs(r['free_phase']) for r in controls)<1e-7
out=dict(status='selected_phase_independent_method_check_not_full_spectrum_validation',speed_kms=speed,rows=rows,free_controls=controls,
 checks=['source hash','adaptive tolerance refinement','selected phase comparison modulo pi','free potential phase'],
 limitations=['same potential and spherical matching convention','selected angular momenta and one speed only','not an independent full angular spectrum integration','no isotope average or detector response'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
