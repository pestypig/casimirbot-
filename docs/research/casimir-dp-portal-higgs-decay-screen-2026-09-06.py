"""Physical eigenmass matching and conditional invisible-Higgs rate screen."""
import json,math
from pathlib import Path
import numpy as np
mS=1000.;mh=125.;v=246.2;kappa=1000.;ychi=-.1;yn=.3*.939/v
limit=.107 # ATLAS Run1+Run2 2301.10731v2, SM-production-normalized invisible yield.
rows=[];errors=[]
for b in [0.,1.,10.,100.]:
    off=b*v
    hh=mh*mh+off*off/(mS*mS-mh*mh)
    A=np.array([[mS*mS,off],[off,hh]])
    vals,vecs=np.linalg.eigh(A);K=np.linalg.inv(A)
    s=abs(vecs[0,0]);c2=float(vecs[1,0]**2)
    errors.append(abs(math.sqrt(vals[0])-mh))
    width=(kappa*s)**2/(32*math.pi*mh) # light final state, negligible mass
    for smwidth in [.003,.0041,.005]:
        br=width/(c2*smwidth+width)
        signal=c2*br
        maxwidth=limit*c2*smwidth/(c2-limit)
        kmax=math.sqrt(maxwidth*32*math.pi*mh)/s if s>0 else None
        rows.append({'b_GeV':b,'matched_h_diagonal_GeV':math.sqrt(hh),'heavy_eigenmass_GeV':math.sqrt(vals[1]),'sin_theta':s,'production_over_SM':c2,'SM_width_benchmark_GeV':smwidth,'new_partial_width_GeV':width,'new_invisible_branch_fraction':br,'SM_normalized_invisible_signal':signal,'exceeds_conditional_limit':bool(signal>limit),'kappa_upper_GeV_under_assumptions':kmax,'C_chiN_GeV_inverse_squared':ychi*yn*K[0,1],'light_portal_product_relative_to_kappa1000_at_ceiling':(kmax/kappa)**2 if kmax is not None else None})
checks={'physical_eigenmass_matched':max(errors)<1e-10,'no_mixing_no_new_decay':all(r['new_partial_width_GeV']==0 for r in rows if r['b_GeV']==0),'sum_mixing_probabilities':all(abs(r['sin_theta']**2+r['production_over_SM']-1)<1e-12 for r in rows),'rate_ceiling_inversion':all(math.isclose(r['production_over_SM']*((r['kappa_upper_GeV_under_assumptions']*r['sin_theta'])**2/(32*math.pi*mh))/(r['production_over_SM']*r['SM_width_benchmark_GeV']+(r['kappa_upper_GeV_under_assumptions']*r['sin_theta'])**2/(32*math.pi*mh)),limit,rel_tol=1e-12) for r in rows if r['b_GeV']>0)}
checks={k:bool(x) for k,x in checks.items()};assert all(checks.values())
out={'checks':checks,'physical_Higgs_mass_benchmark_GeV':mh,'source_limit':limit,'source':'https://arxiv.org/abs/2301.10731v2','rows':rows,'scope':'Tree-level scalar portal with no independent H†H phi² amplitude, negligible light-heavy mixing from phi background, light scalars escaping detector, universal cos²theta SM production/width rescaling. SM widths are stress benchmarks. No full collider likelihood, transport or loop admission.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'nominal_width':[r for r in rows if r['SM_width_benchmark_GeV']==.0041]},indent=2))
