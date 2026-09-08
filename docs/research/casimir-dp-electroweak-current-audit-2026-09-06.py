"""Independent leading vector-current and neutral-state audit; no loop matching."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path('docs/research')
source=base/'casimir-dp-inelastic-local-audit-2026-09-06.json'
data=json.loads(source.read_text())
GF=1.1663787e-5; mn=.93956542052; conversion=.3893793721e-27; vev=246.22
rows=[]
for r in data['electroweak_rows']:
    m=r['mchi_GeV']; y=r['y_source']; t=y*vev/math.sqrt(2)
    # Basis (M,D_minus,D_plus). Signed mass eigenstates identify Majorana phases.
    M=np.array([[m,t,0],[t,-m,0],[0,0,m]])
    eig,U=np.linalg.eigh(M)
    Q=np.array([[0.,0.,0.],[0.,0.,1.],[0.,1.,0.]])
    Qmass=U.T@Q@U
    initial=int(np.argmin(abs(eig)))
    negative=int(np.argmin(eig))
    positive=int(np.argmax(eig))
    vector_weight=abs(Qmass[negative,initial])**2
    axial_weight=abs(Qmass[positive,initial])**2
    reduced=m*mn/(m+mn)
    C=GF/math.sqrt(2)
    sigma=reduced**2*C*C/math.pi*conversion
    low=GF*GF*reduced**2/(8*math.pi)*conversion
    # dM/dvev; the light-state diagonal Higgs coupling is zero in this matrix.
    deriv=np.array([[0,y/math.sqrt(2),0],[y/math.sqrt(2),0,0],[0,0,0]])
    rows.append({'representation':r['representation'],'mchi_GeV':m,
        'light_state_M_fraction':float(U[0,initial]**2),
        'light_state_Dplus_fraction':float(U[2,initial]**2),
        'vector_transition_weight':float(vector_weight),'axial_transition_weight':float(axial_weight),
        'analytic_vector_weight':(1+m/math.sqrt(m*m+t*t))/2,
        'diagonal_Higgs_mass_derivative':float(U[:,initial]@deriv@U[:,initial]),
        'vector_neutron_sigma_cm2':sigma*vector_weight,
        'lower_normalization_sigma_cm2':low,
        'fixed_spectrum_leading_SI_rate_ratio':sigma*vector_weight/low})

# Four spin-preserving combinations; average only initial spins, sum final spins.
m=1100.; C=GF/math.sqrt(2)
spin_average=sum((4*m*mn*C)**2 for a in range(2) for b in range(2))/4
mu=m*mn/(m+mn)
from_amplitude=spin_average/(16*math.pi*(m+mn)**2)*conversion
from_contact=mu*mu*C*C/math.pi*conversion
checks={
    'spin_sum_recovers_contact_cross_section':abs(from_amplitude/from_contact-1)<1e-14,
    'unmixed_vector_cross_section_factor_four':abs(from_contact/(GF*GF*mu*mu/(8*math.pi)*conversion)-4)<1e-14,
    'light_state_is_Dplus':all(abs(r['light_state_Dplus_fraction']-1)<1e-14 and r['light_state_M_fraction']<1e-14 for r in rows),
    'transition_weights_sum_one':all(abs(r['vector_transition_weight']+r['axial_transition_weight']-1)<1e-12 for r in rows),
    'analytic_mixing_weight_matches':all(abs(r['vector_transition_weight']-r['analytic_vector_weight'])<1e-12 for r in rows),
    'tree_Higgs_diagonal_zero':all(abs(r['diagonal_Higgs_mass_derivative'])<1e-14 for r in rows),
    'mixing_cannot_explain_factor_four':all(3.99999<r['fixed_spectrum_leading_SI_rate_ratio']<=4.000001 for r in rows),
}
assert all(checks.values()),checks
result={'evidence_class':'leading_NR_vector_amplitude_audit_not_recast_or_loop_verification',
    'inputs_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'GF_GeV_minus2':GF,'nucleon_vector_coefficient_GeV_minus2':C,
    'sigma_neutron_at_1100GeV_cm2':from_contact,'rows':rows,'checks':checks,
    'scope':['tree mass matrix and neutral current as printed in arXiv:2609.04144v1',
        'leading nonrelativistic spin-independent vector transition',
        'negative signed eigenstate receives Majorana phase; positive-state transition is axial',
        'no detector refit or changed splitting; no reassignment of source loop values']}
(base/'casimir-dp-electroweak-current-audit-2026-09-06.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
