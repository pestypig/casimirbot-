"""Second-order contact-density stimulated term, finite-time upper envelope."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

root = Path(__file__).resolve().parents[2]
config = root/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
digest = hashlib.sha256(config.read_bytes()).hexdigest()
assert digest == '5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
a = json.loads(config.read_text())['leading_design']
hc = 1.973269804e-14  # GeV cm
hbar = 6.582119569e-25  # GeV s
u = 1.66053906892e-27  # kg; ideal carbon mass-to-nucleon proxy
Q = a['mass_kg']/u
T = a['hold_time_s']/hbar
d = a['branch_separation_m']*100/hc
rho = .3
rows = []
for m in [77.86556301055496,100,1000]:
    n = rho/m * hc**3
    K = (Q*T*n)**2
    width = (8*math.pi**1.5*rho*hc**3/m**4)**(1/3)
    s = m*width
    gaussian_filter = -math.expm1(-.5*(s*d)**2)
    rows.append(dict(mass_GeV=m, number_density_cm3=rho/m,
                     unit_C_GeV_minus2_stimulated_D_upper=K,
                     unit_peak_gaussian_D_upper=K*gaussian_filter))

# Verify integrated pair identity independently for several dimensionless widths.
# For one-dimensional projected p, each normalized Gaussian has variance 1/2.
errors = []
for z in [.01,1,3]:
    numeric = quad(lambda q: math.exp(-q*q/2)/math.sqrt(2*math.pi)
                   *2*math.sin(z*q/2)**2, -12,12,epsabs=1e-13)[0]
    exact = -math.expm1(-z*z/2)
    errors.append(abs(numeric-exact))
assert max(errors)<1e-12
out = dict(status='conditional_second_order_stimulated_term_bound',
           config_sha256=digest, contact_coefficient_convention='H_int=C integral n_target n_chi d3x',
           C_reference_GeV_minus2=1, target_charge_proxy=Q, density_GeV_cm3=rho,
           hold_s=a['hold_time_s'], rows=rows, pair_identity_max_error=max(errors),
           limitations=['Stimulated f*f term only; not total decoherence',
                        'Number-diagonal Gaussian boson state, no anomalous or coherent mean field',
                        'Second-order weak contact-density coupling, rigid nonnegative target charge',
                        'Constant separated hold only; not complete preparation/recombination sequence',
                        'Density is a benchmark, not a bound on captured populations',
                        'Unit C is not a xenon fit or an allowed parameter point'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
