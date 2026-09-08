"""Necessary coupling-split screen; trial ceilings are not digitized limits."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-bl-two-mediator-screen-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ddc698c716a2aa274096819bfdf2694b2d60148ae45313690509bc641bd90d56'
a=json.loads(p.read_text())['rows'][0]['effective_alpha_products'][0]
rows=[]
for ceiling in [1e-15,math.sqrt(4*math.pi)*1e-15,1e-14]:
 dark=4*math.pi*a/ceiling
 assert math.isclose(dark*ceiling/(4*math.pi),a,rel_tol=1e-14)
 rows.append(dict(trial_SM_ceiling=ceiling,required_dark_coupling=dark,
                  dark_alpha=dark**2/(4*math.pi)))
out=dict(status='conditional_perturbative_split_obstruction_not_reconstructed_exclusion',
         alpha_product=a,convention='alpha_product=g_dark*g_SM/(4*pi)',
         perturbative_screen='g_dark^2/(4*pi)<=1',
         minimum_SM_coupling=math.sqrt(4*math.pi)*a,rows=rows,
         limitations=['trial SM ceilings, not mass-resolved experimental likelihood',
                      'no screened/composite or strongly coupled completion supplied',
                      'no dark matter mediator stability bound used'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
