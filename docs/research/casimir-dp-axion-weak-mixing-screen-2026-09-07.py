"""Aligned up-singlet tree weak-current prediction and a dated CKM diagnostic."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
parent=base/'casimir-dp-axion-broken-higgs-loop-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='66d7742c6f70b532d5c0b6a887284a939b50c069c74eaa4b435c58bca550f71f'
previous=json.loads(parent.read_text())
v,M,yR0=246.2,2000.,.0032
def sine(yL):
    b=yL*v/math.sqrt(2)
    return b/math.hypot(M,b)
gu=yR0*sine(.2)
# Source: PDG 2025 CKM review, section 12.3, p.12, independent row sum.
observed_sum,sigma=.9984,.0007
rows=[];matrix_errors=[]
# Arbitrary unitary reference suffices for the projection identity; not a CKM fit.
angle=.227
V0=np.array([[math.cos(angle),math.sin(angle),0.],[-math.sin(angle),math.cos(angle),0.],[0.,0.,1.]])
for yL in [.1,.2,.4,.6]:
    sl=sine(yL);cl=math.sqrt(1-sl*sl);yR=gu/sl
    V=np.vstack([np.diag([cl,1.,1.])@V0,sl*V0[0]])
    matrix_errors.append(float(np.max(np.abs(V.T@V-np.eye(3)))))
    row_sum=float(V[0]@V[0]);deficit=sl*sl
    rows.append(dict(yL=yL,yR_at_fixed_exact_gu=yR,exact_gu=yR*sl,
        deficit=deficit,first_row_sum=row_sum,charged_current_amplitude_factor=cl,
        delta_Z_left_up_coupling=-deficit/2,
        gaussian_pull_to_dated_row_sum=(row_sum-observed_sum)/sigma,
        leading_mass_threshold_scaling_at_fixed_M=(yR/yR0)**2))
def invert_deficit(d):return math.sqrt(2)*M/v*math.sqrt(d/(1-d))
d_lo=1-observed_sum-1.96*sigma;d_hi=1-observed_sum+1.96*sigma
checks=dict(full_rectangular_current_has_orthonormal_columns=max(matrix_errors)<1e-14,
    first_row_norm_matches_projection=all(abs(r['first_row_sum']-(1-r['deficit']))<1e-14 for r in rows),
    fixed_pseudoscalar_coupling=all(abs(r['exact_gu']/gu-1)<1e-14 for r in rows),
    archived_mixing_recovered=abs(sine(.2)-previous['left_mixing_sine'])<1e-14,
    inverse_mixing_map=all(abs(sine(invert_deficit(d))**2/d-1)<1e-12 for d in [d_lo,d_hi]))
assert all(checks.values()),checks
out=dict(scope='Tree-level up-mass-basis alignment, no other new flavor/lepton interactions. Gaussian screen of a dated independent CKM row sum, not a global likelihood or exclusion.',checks=checks,
    data_source='https://pdg.lbl.gov/2025/reviews/rpp2025-rev-ckm-matrix.pdf',
    observed_row_sum=observed_sum,observed_sigma=sigma,
    gaussian_1p96sigma_deficit_interval=[d_lo,d_hi],
    corresponding_yL_interval_at_fixed_M=[invert_deficit(d_lo),invert_deficit(d_hi)],
    rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
