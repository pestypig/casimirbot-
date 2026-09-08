"""Spin decomposition of specified vector pair; Majorana completion pending."""
from pathlib import Path
import json,math,hashlib,warnings
import numpy as np
from scipy.integrate import quad,IntegrationWarning
warnings.simplefilter('error',IntegrationWarning)
base=Path(__file__).resolve().parent
src=base/'casimir-dp-electron-box-spin-trace-2026-09-07.py';ns={'__file__':str(src)}
exec(src.read_text().split('errors=[]')[0],ns)
G=ns['gamma'];metric=ns['metric'];sl=ns['slash'];M=ns['M'];m=ns['m'];gap=ns['g'];a=ns['a'];I=np.eye(4)
S=sum(np.kron(s,s) for s in ns['pauli'])
def numerator(l,sign):
 k=np.array([M,0,0,0])+l;h=np.array([m,0,0,0])+sign*l
 out=np.zeros((4,4),complex)
 for i in range(4):
  for j in range(4):
   A=(G[j]@(sl(k)+(M+gap)*I)@G[i])[:2,:2]
   B=((G[i]@(sl(h)+m*I)@G[j]) if sign==1 else (G[j]@(sl(h)+m*I)@G[i]))[:2,:2]
   out+=metric[i]*metric[j]*np.kron(A,B)
 return out
errors=[];rows=[]
for sign in [-1,1]:
 zero=numerator(np.zeros(4),sign);t=np.array([1.,0,0,0])
 coeff=[zero,(numerator(t,sign)-numerator(-t,sign))/2,(numerator(t,sign)+numerator(-t,sign))/2-zero,
        sum((numerator(np.eye(4)[j],sign)+numerator(-np.eye(4)[j],sign))/2-zero for j in [1,2,3])/3]
 for X,v_expected in zip(coeff,[0,-2*gap,2,-4/3]):
  u=np.trace(X)/4;v=np.trace(S@X)/12
  err=max(abs(v-v_expected),np.max(np.abs(X-u*I-v*S)));assert err<1e-10;errors.append(float(err))
 def f(y,z):
  x=1-y-z;Q=M*y+sign*m*z;D=x*a*a+y*(2*M*gap+gap*gap)+Q*Q
  return x*((2*gap*Q+2*Q*Q)/D**2-3/D)
 vals=[]
 for power in [1,2]:
  vals.append(quad(lambda t:power*t**(power-1)*quad(lambda z:f(t**power,z),0,1-t**power,epsabs=1e-10,epsrel=1e-8)[0],0,1,points=[.0001,.001,.01,.1],epsabs=1e-10,epsrel=1e-8)[0]/(16*math.pi**2))
 assert abs(vals[0]/vals[1]-1)<1e-7
 rows.append(dict(sign=sign,spin_integral_GeV_minus2=vals[1],coordinate_relative_difference=abs(vals[0]/vals[1]-1)))
coupling=(4*math.pi*ns['c']['effective_alpha'])**2
out=dict(status='specified_vector_pair_spin_operator_not_complete_Majorana_match',max_matrix_error=max(errors),rows=rows,conditional_sigma_dot_sigma_coefficient_GeV_minus2=coupling*sum(r['spin_integral_GeV_minus2'] for r in rows),spin_convention='Pauli sigma_chi dot sigma_e; coefficient for S_chi dot S_e is four times larger')
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
