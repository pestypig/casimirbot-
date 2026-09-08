import math,json
from pathlib import Path
from scipy.integrate import quad
s=1e-10/1.973269804e-7/math.sqrt(6);v=776/299792.458;mu=1e11
rows=[]
for delta in [1e6,1e7]:
 assert delta>.5*mu*v*v
 def fun(y):
  x=math.exp(y);p=x/s;A=delta+p*p/(2*mu);z=v*p/A
  assert z<1
  fac=delta/A*(math.atanh(z)/z if z>1e-6 else 1+z*z/3)
  return (-math.expm1(-x*x))**2/x*fac
 coarse=sum(quad(fun,j,j+1,epsabs=1e-12)[0] for j in range(-16,20))
 fine=sum(quad(fun,j,j+0.5,epsabs=1e-13)[0] for j in [i/2 for i in range(-40,50)])
 assert abs(coarse/fine-1)<1e-8
 rows.append(dict(gap_eV=delta,forward_amplitude_over_constant_gap=fine/(math.sqrt(math.pi)*(2-math.sqrt(2))),refinement_relative=abs(coarse/fine-1)))
out=dict(status='finite_gap_rigid_atom_forward_diagnostic',rows=rows,
 assumptions=['massless mediator and point nucleus; Gaussian neutral cloud rms 0.1 nm',
 'mu=100 GeV static-source limit; speed 776 km/s','second Born; forward amplitude only',
 'nonrelativistic propagator; no target excitation or material correlations'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
