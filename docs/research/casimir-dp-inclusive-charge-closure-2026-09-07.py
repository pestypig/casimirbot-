"""Inclusive fixed-charge-number Born closure bound, isotropic response."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-excess-charge-diagnostic-2026-09-07.py')
n={'__file__':str(p)};exec(p.read_text().split('\nrows=[]')[0],n)
Qabs=2*n['inventory'];rows=[]
for r in json.loads(n['p'].read_text())['rows']:
 masses=[m*1e9 for m in r['masses_GeV']];cs=r['effective_alpha_products']
 norm=sum(abs(c)/m for c,m in zip(cs,masses))**2
 bound=n['pref']*Qabs**2*norm
 # Direct signed-amplitude integral is below the L2 triangle envelope.
 f=lambda t:math.exp(2*t)*sum(c/(math.exp(2*t)+m*m) for c,m in zip(cs,masses))**2
 integral=quad(f,math.log(min(masses)*1e-8),math.log(max(masses)*1e8),epsabs=1e-60,epsrel=1e-9,limit=300)[0]
 assert 0<2*integral<=norm*(1+1e-8)
 rows.append(dict(masses_GeV=r['masses_GeV'],inclusive_Born_D_upper=bound,
  comparator_over_upper=n['cfg']['frozen_diosi']['gaussian_exponent_at_hold']/bound,
  density_needed_even_at_bound_cm3=.003*n['cfg']['frozen_diosi']['gaussian_exponent_at_hold']/bound,
  signed_integral_over_triangle_envelope=2*integral/norm))
out=dict(status='conditional_inclusive_Born_fixed_charge_closure_bound',absolute_charge_inventory=Qabs,rows=rows,
 assumptions=['fixed-number charge density operator sum_a Q_a exp(i q.r_a)',
 'Born density coupling with isotropic target spectrum or isotropic orientation average',
 'stationary normalized target ensemble; include all positive and negative energy transitions in closure',
 'same fast population, fixed hold and canonical charge inventory'],
 limitations=['not a nonperturbative scattering theorem or general relativistic current bound',
 'no additional external charged environment or externally supplied particles included',
 'comparator is theoretical benchmark, not measured sensitivity',
 'does not rule out captured populations, different operators or parameters'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(rows,indent=2))
