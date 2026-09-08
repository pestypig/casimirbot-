"""CP-even scalar triangle subset with independent matrix-log derivative check."""
import json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
mx=400.;f=294.;v=246.2;ma=1.;mh=125.;mr=1000.;g=mx/f;yn=.3*.939/v
masses=np.array([mh,mr])
def J(mi,mj):
    return quad(lambda x:quad(lambda u:(1-x)*(2-x)/(x*x*mx*mx+(1-x)*(u*mi*mi+(1-u)*mj*mj)),0,1,epsabs=1e-13)[0],0,1,epsabs=1e-13,epsrel=1e-10)[0]
Jmat=np.array([[J(mi,mj) for mj in masses] for mi in masses])
rows=[];derivative_errors=[]
for lp in [.01,.03,.07,.1]:
    th=.5*math.asin(2*lp*f*v/(mr*mr-mh*mh));c=math.cos(th);s=math.sin(th)
    R=np.array([[c,-s],[s,c]])
    M=R.T@np.diag(masses*masses)@R
    # Cubic tensor is the third derivative of the Cartesian potential.
    T=np.empty((2,2,2))
    for a in range(2):
        for b in range(2):
            for d in range(2):
                n=a+b+d
                T[a,b,d]=[3*M[0,0]/v,lp*f,lp*v,3*(M[1,1]-ma*ma)/f][n]
    cubic=np.einsum('ka,ib,jc,abc->kij',R,R,R,T)
    y=g*R[:,1]; n=yn*R[:,0]
    delta=mx/(16*math.pi**2)*np.einsum('i,j,kij,ij->k',y,y,cubic,Jmat)
    C=-sum(delta*n/(masses*masses))
    Ctree=lp*mx*.3*.939/(mh*mh*mr*mr)
    # Matrix-log background derivative isolates the same trilinear insertion.
    for k in [0,1]:
        dM=np.einsum('a,abc->bc',R[k],T)
        step=.001
        def derivative_integrand(x):
            def fun(eps):
                D=x*x*mx*mx*np.eye(2)+(1-x)*(M+eps*dM)
                eig,V=np.linalg.eigh(D)
                return g*g*(V@np.diag(np.log(eig))@V.T)[1,1]
            return (2-x)*(fun(step)-fun(-step))/(2*step)
        direct=quad(derivative_integrand,0,1,epsabs=1e-10,epsrel=1e-8)[0]*mx/(16*math.pi**2)
        derivative_errors.append(abs(direct/delta[k]-1))
    rows.append(dict(lambda_PhiH=lp,delta_y_h=float(delta[0]),delta_y_radial=float(delta[1]),C_scalar_triangle_GeV_m2=float(C),C_tree_GeV_m2=Ctree,scalar_triangle_over_tree=float(C/Ctree),scalar_rate_factor_subset=float((1+C/Ctree)**2)))
checks={'matrix_log_derivative_matches':max(derivative_errors)<1e-6,
        'internal_mass_exchange_symmetry':np.allclose(Jmat,Jmat.T,rtol=1e-12,atol=0),
        'positive_parameter_integrals':np.all(Jmat>0),
        'loop_subset_small_at_examined_points':all(abs(r['scalar_triangle_over_tree'])<.1 for r in rows)}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values()),checks
out=dict(scope='CP-even scalar trilinear triangle subset at Q=0, no full renormalization or box matching',checks=checks,rows=rows,J_matrix_GeV_m2=Jmat.tolist(),max_derivative_relative_error=max(derivative_errors),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
