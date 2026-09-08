"""Heavy-eigenstate CP-even gluon threshold, zero SM up Yukawa."""
import json,math
from pathlib import Path
from decimal import Decimal,localcontext
M=2000.; yL=.20; yR=.0032; v=246.2; b=yL*v/math.sqrt(2)
# L_eff = (alpha_s/pi) G^2 [Kaa a^2 + Kh h_fluctuation + ...].
Kaa=yR*yR*M*M/(24*(M*M+b*b)**2)
Kh=yL*yL*v/(24*(M*M+b*b))
records=[]
with localcontext() as ctx:
    ctx.prec=60
    u=Decimal(str(b*b/(M*M)))
    def logheavy(w):
        t=1+u+w
        return ((t+(t*t-4*u*w).sqrt())/2).ln()/2
    exact=Decimal(1)/(2*(1+u)**2)
    for eps in ['1e-4','1e-6','1e-8']:
        w=Decimal(eps)
        derivative=(logheavy(w)-logheavy(Decimal(0)))/w
        records.append(dict(c2_over_M2=float(w),relative_derivative_error=float(derivative/exact-1)))
checks={'heavy_eigenvalue_derivative':abs(records[-1]['relative_derivative_error'])<1e-8,'zero_mixing_limit':math.isclose(yR*yR*M*M/(24*M**4),yR*yR/(24*M*M),rel_tol=1e-14),'positive_CP_even_threshold':Kaa>0 and Kh>0,'decoupling_at_fixed_yukawas':yR*yR*(2*M)**2/(24*((2*M)**2+b*b)**2)<Kaa}
assert all(checks.values())
out=dict(scope='Leading heavy-messenger CP-even local gluon operators only, yu=0; no light-quark integration or full DM two-loop matching',full_model_admitted=False,operator_convention='L=(alpha_s/pi) G_a_munu G_a^munu (Kaa a^2 + Kh h_fluctuation)',Kaa_GeV_m2=Kaa,Kh_GeV_m1=Kh,Kh_over_one_SM_heavy_quark_Higgs_coefficient=Kh/(1/(12*v)),mixing_suppression_of_Kaa=Kaa/(yR*yR/(24*M*M)),checks=checks,derivative_checks=records)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
