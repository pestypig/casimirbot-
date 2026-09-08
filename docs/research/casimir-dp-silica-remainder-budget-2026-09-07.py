"""Nonrelativistic f-sum budgets in missing momentum intervals, not total bounds."""
import hashlib, json, math
from pathlib import Path
import numpy as np
from scipy.integrate import quad

p = Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest() == '7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
v = 776/299792.458
me = .00051099895
column = 7e9
pref = 2*math.pi/(me*v*v)*30/(60*1.66053906892e-24)*.3893793721e-27
rows = []
for r in json.loads(p.read_text())['rows']:
    a = np.array(r['masses_GeV'])**2
    c = np.array(r['effective_alpha_products'])
    def budget(lo, hi):
        def fun(t):
            y = math.exp(t)
            return y*y*sum(c/(y+a))**2
        left = math.log(lo**2) if lo else math.log(min(a)*1e-14)
        value = quad(fun, left, math.log(hi**2), epsabs=1e-40, epsrel=1e-10)[0]
        check = quad(fun, left, math.log(hi**2), epsabs=1e-41, epsrel=1e-11)[0]
        assert abs(value/check-1) < 1e-7
        # Positive integral omitted below tiny numerical floor is bounded by
        # (sum |alpha|/m^2)^2 * y_floor^2/2.
        omitted = (sum(abs(c)/a)**2)*math.exp(2*left)/2 if not lo else 0
        return (check+omitted)*pref*column*1e9
    intervals = []
    for hi in [100e-6, 200e-6]:
        covered_q = budget(0, 37289.5e-9)
        missing_q = budget(37289.5e-9, hi)
        whole = budget(0, hi)
        assert abs((covered_q+missing_q)/whole-1) < 1e-7
        intervals.append(dict(q_ceiling_keV=hi*1e6,
            missing_37p2895keV_to_ceiling_fsum_budget_eV=missing_q,
            all_q_below_ceiling_fsum_budget_eV=whole,
            free_electron_recoil_over_rest_mass_at_ceiling=hi**2/(2*me**2)))
    rows.append(dict(masses_GeV=r['masses_GeV'], intervals=intervals))
out = dict(status='conditional_nonrelativistic_interval_envelopes_not_realized_stopping',
    path_column_g_cm2=column, speed_km_s=776,
    formula='2 pi ne_per_gram/(me v^2) integral dy y [sum alpha_i/(y+m_i^2)]^2',
    rows=rows, assumptions=['isotropic zero-temperature nonrelativistic electronic density response',
      'all 30 electrons per nominal 60 u SiO2 formula',
      'full positive energy f-sum allocated to accessible energy for upper envelope',
      'initial-speed diagnostic; no evolving path or capture probability'],
    limitations=['no bound on omitted q above chosen ceiling',
      'no relativistic error bound; ceiling diagnostic is not an error estimate',
      'do not add table contribution to all-q envelope: that double counts',
      'material table not used as exact response to claim a tighter bound'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out, indent=2)+'\n')
print(json.dumps(out, indent=2))
