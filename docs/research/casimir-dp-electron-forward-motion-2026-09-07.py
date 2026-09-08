"""On-shell electron-motion diagnostic at zero momentum transfer."""
from pathlib import Path
import math,json,hashlib,warnings
from scipy.integrate import quad,IntegrationWarning
warnings.simplefilter('error',IntegrationWarning)
base=Path(__file__).resolve().parent
p=base/'casimir-dp-virtual-300mev-candidate-2026-09-07.json';raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='54fc7fe2ae81ff6062486128741a26c7bfa3931b5baf18e0286934bbd8134884'
c=json.loads(raw)['candidate'];M=c['dark_mass_GeV'];g=c['gap_GeV'];a=c['mediator_GeV'];m=.00051099895
rows=[]
for pe in [0,3e-6,3e-5,1e-4]:
 E=math.hypot(m,pe);w=M*E
 def f(y,z):
  x=1-y-z;out=0.
  for s in [-1,1]:
   Q2=y*y*M*M+z*z*m*m+2*s*y*z*w
   A=-(y*M*M+s*z*w);B=-(y*w+s*z*m*m)
   D=x*a*a+y*(2*M*g+g*g)+Q2
   assert D>0
   num=4*w*w+4*w*(s*A+B)+2*s*w*Q2+2*s*A*B-2*s*B*M*M-2*s*M*g*B-2*A*m*m+2*M*g*m*m
   out+=x*(num/(M*E*D*D)-5*s*w/(M*E*D))
  return out
 vals=[]
 for tol in [1e-7,3e-8]:
  vals.append(quad(lambda t:2*t*quad(lambda z:f(t*t,z),0,1-t*t,epsabs=1e-9,epsrel=tol)[0],0,1,points=[.001,.01,.1],epsabs=1e-9,epsrel=tol)[0]/(16*math.pi**2))
 assert abs(vals[0]/vals[1]-1)<1e-6
 rows.append(dict(electron_momentum_GeV=pe,normalized_forward_trace_GeV_minus2=vals[1],quadrature_relative_difference=abs(vals[0]/vals[1]-1)))
rest=rows[0]['normalized_forward_trace_GeV_minus2']
assert abs(rest/.0012384023241308884-1)<1e-8
for row in rows:row['ratio_to_rest']=row['normalized_forward_trace_GeV_minus2']/rest
out=dict(status='on_shell_forward_spin_average_motion_diagnostic_not_material_error_bound',candidate_sha256=hashlib.sha256(raw).hexdigest(),normalization='external 2M and 2E factors divided out',rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
