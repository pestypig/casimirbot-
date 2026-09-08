"""Normalized rest-spin trace for two routing families, not a matched amplitude."""
from pathlib import Path
import hashlib,json,math,warnings
import numpy as np
from scipy.integrate import quad,IntegrationWarning
warnings.simplefilter('error',IntegrationWarning)
base=Path(__file__).resolve().parent
p=base/'casimir-dp-virtual-300mev-candidate-2026-09-07.json';raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='54fc7fe2ae81ff6062486128741a26c7bfa3931b5baf18e0286934bbd8134884'
c=json.loads(raw)['candidate'];M=c['dark_mass_GeV'];g=c['gap_GeV'];a=c['mediator_GeV'];m=.00051099895
I=np.eye(2);Z=np.zeros((2,2));pauli=[np.array([[0,1],[1,0]]),np.array([[0,-1j],[1j,0]]),np.diag([1,-1])]
gamma=[np.diag([1,1,-1,-1])]+[np.block([[Z,s],[-s,Z]]) for s in pauli]
metric=np.array([1,-1,-1,-1]);one=np.eye(4)
slash=lambda v:sum(metric[i]*v[i]*gamma[i] for i in range(4))
P=np.array([M,0,0,0]);p_e=np.array([m,0,0,0]);rng=np.random.default_rng(417)
errors=[]
for sign in [-1,1]:
 for l in rng.normal(size=(8,4)):
  k=P+l;h=p_e+sign*l
  trace=0j
  for i in range(4):
   for j in range(4):
    tc=np.trace((slash(P)+M*one)@gamma[i]@(slash(k)+(M+g)*one)@gamma[j])/(4*M)
    te=np.trace((slash(p_e)+m*one)@gamma[i]@(slash(h)+m*one)@gamma[j])/(4*m)
    trace+=metric[i]*metric[j]*tc*te
  b=sign*(2*M-2*g)+2*m
  polynomial=2*m*(2*M+g)+b*l[0]+4*sign*l[0]**2-2*sign*np.dot(l[1:],l[1:])
  error=abs(trace-polynomial)/max(1,abs(polynomial));assert error<1e-11;errors.append(float(error))
rows=[]
for sign in [-1,1]:
 def f(y,z):
  x=1-y-z;Q=y*M+sign*z*m;D=x*a*a+y*(2*M*g+g*g)+Q*Q
  b=sign*(2*M-2*g)+2*m
  return x*((2*m*(2*M+g)-b*Q+4*sign*Q*Q)/D**2-5*sign/D)
 values=[]
 for power,tol in [(1,1e-7),(2,1e-9)]:
  def outer(t):
   y=t**power
   return power*t**(power-1)*quad(lambda z:f(y,z),0,1-y,epsabs=tol*.01,epsrel=tol)[0]
  points=[1e-6,1e-4,.001,.01,.1] if power==1 else [.001,.01,.1]
  values.append(quad(outer,0,1,points=points,epsabs=tol*.01,epsrel=tol)[0]/(16*math.pi**2))
 assert abs(values[0]/values[1]-1)<1e-7
 rows.append(dict(routing_sign=sign,normalized_trace_integral_GeV_minus2=values[1],coordinate_relative_difference=abs(values[0]/values[1]-1)))
out=dict(status='rest_spin_average_vector_trace_not_physical_diagram_sum',candidate_sha256=hashlib.sha256(raw).hexdigest(),max_gamma_trace_relative_error=max(errors),rows=rows,
missing=['Majorana routing multiplicities and relative signs','gauge completion check','spin-dependent amplitude and operator separation','finite momentum expansion','known-limit normalization check'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
