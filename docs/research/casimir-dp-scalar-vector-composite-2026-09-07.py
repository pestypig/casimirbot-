"""Fermi-gas composition diagnostic for static scalar/vector cancellation."""
import json,hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-yukawa-force-screen-2026-09-06.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='8d9c3bb9f1adf98b246cbe094bf4fcad6777644fc85f627af640700dcb4a50f4'
ceil=json.loads(p.read_text())['rows']
def boost(Z,N):return .03*(Z**(5/3)+N**(5/3))/(Z+N)**(5/3)
ref=boost(6,6);rows=[]
for name,Z,N in [('C12',6,6),('O16',8,8),('Be9',4,5),('Al27',13,14),('Ti48',22,26),('Xe131',54,77),('Xe136',54,82)]:
 delta=boost(Z,N)-ref
 rows.append(dict(isotope=name,mean_gamma_minus_one_proxy=boost(Z,N),difference_from_carbon=delta,ratio_to_inherited_tolerances=[abs(delta)*r['minimum_over_screen_ceiling'] for r in ceil]))
assert abs(rows[1]['difference_from_carbon'])<1e-15
out=dict(source='https://arxiv.org/html/0907.4110v1',source_equation='16',scope='Fermi-gas boost-factor composition proxy; not a nuclear scalar form factor, finite-range force recast, certified residual force or complete cancellation no-go.',rows=rows,model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
