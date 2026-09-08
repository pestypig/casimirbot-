"""Mass and charge matrix audit for a derived elastic companion channel."""
import hashlib,json,math
from pathlib import Path
import numpy as np
b=Path(__file__).parent;p=b/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
data=json.loads(p.read_text());rows=[]
for old in data['rows']:
 m=old['mchi_GeV'];d=abs(old['delta_GeV']);avg=m+d/2;cases=[]
 for label,a in [('symmetric',0.),('same_sign_endpoint',d/2),('opposite_sign_diagnostic',.1*avg)]:
  md=math.sqrt(avg*avg-a*a);ml=d/2+a;mr=d/2-a
  M=np.array([[ml,md],[md,mr]]);e,U=np.linalg.eigh(M);Q=U.T@np.diag([1.,-1.])@U
  masses=sorted(abs(e));assert np.allclose(masses,[m,m+d],rtol=1e-13,atol=1e-13)
  ratio=abs(Q[0,0]/Q[0,1]);analytic=abs(a/md)
  assert abs(ratio-analytic)<1e-13
  assert np.allclose(Q@Q,np.eye(2),atol=1e-13)
  cases.append(dict(label=label,mL_GeV=ml,mR_GeV=mr,mD_GeV=md,physical_masses_GeV=masses,charge_matrix=Q.tolist(),abs_diagonal_over_offdiagonal=ratio))
 rows.append(dict(ground_mass_GeV=m,gap_GeV=d,same_sign_max_coupling_ratio=d/math.sqrt(4*avg*avg-d*d),cases=cases))
out=dict(scope='Real two-Weyl mass matrix [[mL,mD],[mD,mR]], opposite charge matrix diag(1,-1), branch with one negative signed eigenvalue. Majorana rephasing changes off-diagonal phase but not reported magnitudes. No elastic scattering rate inferred.',source='https://arxiv.org/html/2405.08081v2 equations 7-10 and Appendix A',rows=rows,checks=dict(numerical_mass_diagonalization=True,rotated_charge_identity=True,analytic_charge_ratio=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
