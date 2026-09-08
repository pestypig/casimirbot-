"""Tree-level two-heavy-field matching demonstration, not a fitted UV model."""
import json,math
from pathlib import Path
import numpy as np
from decimal import Decimal,localcontext
# All dimensional inputs in GeV. Explicit illustrative inputs, not admitted values.
mS=1000.;mh=125.;v=246.2;b=100.;kappa=1000.;ychi=-.1
mn=.939;fn=.3;mchi=1000.;mu=1e-12 # 0.001 eV
yn=fn*mn/v
A=np.array([[mS*mS,b*v],[b*v,mh*mh]])
K=np.linalg.inv(A);eig=np.linalg.eigvalsh(A)
achi=-kappa*ychi*K[0,0];an=-kappa*yn*K[0,1];contact=ychi*yn*K[0,1]
shift=kappa*kappa*K[0,0]/2
rows=[]
for lam in [1.,1e-6,1e-12,1e-24]:
    vev=mu/math.sqrt(lam);product=achi*an*vev*vev
    Zcorrection=(kappa*vev)**2*float((K@K)[0,0])
    with localcontext() as ctx:
        ctx.prec=60
        bare=Decimal(str(shift))+Decimal(str(lam))
        recovered=bare-Decimal(str(shift))
        assert recovered==Decimal(str(lam))
    rows.append({'lambda_effective':lam,'lambda_tree_threshold_shift':shift,'bare_lambda_decimal':str(bare),'threshold_shift_over_effective':shift/lam,'phi_vacuum_GeV':vev,'light_vertex_product':product,'light_alpha_product':product/(4*math.pi),'zero_q_light_over_contact_amplitude':product/(2*mu*mu*contact),'induced_kinetic_correction':Zcorrection})
# Recover the Gaussian elimination energy independently via a linear solve.
J=np.array([.7,-.2]);heavy=-np.linalg.solve(A,J)
energy=float(.5*heavy@A@heavy+heavy@J)
checks={'heavy_block_positive':bool((eig>0).all()),'Gaussian_elimination_energy':math.isclose(energy,-.5*float(J@K@J),rel_tol=1e-12),'portal_contact_quartic_identity':math.isclose(achi*an,2*shift*contact,rel_tol=1e-12),'light_contact_ratio_identity':all(math.isclose(r['zero_q_light_over_contact_amplitude'],shift/r['lambda_effective'],rel_tol=1e-12) for r in rows),'small_kinetic_correction_at_examples':all(r['induced_kinetic_correction']<1e-4 for r in rows)}
assert all(checks.values())
out={'checks':checks,'inputs':{'mS_GeV':mS,'mh_diagonal_GeV':mh,'v_GeV':v,'b_GeV':b,'kappa_GeV':kappa,'ychi':ychi,'fN_assumed':fn,'mN_GeV':mn,'mchi_GeV':mchi,'mu_GeV':mu},'heavy_eigenmasses_GeV':np.sqrt(eig).tolist(),'a_chi_GeV_inverse':achi,'a_N_GeV_inverse':an,'C_chiN_GeV_inverse_squared':contact,'M_chi_equivalent_GeV':math.sqrt(mchi/achi),'M_N_equivalent_GeV':math.sqrt(mn/an),'rows':rows,'scope':'Tree-level scalar portal demonstration. m_h diagonal is not a matched physical Higgs mass. Nucleon form factor benchmark, no full QCD/species matching, running, loops, finite-density solution or experimental admission. Tiny effective quartic is specified with explicit cancellation, not numerically recovered in binary float.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
