"""Gaussian occupied-state overlap diagnostic, not an energy-weighted rate."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

root = Path(__file__).resolve().parents[2]
p = root / 'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(p.read_bytes()).hexdigest() == '5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
design = json.loads(p.read_text())['leading_design']
d, hold = design['branch_separation_m'], design['hold_time_s']
hc, hbar, c = 1.973269804e-7, 6.582119569e-16, 299792458.
rho_eV_m3 = .3 * 1e9 * 1e6
rows = []
for mass in [77.86556301055496e9, 100e9, 1000e9]:
    width = (8*math.pi**1.5*rho_eV_m3*hc**3/mass**4)**(1/3)
    s = mass*width
    a = s*d/hc
    # Product of two Gaussian occupations integrates to exp[-q^2/(2s^2)].
    # Normalize that overlap over q; this is not the scattering measure.
    filter_mean = -math.expm1(-a*a/2)
    numerical = quad(lambda z: math.exp(-z*z/2)/math.sqrt(2*math.pi)
                     * 2*math.sin(a*z/2)**2, -12, 12, epsabs=1e-25)[0]
    assert abs(numerical/filter_mean-1) < 1e-10
    # A zero-bulk-velocity Gaussian only; a moving stream changes temporal scales.
    tau = 2*math.pi*hbar/(mass*width**2)
    rows.append(dict(mass_GeV=mass/1e9, unit_occupation_width_m_s=width*c,
                     momentum_width_eV=s, branch_resolution_momentum_eV=hc/d,
                     normalized_overlap_branch_filter=filter_mean,
                     log_overlap_ratio_at_resolution=-.5/a**2,
                     zero_drift_coherence_time_s=tau, coherence_time_over_hold=tau/hold))
out = dict(status='conditional_overlap_and_timescale_diagnostic', rows=rows,
           density_GeV_cm3=.3, frozen_separation_m=d, frozen_hold_s=hold,
           primary='https://arxiv.org/html/2606.00237v1',
           limitations=['No energy-conservation, mediator, or target weighting in overlap diagnostic',
                        'No absolute decoherence or upper bound on it',
                        'Coherence time assumes zero drift; not a universal cold-stream time',
                        'No supplied cold population or xenon fit'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out, indent=2)+'\n')
print(json.dumps(rows, indent=2))
