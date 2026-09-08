"""Offline research diagnostic; run from repository root. No detector likelihood."""
import bisect
import hashlib
import json
import math
from pathlib import Path

base = Path('docs/research')
inputs = base / 'casimir-dp-xenon-response-inputs-2026-09-06'
parent = base / 'casimir-dp-xenon-constituent-radiation-diagnostics-2026-09-06.json'
config = Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
d = json.loads(parent.read_text(encoding='utf-8'))
cfg = json.loads(config.read_text(encoding='utf-8'))
R = cfg['frozen_diosi']['R0_m']
assert R == d['model']['R0_m'] == 1e-7
c = d['constants']
Z = 54
shells = [(n, r*1e-10) for _, n, r in d['shell_table']]
pairs = [(Z*Z+Z, 0.)]
for i, (n, r) in enumerate(shells):
    pairs.extend([(-2*Z*n, r), (n*(n-1), 1.25*r)])
    pairs.extend((2*n*nj, 1.04*abs(r-rj)) for nj, rj in shells[:i])
prefactor = (c['G_SI']*c['charge_C']**2 /
    (12*math.pi**2.5*c['epsilon0_F_m']*c['c_m_s']**3*R**3))
conversion = 1000/(131.293*c['u_kg'])*c['year_s']

def sinc(x):
    return 1-x*x/6+x**4/120 if abs(x) < 1e-4 else math.sin(x)/x

def rate(E):
    shape = math.fsum(w*math.exp(-r*r/(4*R*R))*
        sinc(E*1000*c['charge_C']*r/(c['hbar_J_s']*c['c_m_s'])) for w, r in pairs)
    return prefactor*conversion*shape/E

def simpson(f, a, b, n):
    assert n > 0 and n % 2 == 0
    h = (b-a)/n
    return h/3*(f(a)+f(b)+math.fsum((4 if i % 2 else 2)*f(a+i*h) for i in range(1,n)))

rows = [tuple(map(float, line.split())) for line in
    (inputs/'efficiency.txt').read_text().splitlines() if line.strip() and not line.startswith('#')]
xs, ys = zip(*rows)

def efficiency(E):
    assert xs[0] <= E <= xs[-1], 'No extrapolation of reconstructed-energy efficiency'
    i = min(bisect.bisect_right(xs, E)-1, len(xs)-2)
    t = (E-xs[i])/(xs[i+1]-xs[i])
    return ys[i]*(1-t)+ys[i+1]*t

lo, hi = 1., xs[-1]
knots = [lo]+[x for x in xs if lo < x < hi]+[hi]
def piecewise(f, n):
    return math.fsum(simpson(f,a,b,n) for a,b in zip(knots,knots[1:]))

raw = piecewise(rate, 8)
weighted = piecewise(lambda E: rate(E)*efficiency(E), 8)
refined = piecewise(lambda E: rate(E)*efficiency(E), 16)
upper = prefactor*conversion*(2*Z)**2*math.log(140)
full_raw = simpson(rate, 1, 140, 10000)

# Independent analytic unit-normalized hydrogenic pair-distance fixture, atomic units.
def hydrogenic_pair(r):
    return r*r/6*(3+6*r+4*r*r)*math.exp(-2*r)
hydrogen_norm = simpson(hydrogenic_pair, 0, 40, 20000)
hydrogen_mean = simpson(lambda r:r*hydrogenic_pair(r), 0, 40, 20000)
same_pairs = sum(n*(n-1) for n,_ in shells)
cross_pairs = sum(2*n*nj for i,(n,_) in enumerate(shells) for nj,_ in shells[:i])
ordered_pairs = same_pairs+cross_pairs
checks = {
    'archive_matches_publisher_md5': hashlib.md5((inputs/'xenonnt-2022-public-data.zip').read_bytes()).hexdigest() == 'fab7d9ea3e9b3a2d8ba837554d3bf315',
    'efficiency_abscissae_strictly_increasing': all(a < b for a,b in zip(xs,xs[1:])),
    'efficiency_is_probability': all(0 <= y <= 1 for y in ys),
    'interpolation_recovers_knots': all(abs(efficiency(x)-y) < 1e-14 for x,y in rows),
    'weighted_between_zero_and_emitted': 0 < weighted <= raw <= full_raw <= upper,
    'piecewise_quadrature_converged': abs(weighted-refined)/refined < 1e-8,
    'source_model_replays_parent': abs(full_raw/d['results']['raw_photons_per_tonne_year']-1) < 1e-10,
    'hydrogenic_pair_unit_normalization': abs(hydrogen_norm-1) < 1e-10,
    'hydrogenic_pair_mean_35_over_16': abs(hydrogen_mean-35/16) < 1e-10,
    'xe_ordered_pair_count': ordered_pairs == Z*(Z-1),
    'formal_neutral_charge_cancellation': Z*Z+Z-2*Z*Z+ordered_pairs == 0,
    'frozen_config_hash_unchanged': hashlib.sha256(config.read_bytes()).hexdigest() == d['source_sha256'][config.as_posix()],
}
result = {
    'evidence_class':'diagnostic_historical_efficiency_weighting_not_response_fit_or_updated_Xe_RDF',
    'assumptions': ['additive atomic emission', 'white nondissipative DP noise',
        'published clamped orbital approximation', 'E_reconstructed_equals_E_photon',
        'one selected event at most per source photon', 'no efficiency extrapolation'],
    'R0_m':R, 'efficiency_rows':len(rows), 'table_band_keV':[xs[0],xs[-1]],
    'integration_band_keV':[lo,hi],
    'raw_photons_per_tonne_year_in_table_band_above_1keV':raw,
    'historical_efficiency_weighted_per_tonne_year':weighted,
    'weighted_to_raw_ratio':weighted/raw,
    'quadrature_relative_change':abs(weighted-refined)/refined,
    'full_1to140keV_raw_photons_per_tonne_year':full_raw,
    'full_1to140keV_atomic_triangle_upper_per_tonne_year':upper,
    'triangle_upper_to_clamped_ratio':upper/full_raw,
    'hydrogenic_pair_norm':hydrogen_norm, 'hydrogenic_pair_mean_au':hydrogen_mean,
    'xe_same_shell_ordered_pairs':same_pairs, 'xe_cross_shell_ordered_pairs':cross_pairs,
    'xe_total_ordered_pairs':ordered_pairs,
    'source_sha256':{p.as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
        for p in [parent, config, inputs/'efficiency.txt', inputs/'provenance.json']},
    'checks':checks,
}
assert all(checks.values()), checks
out = base/'casimir-dp-xenon-response-rdf-diagnostics-2026-09-06.json'
out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
