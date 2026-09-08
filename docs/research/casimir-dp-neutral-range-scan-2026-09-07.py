"""Fixed-product mediator-range sensitivity and uniform neutral elastic envelope."""
import json,math
from pathlib import Path
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-neutral-sphere-envelope-2026-09-07.py')
n={'__file__':str(p)};exec(p.read_text().split('\nrows=[]')[0],n)
r=json.loads(n['p'].read_text())['rows'][0];cs=r['effective_alpha_products']
hc=n['hc'];rr=n['rr'];d=n['d']['branch_separation_m'];end=3472.823879
def integral(mass,absolute=False):
 def f(q):
  if q==0:return 0.
  A=abs(cs[0])/q**2+abs(cs[1])/(q*q+1e18) if absolute else cs[0]/(q*q+mass*mass)+cs[1]/(q*q+1e18)
  return q*A*A*min(2,q*rr/hc)**2*min(2,q*q*d*d/(2*hc*hc))
 cuts=sorted(set([0.,end,2*hc/d]+([mass] if 0<mass<end else [])))
 return sum(quad(f,a,b,epsabs=1e-65,epsrel=1e-10,limit=300)[0] for a,b in zip(cuts[:-1],cuts[1:]))*n['pref']
upper=integral(0,True);rows=[]
for mass in [1000.,100.,10.,1.,.1,.01,0.]:
 value=integral(mass);assert 0<value<=upper
 rows.append(dict(light_mass_eV=mass,conditional_neutral_elastic_D_upper=value))
out=dict(status='fixed_product_range_scan_not_refitted_or_allowed_model',rows=rows,
 uniform_nonnegative_light_mass_envelope=upper,
 comparator_over_uniform_envelope=.029511464722144533/upper,
 assumptions=['leading pair products unchanged; heavy mediator 1 GeV','same neutral arbitrary-cell rms bound 0.1 nm','q<=qBZ only; Born elastic maximal positional coherence'],
 limitations=['new mediator masses require their own external constraints and complete xenon normalization',
 'massless endpoint is a formal limiting kernel, not a UV completion','no total inelastic or nonneutral bound'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
