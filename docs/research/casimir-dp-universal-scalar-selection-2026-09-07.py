"""Universal mass rescaling: tree-level Takagi selection check."""
import json,math
from pathlib import Path
import numpy as np
rows=[]
for m in [40.,100.]:
 gap=.000248*(m+131.293*.93149410242)/m;D=m+gap/2
 for asym in [0.,gap/4,.1*D]:
  md=math.sqrt(D*D-asym*asym);M=np.array([[gap/2+asym,md],[md,gap/2-asym]])
  vals,U=np.linalg.eigh(M);ph=np.where(vals<0,1j,1.+0j);V=U.astype(complex)*ph
  diag=V.T@M@V;Y=V.T@(M/500)@V
  err=np.max(abs(Y-np.diag(abs(vals)/500)))
  assert err<1e-14
  eps=gap/4;Ybreak=V.T@((M+eps*np.diag([1.,-1.]))/500)@V
  expected=abs(eps*md/(D*500));assert abs(abs(Ybreak[0,1])-expected)<1e-14
  rows.append(dict(mchi_GeV=m,asymmetry_GeV=asym,universal_diagonal_yukawa=np.diag(Y).real.tolist(),universal_offdiagonal_numerical_residue=float(abs(Y[0,1])),mass_alignment_error=float(err),diagnostic_nonuniversal_transition=float(abs(Ybreak[0,1])),analytic_nonuniversal_transition=expected))
out=dict(scope='Quadratic two-Weyl mass sector with M(phi)=(1+phi/500GeV)M0. Not a complete dilaton EFT or composite transition theorem. Nonuniversal addition is a labeled diagnostic, not an admitted model.',rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
