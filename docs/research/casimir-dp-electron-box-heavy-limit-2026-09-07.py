"""Known-limit comparison; benchmark masses here are validation inputs only."""
from pathlib import Path
from scipy.integrate import quad, IntegrationWarning
import math,json,warnings
warnings.simplefilter('error',IntegrationWarning)
M=1.;m=1e-4;gap=1e-4
rows=[]
for a in [10.,30.,100.]:
 def f(y,z):
  x=1-y-z;out=0.
  for s in [-1,1]:
   Q=y*M+s*z*m;D=x*a*a+y*(2*M*gap+gap*gap)+Q*Q
   b=s*(2*M-2*gap)+2*m
   out+=x*((2*m*(2*M+gap)-b*Q+4*s*Q*Q)/D**2-5*s/D)
  return out
 values=[]
 for tol in [1e-6,3e-7]:
  val=quad(lambda y:quad(lambda z:f(y,z),0,1-y,epsabs=1e-15,epsrel=tol/10)[0],0,1,epsabs=1e-14,epsrel=tol,points=[.001,.01,.1])[0]/(16*math.pi**2)
  values.append(val)
 assert abs(values[0]/values[1]-1)<1e-5
 ref=m*M*(60*math.log(a/M)-11)/(48*math.pi**2*a**4)
 rows.append(dict(mediator_GeV=a,trace_sum_GeV_minus2=values[1],published_limit_GeV_minus2=ref,ratio=values[1]/ref,quadrature_relative_difference=abs(values[0]/values[1]-1)))
assert abs(rows[-1]['ratio']-1)<1e-3
out=dict(status='forward_SI_heavy_limit_check_not_full_matching',validation_M_GeV=M,validation_electron_mass_GeV=m,validation_gap_GeV=gap,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))

