"""Dirac open-line pseudoscalar boxes, leading external-quark expansion."""
import json,math
from pathlib import Path
from scipy.integrate import quad
mx=400.;ma=1.;g=mx/294.;gu=5.6e-5
# Combined five-denominator tensor integral avoids subtracting X-functions.
def integrals(reverse=False):
    def kernel(t,u,power):
        r=ma/mx; den=1-(1-r)*t; x=r*t/den; jac=r/den**2
        y=(1-x)*u;z=(1-x)*(1-u);D=mx*mx*x*x+ma*ma*z
        return jac*(1e6 if power==2 else 1e12)*(1-x)*y*z*(x if power==2 else x**3)/D**power
    vals=[]
    for power in [2,3]:
        if reverse:
            val=quad(lambda u:quad(lambda x:kernel(x,u,power),0,1,epsabs=1e-8,epsrel=1e-9,limit=200)[0],0,1,epsabs=1e-8,epsrel=1e-8)[0]
        else:
            val=quad(lambda x:quad(lambda u:kernel(x,u,power),0,1,epsabs=1e-8,epsrel=1e-9,limit=200)[0],0,1,epsabs=1e-8,epsrel=1e-8)[0]
        vals.append(val/(1e6 if power==2 else 1e12))
    return vals
I1,I2=integrals();R1,R2=integrals(True)
A1=2*g*g*gu*gu/(16*math.pi**2)*I1
A2=-8*g*g*gu*gu/(16*math.pi**2)*I2
Cq=mx*(6*A1+mx*mx*A2)/4
C1=2*A1;C2=mx*A2
# Forward on-shell Dirac bilinears verify scalar / symmetric-traceless decomposition.
errors=[]
for mq in [.002,.01]:
    for gamma in [1.,1.2,2.]:
        z=mx*mq*gamma
        amp=4*A1*mx*mx*mq*mq+8*A1*z*z+4*A2*mx*mx*z*z
        effective=4*Cq*mx*mq*mq+C1*(4*z*z-mx*mx*mq*mq)+C2*(4*mx*z*z-mx**3*mq*mq)
        errors.append(abs(effective/amp-1))
checks={'integration_order_I1':math.isclose(I1,R1,rel_tol=1e-6),
        'integration_order_I2':math.isclose(I2,R2,rel_tol=1e-6),
        'forward_Dirac_operator_decomposition':max(errors)<1e-12,
        'positive_combined_parameter_integrals':I1>0 and I2>0}
assert all(checks.values()),checks
out=dict(scope='Zero-transfer leading light-quark-momentum Dirac box subset; partonic coefficients only, no hadronic matching or full UV amplitude',checks=checks,I1_GeV_m4=I1,I2_GeV_m6=I2,A1_GeV_m4=A1,A2_GeV_m6=A2,C_u_scalar_GeV_m3=Cq,C_u_twist1_GeV_m4=C1,C_u_twist2_GeV_m5=C2,twist_combination_GeV_m3=mx*C1+mx*mx*C2,max_forward_relative_error=max(errors),integration_relative_errors=[I1/R1-1,I2/R2-1],full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
