"""Conditional perturbative scalar-force admission screen using conservative source ceilings."""
import hashlib,json,math
from pathlib import Path
base=Path('docs/research')
path=base/'casimir-dp-yukawa-full-phase-2026-09-06.json'
d=json.loads(path.read_text())
G=6.67430e-11; u=1.66053906892e-27; hbar=1.054571817e-34;c=299792458.
gravity=G*u*u/(hbar*c)
rows=[]
for r,ceiling,ref in zip(d['rows'][:2],[1.,1e7],
 ['https://arxiv.org/abs/2002.11761','https://arxiv.org/abs/2412.13167v2']):
    alpha=r['alpha']; minimum=alpha*alpha/gravity
    allowed_product=math.sqrt(gravity*ceiling)
    rows.append({'mediator_eV':r['mediator_eV'],'range_micrometers':.1973269804/r['mediator_eV'],
      'DM_nucleon_alpha_product':alpha,'minimum_matter_force_relative_to_gravity':minimum,
      'conservative_force_screen_ceiling':ceiling,'minimum_over_screen_ceiling':minimum/ceiling,
      'maximum_product_at_alpha_DM_one':allowed_product,
      'quadratic_D_at_screen_ceiling':r['D_quadratic']*(allowed_product/alpha)**2,
      'source':ref})
checks={'both_benchmark_points_fail_force_screen':all(r['minimum_over_screen_ceiling']>1e5 for r in rows),
 'perturbative_product_identity':all(abs((r['maximum_product_at_alpha_DM_one']**2)/(gravity*r['conservative_force_screen_ceiling'])-1)<1e-12 for r in rows),
 'range_mapping':abs(rows[0]['range_micrometers']-197.3269804)<1e-9}
assert all(checks.values()),checks
out={'evidence_class':'conservative_conditional_force_screen_not_new_experimental_limit',
 'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'gravitational_nucleon_alpha':gravity,
 'assumptions':['one unscreened scalar with universal equal-sign nucleon coupling',
  'alpha_DM=g_DM^2/(4*pi)<=1 adopted as perturbative-domain criterion',
  'same scalar mediates DM-nucleon and nucleon-nucleon interactions',
  'nucleon number proportional to mass at screening precision; no cancellations'],
 'rows':rows,'checks':checks,
 'notes':['1e7 ceiling at 19.7 micrometers deliberately looser than the second source abstract summary near 1e6',
  'quadratic D estimates at screen boundary are diagnostics, not new confidence limits',
  'no automatic exclusion of screened, nonperturbative, multi-mediator or other nonminimal theories']}
(base/'casimir-dp-yukawa-force-screen-2026-09-06.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
