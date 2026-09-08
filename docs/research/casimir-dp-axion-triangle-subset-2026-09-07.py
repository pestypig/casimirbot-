"""Finite two-pseudoscalar Dirac triangle subset, with both CP-even exchanges."""
import json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
mx=400.;f=294.;v=246.2;g=mx/f;ma=1.;mh=125.;mr=1000.;fn=.3;mn=.939
lp=.03;theta=.5*math.asin(2*lp*f*v/(mr*mr-mh*mh));c=math.cos(theta);s=math.sin(theta)
Mss=mh*mh*s*s+mr*mr*c*c

def I(q):
    return quad(lambda x:quad(lambda u:x*(1-x)/(x*x*mx*mx+(1-x)*ma*ma+(1-x)**2*u*(1-u)*q*q),0,1,epsabs=1e-14)[0],0,1,epsabs=1e-13,epsrel=1e-10)[0]
def T(q,k):
    return v*(lp*(ma*ma+q*q)+k*(Mss+q*q))/((mh*mh+q*q)*(mr*mr+q*q))
def triangle(q,k):return g*g*mx/(16*math.pi**2)*I(q)*(fn*mn/v)*T(q,k)
def tree(q):return lp*mx*fn*mn/((mh*mh+q*q)*(mr*mr+q*q))
# Off-shell scalar-exchange sum using Cartesian trilinears, not decay kinematics.
def direct_T(q,k):
    gh=(lp+k)*v*c-(Mss-ma*ma)/f*s
    gr=(lp+k)*v*s+(Mss-ma*ma)/f*c
    return gh*c/(mh*mh+q*q)+gr*s/(mr*mr+q*q)
# Independent zero-transfer B0 derivative by a stable logarithmic finite difference.
def B0diff(step):
    def integrand(x):
        D=x*x*mx*mx+(1-x)*ma*ma
        z=x*(1-x)*step/D
        return (math.log1p(z)-math.log1p(-z))/(2*step)
    return quad(integrand,0,1,epsabs=1e-13)[0]
rows=[]
for k in [0.,-lp*ma*ma/Mss,1e-6,-1e-6,1e-3,-1e-3]:
    for q in [0.,.001,.05,.246]:
        tri=triangle(q,k); tr=tree(q)
        rows.append(dict(kappa_A=k,q_GeV=q,I_GeV_m2=I(q),C_tree_GeV_m2=tr,C_triangle_subset_GeV_m2=tri,triangle_over_tree=tri/tr,scalar_rate_factor_for_this_subset=(1+tri/tr)**2))
errors=[abs(direct_T(q,k)-T(q,k)) for k in [0.,1e-6,1e-3] for q in [0.,.246]]
checks={'mass_eigenstate_sum_equals_matrix_inverse':max(errors)<1e-17,
        'B0_derivative_independent_check':math.isclose(B0diff(.01),I(0),rel_tol=1e-8),
        'finite_q_integral_positive_decreasing':0<I(.246)<I(0),
        'zero_q_subset_cancellation':abs(triangle(0,-lp*ma*ma/Mss))<1e-30}
checks={k:bool(z) for k,z in checks.items()};assert all(checks.values()),checks
out=dict(scope='Finite pseudoscalar triangle subset only; no boxes, scalar internal loops, counterterms, RG or full Wilson matching',coupling_convention='C is minus the effective scalar Lagrangian coefficient; same as prior positive tree potential convention',checks=checks,rows=rows,kappa_zero_transfer_subset_cancellation=-lp*ma*ma/Mss,gchi_exact_mass_over_f=g,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'I0':I(0),'rows':[r for r in rows if r['q_GeV'] in [0.,.246]]},indent=2))
