"""Tree-input degeneracy and its effect on one finite scattering subset."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
src=base/'casimir-dp-axion-triangle-subset-2026-09-07.py'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='498c8b3245c6e43cea92e1424a5164df421d6cf04079ce525f75195495a80e8a'
ns={'__file__':str(src),'__name__':'archived_definitions'}
exec(compile(src.read_text().split('\nrows=[]')[0],str(src),'exec'),ns)
v,f,c,s,lp,Mss,mh,mr,ma=[ns[k] for k in ['v','f','c','s','lp','Mss','mh','mr','ma']]
off=lp*f*v
# Coordinates (kappaH, kappaS, eta/f, lambdaA), all dimensionless.
# delta g_h=v*kappaH; delta g_s=f*(kappaS+eta/f).
J=np.array([[c*v,-s*f,-s*f,0.],[s*v,c*f,c*f,0.]])
null=np.array([[0.,1.,-1.,0.],[0.,0.,0.,1.]])
errors=[];fixed=[];rows=[]
for xi in [0.,.1,1.]:
    # A diagnostic family preserving the SIGNED light-Higgs AA trilinear.
    kH=s/c*xi/v
    kS=xi/f;eta=0.
    dh=kH*v;ds=kS*f+eta
    fixed.append(abs(c*dh-s*ds))
    for q in [0.,.05,.246]:
        gh=lp*v+dh;gs=(Mss-ma*ma)/f+ds
        denom=(mh*mh+q*q)*(mr*mr+q*q)
        matrix=((Mss+q*q)*gh-off*gs)/denom
        eigen=(c*gh-s*gs)*c/(mh*mh+q*q)+(s*gh+c*gs)*s/(mr*mr+q*q)
        compact=(v*lp*(ma*ma+q*q)+dh*(mh*mh+q*q))/denom
        errors.extend([abs(matrix-eigen),abs(matrix-compact)])
        factor=ns['g']**2*ns['mx']/(16*math.pi**2)*ns['I'](q)*ns['fn']*ns['mn']/v
        ratio=factor*matrix/ns['tree'](q)
        rows.append(dict(xi_radial_GeV=xi,kappa_H=kH,kappa_S=kS,eta_GeV=eta,
            q_GeV=q,delta_g_light_AA_GeV=c*dh-s*ds,
            delta_g_heavy_AA_GeV=s*dh+c*ds,
            triangle_over_tree=ratio,
            triangle_relative_to_minimal=matrix/ns['T'](q,0.),
            scalar_rate_factor_for_this_subset=(1+ratio)**2))
# Each deformation starts at cubic order at (h,s,A)=0: no tadpole/Hessian entry.
# Coefficients of A^2 h, A^2 s, A^2 h^2, A^2 s^2, A^4.
monomials=[(1,0,2),(0,1,2),(2,0,2),(0,2,2),(0,0,4)]
checks=dict(no_tree_mass_or_tadpole_shift=all(sum(x)>=3 for x in monomials),
    trilinear_rank_two=int(np.linalg.matrix_rank(J))==2,
    two_remaining_null_directions=np.max(np.abs(J@null.T))<1e-12,
    signed_light_vertex_fixed=max(fixed)<1e-12,
    exchange_sum_and_degenerate_family=max(errors)<1e-17)
checks={k:bool(val) for k,val in checks.items()};assert all(checks.values()),checks
out=dict(scope='CP/gauge-allowed tree deformation family and finite AA triangle subset; not a spurion-order claim, fitted family or full loop matching',
    checks=checks,trilinear_jacobian=J.tolist(),rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
