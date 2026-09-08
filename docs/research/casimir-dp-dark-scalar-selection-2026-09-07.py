"""Radial scalar Yukawa matrix from the same dark mass matrix."""
import hashlib,json,math
from pathlib import Path
import numpy as np
b=Path(__file__).parent;p=b/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
j=json.loads(p.read_text());vev=500.;gchi=.1;mv=2*gchi*vev;rows=[]
for old in j['rows']:
 m=old['mchi_GeV']
 if m not in [40.,100.]:continue
 d=abs(old['delta_GeV']);D=m+d/2;cases=[]
 for name,a in [('symmetric',0.),('previous_asymmetric_pilot',d/4)]:
  md=math.sqrt(D*D-a*a);ml=d/2+a;mr=d/2-a
  matrix=np.array([[ml,md],[md,mr]]);e,U=np.linalg.eigh(matrix);V=U@np.diag([1j,1.])
  assert np.allclose(V.T@matrix@V,np.diag([m,m+d]),atol=1e-12)
  Y=V.T@np.diag([ml,mr])@V/vev
  analytic=[(-d/2+a*a/D)/vev,(d/2+a*a/D)/vev]
  assert np.allclose(Y.diagonal().real,analytic,rtol=1e-12,atol=1e-18)
  assert abs(abs(Y[0,1])-abs(a*md/(D*vev)))<1e-18
  if not a:assert abs(Y[0,1])<1e-18
  cases.append(dict(branch=name,scalar_diagonal_couplings=Y.diagonal().real.tolist(),scalar_transition_magnitude=float(abs(Y[0,1])),offdiagonal_pure_imaginary_in_this_phase_convention=bool(abs(Y[0,1].real)<1e-18)))
 rows.append(dict(mchi_GeV=m,gap_GeV=d,tree_baryon_coupling_symmetric=old['C_nucleon_GeV_minus2']*mv*mv/gchi,cases=cases))
out=dict(scope='New symmetric candidate branch compared with previous asymmetric pilot; real Majorana masses proportional to vev, invariant Dirac mass. Physical radial coupling from Takagi-rotated dM/dvev. Tree selection rule only; no all-orders protection, portal matching, relic density or viability claim.',vev_GeV=vev,gchi=gchi,vector_mass_GeV=mv,rows=rows,checks=dict(Takagi_positive_masses=True,analytic_scalar_matrix=True,symmetric_transition_zero=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
