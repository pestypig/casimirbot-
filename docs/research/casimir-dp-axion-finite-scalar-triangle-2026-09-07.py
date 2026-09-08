"""Finite spacelike momentum in the CP-even Dirac triangle subset."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
base=Path(__file__).parent
archive=base/'casimir-dp-axion-scalar-triangle-2026-09-07.json'
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='24111de38ca0319f05d97daf23bef40d8f7798d9d2087f3a9814775bb7ab2844'
old=json.loads(archive.read_text())
mx=400.; f=294.; v=246.2; ma=1.; masses=np.array([125.,1000.]); g=mx/f; yn=.3*.939/v
def J(mi,mj,Q,reverse=False):
    def integrand(x,u):
        y=(1-x)*u; z=(1-x)*(1-u)
        return (1-x)*(2-x)/(x*x*mx*mx+y*mi*mi+z*mj*mj+y*z*Q*Q)
    if reverse:
        return quad(lambda u:quad(lambda x:integrand(x,u),0,1,epsabs=1e-13)[0],0,1,epsabs=1e-13)[0]
    return quad(lambda x:quad(lambda u:integrand(x,u),0,1,epsabs=1e-13)[0],0,1,epsabs=1e-13)[0]
qs=[0.,.001,.05,.1,.246,.262]
jm={Q:np.array([[J(mi,mj,Q) for mj in masses] for mi in masses]) for Q in qs}
rows=[]; errors=[]
for r in old['rows']:
    lp=r['lambda_PhiH']; th=.5*math.asin(2*lp*f*v/(masses[1]**2-masses[0]**2))
    c=math.cos(th); s=math.sin(th); R=np.array([[c,-s],[s,c]])
    M=R.T@np.diag(masses*masses)@R
    T=np.empty((2,2,2))
    for a in range(2):
        for b in range(2):
            for d in range(2):
                T[a,b,d]=[3*M[0,0]/v,lp*f,lp*v,3*(M[1,1]-ma*ma)/f][a+b+d]
    cubic=np.einsum('ka,ib,jc,abc->kij',R,R,R,T)
    y=g*R[:,1]; n=yn*R[:,0]
    for Q in qs:
        delta=mx/(16*math.pi**2)*np.einsum('i,j,kij,ij->k',y,y,cubic,jm[Q])
        C=-sum(delta*n/(masses*masses+Q*Q))
        tree=lp*mx*.3*.939/np.prod(masses*masses+Q*Q)
        rows.append(dict(lambda_PhiH=lp,Q_GeV=Q,C_triangle_GeV_m2=float(C),triangle_over_tree=float(C/tree),relative_change_from_contact=float(C/r['C_scalar_triangle_GeV_m2']-1)))
        if Q==0:errors.append(abs(C/r['C_scalar_triangle_GeV_m2']-1))
# Positive denominator implies 0 <= (J(0)-J(Q))/J(0) <= Q^2/(4 m_min^2).
bound=qs[-1]**2/(4*min(masses)**2)
decreases=1-jm[qs[-1]]/jm[0.]
order=max(abs(J(mi,mj,qs[-1],True)/jm[qs[-1]][i,j]-1) for i,mi in enumerate(masses) for j,mj in enumerate(masses))
checks={'archived_zero_transfer_recovery':max(errors)<1e-10,'positive_kernel_bound':bool(np.all(decreases>=0) and np.all(decreases<=bound)), 'independent_integration_order':order<1e-8,'mass_exchange_symmetry':all(np.allclose(j,j.T,rtol=1e-12,atol=0) for j in jm.values())}
assert all(checks.values())
out=dict(scope='Finite-Q CP-even triangle only; no box/gluon/counterterm completion',full_model_admitted=False,checks={k:bool(v) for k,v in checks.items()},kernel_relative_bound=bound,max_integration_order_relative_error=order,max_amplitude_relative_change=max(abs(r['relative_change_from_contact']) for r in rows),rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='rows'},indent=2))
