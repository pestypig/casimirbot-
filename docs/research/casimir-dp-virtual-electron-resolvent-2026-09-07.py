"""No-pair instantaneous-potential diagnostic; NOT a matched field-theory rate."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

ROOT = Path(__file__).resolve().parent
source = ROOT / 'casimir-dp-virtual-nuclear-match-2026-09-07.json'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '5dd97935c6c3559c0eb8fd2d15eae38b79af9e1f955a790def87be9b8888be9e'
data = json.loads(source.read_text())
a = data['mediator_GeV']
gap = data['gap_GeV']
alpha = data['effective_alpha_product']
me, mass = .00051099895, 100.

def integrand(t, kind):
    # p=a*tan(t); radial measure p^2 dp/(p^2+a^2)^2=sin(t)^2 dt/a.
    p = a * math.tan(t)
    energy = math.hypot(p, me)
    recoil = p*p/(2*me) if kind == 'nr' else p*p/(energy+me)
    projector = (energy+me)/(2*energy) if kind == 'positive_energy' else 1.
    denominator = gap if kind == 'gap' else gap + recoil + p*p/(2*mass)
    return math.sin(t)**2/a * projector/denominator

rows = {}
for kind in ['gap', 'nr', 'positive_energy']:
    coarse = quad(integrand, 0, math.pi/2, args=(kind,), epsabs=1e-8, epsrel=1e-9)[0]
    edges = [0, .01, .1, .5, 1., 1.5, math.pi/2]
    fine = sum(quad(integrand, l, r, args=(kind,), epsabs=1e-10, epsrel=1e-12)[0]
               for l, r in zip(edges[:-1], edges[1:]))
    assert abs(coarse/fine-1) < 1e-8
    rows[kind] = {'W_GeV_minus2': -8*alpha**2*fine, 'split_relative': abs(coarse/fine-1)}
analytic = -2*math.pi*alpha**2/(gap*a)
assert abs(rows['gap']['W_GeV_minus2']/analytic-1) < 1e-12
for row in rows.values():
    row['amplitude_ratio_to_static_gap'] = row['W_GeV_minus2']/analytic
out = {'status': 'instantaneous_positive_energy_projected_toy_not_QFT_matching',
       'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
       'rows': rows,
       'omissions': ['retardation and mediator poles', 'pair sectors and complete crossed diagrams',
                     'finite external momentum', 'bound-electron material response', 'matching error budget']}
Path(__file__).with_suffix('.json').write_text(json.dumps(out, indent=2)+'\n')
print(json.dumps(out, indent=2))
