"""New primary-lead intake: kinematic/operator screens, not event-rate fits."""
import json,math
from pathlib import Path
base=Path(__file__).parent
ma=1.;mpi=.13498;qh=.246
# Leading pion-pole pseudoscalar shape only; common couplings cancel.
def shape(q):return q**4/((q*q+mpi*mpi)**2*(q*q+ma*ma)**2)
rows=[{'q_eV':q,'pion_pole_operator_shape_over_246MeV':shape(q*1e-9)/shape(qh)} for q in [.7141704424,.7893079216,1e3,1e6]]
v=810/299792.458
threshold=[]
for mass in [400.,1000.]:
    for A in [12.,13.,131.]:
        mn=A*.93149410242;red=mn*mass/(mn+mass)
        threshold.append({'mass_chi_GeV':mass,'A_target_benchmark':A,'max_endothermic_splitting_keV_at_810kms':.5*red*v*v*1e6})
checks={'pseudoscalar_zero_momentum_zero':shape(0)==0,'soft_shape_strongly_suppressed':rows[1]['pion_pole_operator_shape_over_246MeV']<1e-30,'carbon_cannot_supply_350keV':all(r['max_endothermic_splitting_keV_at_810kms']<350 for r in threshold if r['A_target_benchmark'] in [12,13])}
assert all(checks.values())
out={'checks':checks,'axion_source':'https://arxiv.org/html/2609.04186v1','seasonal_source':'https://arxiv.org/html/2609.04181v1','axion_shape_rows':rows,'inelastic_threshold_rows':threshold,'scope':'Operator shape excludes nuclear responses, halo, normalization and target exposure. Free stationary nuclei only for inelastic threshold; no bound-solid exclusion. Primary-lead screening, not a shared detection claim.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
