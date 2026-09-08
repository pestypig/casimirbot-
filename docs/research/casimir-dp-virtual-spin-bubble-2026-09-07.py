"""Conditional contact-spin response via an authenticated independent bubble."""
from pathlib import Path
import json,hashlib,math
import numpy as np
base=Path(__file__).resolve().parent
names=['casimir-dp-electron-box-spin-operator-2026-09-07.json','casimir-dp-diamond-spin-bubble-2026-09-06.json','casimir-dp-diamond-density-rate-2026-09-06.json']
raw=[(base/n).read_bytes() for n in names];op,spin,reference=map(json.loads,raw)
assert hashlib.sha256(raw[2]).hexdigest()=='39d3554dfbf1e498cda44feada20d83d3fc72a6548ba2b56284dd6eb4b00e4c7'
archive=base/'casimir-dp-diamond-spin-response-2026-09-06/diamond_nolfe.h5'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==spin['archive_sha256']
B=op['conditional_sigma_dot_sigma_coefficient_GeV_minus2'];me=5.1099894e-4
mu=reference['reference_mu_GeV_inverse'];e2=4*math.pi/137.03599908
sx=np.array([[0,1],[1,0]],complex);sy=np.array([[0,-1j],[1j,0]]);sz=np.diag([1,-1])
contact=sum(np.kron(s,s) for s in [sx,sy,sz]);transverse=(np.kron(sx,sx)+np.kron(sy,sy))/2
assert abs(np.trace(contact@contact).real/4-3)<1e-12
assert abs(np.trace(transverse@transverse).real/4-.5)<1e-12
factor=6*me**2*B**2/(e2*mu**2)
r=next(r for r in spin['rows'] if r['mass_GeV']==100)
out=dict(status='conditional_independent_spin_bubble_component_bound',source_sha256={n:hashlib.sha256(b).hexdigest() for n,b in zip(names,raw)},relative_rate_factor=factor,D_covered_spin_bound=r['D_spin_grid_upper']*factor,
inherited_quadrature_difference=r['quadrature_relative_difference'],limitations=['spin-degenerate independent orbitals; not interacting susceptibility','constant leading spin coefficient; full matching unresolved','5.5-150 eV and archived momentum grid only','D <= twice scatter count; not postselected visibility','not combined with different-grid density as a full model'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
