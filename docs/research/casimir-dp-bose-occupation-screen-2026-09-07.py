"""Conditional phase-space screen; no interaction rate or population fit."""
import json
import math
from pathlib import Path
from scipy.integrate import quad

hc = 1.973269804e-14  # GeV cm
c = 299792458.0  # m/s
rho = 0.3  # chosen GeV/cm^3, all in one spin-zero species
v0 = 220000 / c  # chosen Gaussian width, not one-axis standard deviation
m_xe = 131.293 * 0.93149410242
mu_required = math.sqrt(m_xe * 248e-6 / (2 * (776000/c)**2))
m_min = mu_required * m_xe / (m_xe-mu_required)

def peak(mass, width=v0):
    # n = integral d^3p/(2pi)^3 f(p); f = f0 exp[-p^2/(m v0)^2]
    return 8 * math.pi**1.5 * rho * hc**3 / (mass**4 * width**3)

normalization = quad(lambda x: 4/math.sqrt(math.pi)*x*x*math.exp(-x*x), 0, math.inf)[0]
assert abs(normalization-1) < 1e-12
assert abs(peak(200)/peak(100)-1/16) < 1e-15
rows = []
for mass in [m_min, 100, 1000]:
    f0 = peak(mass)
    width_at_unity = v0 * f0**(1/3)
    assert abs(peak(mass, width_at_unity)-1) < 1e-12
    rows.append(dict(mass_GeV=mass, peak_occupation=f0,
                     maximum_relative_bose_correction=f0,
                     gaussian_width_m_s_for_unit_peak_at_same_density=width_at_unity*c))
out = dict(status='conditional_phase_space_screen',
           primary='https://arxiv.org/html/2606.00237v1',
           assumptions=dict(density_GeV_cm3=rho, gaussian_width_m_s=v0*c,
                            population='one spin-zero boson; untruncated isotropic Gaussian'),
           elastic_xenon_mass_threshold_GeV=m_min, rows=rows,
           checks=dict(gaussian_normalization=normalization, mass_scaling=True, inverse_width=True),
           limitations=['No scattering amplitude or absolute decoherence computed',
                        'Not a bound on arbitrary cold streams, condensates, or captured populations',
                        'A high peak alone does not ensure occupied kinematically accessible final states',
                        'Xenon threshold assumes elastic free-nucleus recoil and a specified speed endpoint',
                        'No apparatus sensitivity or boundary residual established'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out, indent=2)+'\n')
print(json.dumps(rows, indent=2))
