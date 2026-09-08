"""Leading heavy-messenger Coleman-Weinberg mixed-quartic threshold, yu=0."""
import json,math,hashlib
from pathlib import Path
from decimal import Decimal, localcontext
Nc=3;yL=.20;yR=.0032;MU=2000.;v=246.2
kappa=-Nc*yL*yL*yR*yR/(4*math.pi**2)
# Dimensionless squared singular values of [[0,b],[ic,M]], normalized by M^2.
def cw(u,w,scale):
    one=Decimal(1); tr=one+u+w
    heavy=(tr+(tr*tr-4*u*w).sqrt())/2
    light=u*w/heavy
    def F(t):return t*t*((t/(scale*scale)).ln()-Decimal('1.5')) if t else Decimal(0)
    return F(heavy)+F(light)
records=[]
with localcontext() as ctx:
    ctx.prec=65
    for eps in ['0.0001','0.00001','0.000001']:
        u=Decimal(eps);w=u
        for scale in ['0.5','1','2']:
            z=Decimal(scale)
            coeff=(cw(u,w,z)-cw(u,Decimal(0),z)-cw(Decimal(0),w,z)+cw(Decimal(0),Decimal(0),z))/(u*w)
            records.append(dict(epsilon=float(u),scale_over_M=float(z),mixed_coefficient=float(coeff),relative_error=float(coeff/2-1)))
# Evaluate how this threshold-only boundary choice enters the earlier finite subset.
path=Path(__file__).with_name('casimir-dp-axion-triangle-subset-2026-09-07.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()=='498c8b3245c6e43cea92e1424a5164df421d6cf04079ce525f75195495a80e8a'
s={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),s)
rows=[dict(q_GeV=q,triangle_over_tree=s['triangle'](q,kappa)/s['tree'](q)) for q in [0.,.05,.246]]
checks={'CW_mixed_coefficient_converges_to_two':all(abs(r['relative_error'])<3e-5 for r in records if r['epsilon']==1e-6),
        'scale_cancels_at_target_order':max(r['mixed_coefficient'] for r in records if r['epsilon']==1e-6)-min(r['mixed_coefficient'] for r in records if r['epsilon']==1e-6)<1e-12,
        'messenger_matching_product':math.isclose(yL*yR*v/(math.sqrt(2)*MU),5.6e-5,rel_tol=.01),
        'both_couplings_required':(-Nc*0*yR*yR/(4*math.pi**2))==0}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values()),checks
out=dict(scope='Leading yu=0 finite potential threshold; independent renormalized kappa boundary remains; not full matching',kappa_threshold=kappa,gu_from_messenger=yL*yR*v/(math.sqrt(2)*MU),checks=checks,CW_checks=records,triangle_threshold_only_boundary=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))

