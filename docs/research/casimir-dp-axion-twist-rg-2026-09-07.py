"""LO fixed-five-flavor spin-two evolution; validates transport, not UV matching."""
import json,math
from pathlib import Path
import numpy as np
from scipy.linalg import expm
from scipy.integrate import solve_ivp,quad
nf=5;MZ=91.1876;alphaZ=.1181;beta0=11-2*nf/3
# Positive gluon momentum convention. m=(u+,d+,s+,c+,b+,g).
P=np.zeros((6,6))
for i in range(nf):P[i,i]=-16/9;P[i,5]=1/3;P[5,i]=16/9
P[5,5]=-nf/3
m0=np.array([.254,.146,.052,.038,.024,.486])
c0=np.array([1.,0,0,0,0,0]) # unit up-only operator: no box matching scale asserted

def alpha(mu):return alphaZ/(1+alphaZ*beta0/(2*math.pi)*math.log(mu/MZ))
def time(mu):return 2/beta0*math.log(alphaZ/alpha(mu))
rows=[];errors=[]
for mu in [50.,20.,10.]:
    t=time(mu);U=expm(t*P);m=U@m0;c=expm(-t*P.T)@c0
    ode=solve_ivp(lambda z,y:P@y,[0,t],m0,rtol=1e-11,atol=1e-13).y[:,-1]
    errors.append(max(abs(ode-m)))
    rows.append(dict(mu_GeV=mu,alpha_s=alpha(mu),moment_vector=m.tolist(),Wilson_vector=c.tolist(),contracted_amplitude=float(c@m),mismatched_frozen_Wilson_amplitude=float(c0@m),inconsistent_drop_generated_gluon_amplitude=float(c[:5]@m[:5]),momentum_sum=float(sum(m))))
# Independent LO splitting-function first moments for the off-diagonal entries.
Pgq=quad(lambda z:z*(4/3)*(1+(1-z)**2)/z,0,1)[0]
Pqg=quad(lambda z:z*(z*z+(1-z)**2),0,1)[0] # q+antiq
checks={'off_diagonal_splitting_moments':abs(Pgq-16/9)<1e-12 and abs(Pqg-1/3)<1e-12,
        'momentum_conservation_generator':np.max(abs(np.sum(P,axis=0)))<1e-12,
        'amplitude_scale_invariant':all(abs(r['contracted_amplitude']-.254)<1e-12 for r in rows),
        'ODE_agrees_with_matrix_exponential':max(errors)<1e-10,
        'round_trip_transport':np.max(abs(expm(-time(10)*P)@expm(time(10)*P)-np.eye(6)))<1e-12}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='LO five-flavor RG transport MZ to 10 GeV, no heavy threshold crossing; unit Wilson boundary is a test input, not axion matching',checks=checks,initial_moments=m0.tolist(),P=P.tolist(),rows=rows,max_ODE_error=max(errors),axion_twist_matching_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
