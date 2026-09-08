"""Additive scalar-charge dipole cancellation across H, He, C, O."""
import json
from pathlib import Path
import numpy as np
from scipy.optimize import linprog
u=.93149410242;me=.00051099895
species=[('H1',1,1,1.00782503223),('He4',2,4,4.00260325413),('C12',6,12,12.),('O16',8,16,15.99491461957)]
# Atomic mass minus electron rest masses; electronic binding correction omitted.
M=np.array([am-Z*me/u for name,Z,A,am in species]);charges=np.array([[Z,A-Z] for name,Z,A,am in species],float)
B=charges/M[:,None]
# Normalize electron scalar charge/mass to one. Nucleon charges have mass units u.
x=np.linalg.solve(B[:2],np.ones(2));residual=1-B@x
Aub=np.vstack([np.column_stack([B,-np.ones(4)]),np.column_stack([-B,-np.ones(4)])])
sol=linprog([0,0,1],A_ub=Aub,b_ub=np.r_[np.ones(4),-np.ones(4)],bounds=[(None,None),(None,None),(0,None)],method='highs');assert sol.success
rmin=1-B@sol.x[:2]
assert max(abs(rmin))<=sol.x[2]+1e-10
assert max(abs(residual[:2]))<1e-12
out=dict(scope='Dipole coefficients only, additive nucleon scalar charges, measured isotope mass proxies. No plasma emission, screening, binding-charge derivative or statistical stellar bound. Unit electron charge/mass excludes trivial zero-coupling solution.',H_He_matched_charges_in_u=x.tolist(),H_He_matched_residuals=dict(zip([s[0] for s in species],residual.tolist())),equal_weight_minimax_charges_in_u=sol.x[:2].tolist(),minimax_max_absolute_dipole_residual=sol.x[2],minimax_residuals=dict(zip([s[0] for s in species],rmin.tolist())),constraint_rank=int(np.linalg.matrix_rank(np.column_stack([B,-np.ones(4)]))),sources=['https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=H','https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=He','https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=O'],model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
