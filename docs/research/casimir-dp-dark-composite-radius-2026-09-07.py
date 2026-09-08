"""Conditional radius/charge screen, not a detector rate or allowed point."""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
config = ROOT / 'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
sha = hashlib.sha256(config.read_bytes()).hexdigest()
assert sha == '5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
hc = 1.973269804e-16  # GeV m
qxe = math.sqrt(2 * 122 * 248e-6)
qsoft = hc / 2.5e-7

def form(x):
    if abs(x) < 0.01:
        return 1 - x*x/10 + x**4/280 - x**6/15120
    return 3 * (math.sin(x) - x*math.cos(x)) / x**3

rows = []
for mean_mass in [0.01, 1., 10.]:
    for count in [1e4, 1e8, 1e12]:
        mass = count * mean_mass
        radius = (9*math.pi*mass/(4*mean_mass**4))**(1/3)
        density = mean_mass**3/(3*math.pi**2)
        assert math.isclose(4*math.pi*radius**3*density/3, count, rel_tol=1e-12)
        # Eq.17 is an order-of-magnitude applicability condition, not an exclusion.
        coupling_cap = count**(-1/3)
        spacing = density**(-1/3)
        rows.append(dict(mean_constituent_mass_GeV=mean_mass, N=count,
            mass_GeV=mass, radius_m=radius*hc,
            scalar_unscreened_coupling_scale=coupling_cap,
            qxe_R=qxe*radius, qsoft_R=qsoft*radius,
            qxe_spacing=qxe*spacing,
            elastic_F2_xe=form(qxe*radius)**2,
            elastic_F2_soft=form(qsoft*radius)**2,
            flux_cm2_s=0.3/mass*776e5,
            charge_squared_over_N_at_screening_scale=(count*coupling_cap)**2/count))
assert form(0) == 1
assert abs(form(1e-4) - 1) < 1.1e-9
out = dict(config_sha256=sha, source='https://arxiv.org/html/1812.07573v1',
    equations=[6,17,29], qxe_GeV=qxe, qsoft_GeV=qsoft,
    status='conditional elastic scale screen; no detector rate or allowed point', rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out, indent=2)+'\n', encoding='utf-8')
for r in rows:
    print(f"mbar={r['mean_constituent_mass_GeV']:g} N={r['N']:.0e} R={r['radius_m']:.6g}m F2Xe={r['elastic_F2_xe']:.6g} F2soft={r['elastic_F2_soft']:.6g} qXeSpacing={r['qxe_spacing']:.6g}")
