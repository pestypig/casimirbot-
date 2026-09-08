"""Additive messenger Coleman-Weinberg potential terms; not full beta functions."""
import json,math
from pathlib import Path
import numpy as np
import mpmath as mp
Nc=3.;MU=2000.;yL=.2;yR=.0032
pref=Nc/(4*math.pi**2)
def threshold(mu):
    L=math.log(mu**-2*MU**2)
    return dict(delta_mA2=-pref*yR*yR*MU*MU*(L-1),
                delta_mH2=-pref*yL*yL*MU*MU*(L-1)/2,
                delta_lambdaA=-pref*yR**4*L,
                delta_lambdaH=-pref*yL**4*L/4,
                delta_kappaA=-pref*yL*yL*yR*yR)
beta=dict(delta_mA2=-2*pref*yR*yR*MU*MU,delta_mH2=-pref*yL*yL*MU*MU,delta_lambdaA=-2*pref*yR**4,delta_lambdaH=-pref*yL**4/2,delta_kappaA=0.)
rows=[]
for mu in [MU/2,MU,2*MU]:
    delta=threshold(mu)
    rows.append(dict(mu_GeV=mu,thresholds=delta,zero_boundary_plus_loop={key:val+beta[key]*math.log(mu/MU) for key,val in delta.items()}))
# Direct matrix calculation, including the SM up Yukawa background variable a.
rng=np.random.default_rng(6137);errors=[]
for _ in range(30):
    aa,b,c,M=rng.uniform(.1,3,4)
    mat=np.array([[aa,b],[1j*c,M]],dtype=complex)
    H=mat.conj().T@mat
    analytic=M**4+2*M*M*(b*b+c*c)+aa**4+b**4+c**4+2*aa*aa*(b*b+c*c)
    errors.append(abs(np.trace(H@H).real-analytic)/analytic)
mp.mp.dps=50
derivative_errors=[]
for mu in [MU/2,MU,2*MU]:
    M=mp.mpf(MU);scale=mp.mpf(mu)
    F=lambda t:t*t*(mp.log(t/(scale*scale))-mp.mpf('1.5'))
    derivative_errors.append(float(abs(mp.diff(F,M*M,2)-2*mp.log(M*M/(scale*scale)))))
central=threshold(MU)
checks=dict(matrix_trace_polynomial=max(errors)<1e-12,pure_background_second_derivative=max(derivative_errors)<1e-40,
            isolated_scale_cancellation=all(math.isclose(row['zero_boundary_plus_loop'][key],central[key],rel_tol=1e-12,abs_tol=1e-18) for row in rows for key in central))
checks={k:bool(v) for k,v in checks.items()}
assert all(checks.values())
out=dict(scope='yu=0 leading background expansion of messenger fermion potential. Delta V=delta_mA2 A^2/2 + delta_mH2 h^2/2 + delta_lambdaA A^4/4 + delta_lambdaH h^4/4 + delta_kappaA A^2 h^2/4. Additive fixed-field scale coefficients only; field renormalization and other diagrams omitted.',checks=checks,additive_scale_coefficients=beta,rows=rows,max_trace_relative_error=max(errors),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
