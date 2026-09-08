"""Independent Dirac trace vs invariant axial/spin-zero-target kernel."""
import json,math,hashlib
from pathlib import Path
import numpy as np
from scipy.integrate import quad
I=np.eye(2);Z=np.zeros((2,2));pauli=[np.array([[0,1],[1,0]]),np.array([[0,-1j],[1j,0]]),np.diag([1,-1])]
g=[np.block([[I,Z],[Z,-I]])]+[np.block([[Z,x],[-x,Z]]) for x in pauli];g5=1j*g[0]@g[1]@g[2]@g[3]
def slash(p):return p[0]*g[0]-sum((p[i+1]*g[i+1] for i in range(3)),np.zeros((4,4),complex))
checks=[]
for m,M in [(40.,11.175),(100.,122.)]:
 mu=m*M/(m+M)
 for speed in [.01,.003,.001]:
  p=mu*speed;E=math.hypot(m,p);T=math.hypot(M,p);s=(E+T)**2
  for c in [-.8,0.,.8]:
   sn=math.sqrt(1-c*c);pin=[E,0,0,p];pout=[E,p*sn,0,p*c];J=[2*T,-p*sn,0,-p*(1+c)]
   vertex=slash(J)@g5
   trace=float((np.trace((slash(pout)+m*np.eye(4))@vertex@(slash(pin)+m*np.eye(4))@vertex)/2).real)
   invariant=8*p*p*s*(1+c)
   err=abs(trace/invariant-1);assert err<1e-7
   checks.append(err)
  # Unit coupling and target charge. Exact CM contact total cross section.
  total=quad(lambda z:(1-z)/(4*math.pi)*4*p*p,0,1,epsabs=1e-14)[0]
  assert abs(total/(p*p/(2*math.pi))-1)<1e-12
b=Path(__file__).parent;f=b/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(f.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
rows=[]
for w in json.loads(f.read_text())['rows']:
 m=w['mchi_GeV'];d=abs(w['delta_GeV']);a=d/4;D=m+d/2;ratio=a/math.sqrt(D*D-a*a)
 rows.append(dict(mchi_GeV=m,diagonal_over_transition_vertex=ratio,CA_GeV_minus2=ratio*w['C_nucleon_GeV_minus2'],contact_spinzero_total_ratio_to_equal_Cb_vector_at_v_1e_minus3=ratio**2*1e-6/2))
out=dict(scope='Axial fermion current and conserved spin-zero target current (k+kprime), physical vertex coefficient CA, unit Dirac spin average. Spinful nuclear magnetic responses, solid excitations and population history omitted.',exact_spin_average='|M|^2/(CA^2 Q^2 F^2)=8 pCM^2 s (1+cos(theta))',NR_kernel='d sigma/d q^2 = CA(q)^2 Q^2 F(q)^2/(4 pi) * (1-q^2/(4 mu^2 v^2))',trace_cases=len(checks),max_trace_relative_error=max(checks),rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
