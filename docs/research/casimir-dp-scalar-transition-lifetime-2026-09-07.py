"""Physical pseudoscalar transition vertex: two-body decay consistency."""
import math,json,hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-universal-scalar-selection-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='014ec7e90426be18c4616692c60a014a57a762c2798b60f1081f853eb088e714'
old=json.loads(p.read_text());hbar=6.582119569e-25;age=13.8e9*365.25*86400
rows=[]
for r in old['rows']:
 if r['asymmetry_GeV']!=0:continue
 m=r['mchi_GeV'];d=.000248*(m+131.293*.93149410242)/m;M=m+d;g=r['analytic_nonuniversal_transition'];ms=1e-9
 momentum=math.sqrt((d*d-ms*ms)*((M+m)**2-ms*ms))/(2*M)
 width=g*g*momentum*(d*d-ms*ms)/(8*math.pi*M*M)
 leading=g*g*(d*d-ms*ms)**1.5/(8*math.pi*m*m)
 tau=hbar/width
 rows.append(dict(mchi_GeV=m,gap_GeV=d,physical_pseudoscalar_vertex=g,scalar_mass_GeV=ms,lifetime_seconds=tau,age_over_lifetime=age/tau,g_for_lifetime_equal_reference_age=g*math.sqrt(tau/age),leading_width_relative_error=abs(leading/width-1)))
assert all(r['leading_width_relative_error']<1e-4 for r in rows)
out=dict(scope='Tree physical amplitude g ubar_1 i gamma5 u_2. Single real-scalar final state, spin-averaged parent. Coupling is a vertex, not a Lagrangian coefficient with unresolved Majorana factors. Cosmological age is a no-replenishment reference, not a derived population model.',reference_age_s=age,rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
