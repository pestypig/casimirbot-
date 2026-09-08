"""Covered SiO2 electronic stopping; no extrapolation or capture claim.

Usage: python this_file.py PATH_TO_PINNED_DARKELF
"""
import hashlib, json, math, sys
from pathlib import Path
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.integrate import simpson

source = Path(sys.argv[1]) / 'data/SiO2/SiO2_mermin.dat'
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
assert source_hash == '8b9ea234e91cfeb29550a5f830a1a183dc3dd4f68553bccdcb71a49af3d6e053'
p = Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest() == '7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
data = np.loadtxt(source, skiprows=1)
missing = np.argwhere(~np.isfinite(data))
assert missing.shape == (1, 2)
for i, j in missing:
    assert j == 3 and data[i, 0] == 8.1 and data[i, 1] == 37.2895
    # Match upstream bfill. This cell is outside accessible energy at its q.
    assert data[i, 0] > data[i, 1]*(776/299792.458)
    data[i, j] = data[i+1, j]
w, q = np.unique(data[:, 0]), np.unique(data[:, 1])
assert data.shape == (len(w)*len(q), 4)
grid = np.empty((len(w), len(q), 2))
grid[np.searchsorted(w, data[:, 0]), np.searchsorted(q, data[:, 1])] = data[:, 2:]
assert np.isfinite(grid).all()
interp = RegularGridInterpolator((w, q), grid, bounds_error=True)
v = 776/299792.458
mchi = 1e11
rho = 2.65
gap = 9.2
hbarc = 1.973269804e-5  # eV cm
alpha_em = 1/137.035999084
pref = 2/(math.pi*alpha_em*v*v*hbarc*rho)

def integrate(masses, products, n, floor):
    # Integrate in log(q); mapped omega nodes never evaluate outside source.
    qs = np.geomspace(q[0], q[-1], n+1)
    cap = np.minimum(w[-1], qs*v-qs*qs/(2*mchi))
    active = cap > floor
    qs = qs[active]; cap = cap[active]
    # Include exact onset to avoid a grid-dependent omitted triangular sliver.
    onset = 2*floor/(v+math.sqrt(v*v-2*floor/mchi))
    if q[0] < onset < q[-1]:
        qs = np.r_[onset, qs]; cap = np.r_[floor, cap]
    z = np.linspace(0, 1, n+1)
    ws = floor+(cap[:, None]-floor)*z
    pts = np.stack([ws, np.broadcast_to(qs[:, None], ws.shape)], axis=-1)
    eps = interp(pts)
    elf = eps[..., 1]/np.sum(eps**2, axis=-1)
    assert np.all(elf >= 0)
    inner = simpson(ws*elf, x=z, axis=1)*(cap-floor)
    amp = np.sum(products[None, :]/(qs[:, None]**2+masses[None, :]**2), axis=1)
    return pref*simpson(qs**4*amp**2*inner, x=np.log(qs))

rows = []
for row in json.loads(p.read_text())['rows']:
    masses = np.array(row['masses_GeV'])*1e9
    products = np.array(row['effective_alpha_products'])
    results = []
    for label, floor in [('gap_restricted_electronic', gap), ('table_floor_sensitivity_only', w[0])]:
        values = [integrate(masses, products, n, floor) for n in (256, 512, 1024)]
        drift = abs(values[-1]/values[-2]-1)
        assert drift < .01, (label, drift)
        results.append(dict(channel=label, omega_floor_eV=float(floor),
            loss_eV_per_g_cm2=values[-1], loss_eV_at_7e9=values[-1]*7e9,
            refinement_relative=drift, quadrature_values=values))
    rows.append(dict(masses_GeV=row['masses_GeV'], results=results))

# Algebraic normalization check: a complete f-sum with wp^2=4 pi alpha ne/me
# must recover the free-electron moment normalization after y=q^2 conversion.
me = 510998.95
ne = 30/(60*1.66053906892e-24)*rho
wp2 = 4*math.pi*alpha_em*ne*hbarc**3/me
from_elf = pref*(math.pi*wp2/2)/2
from_moment = 2*math.pi/(me*v*v)*(ne/rho)*hbarc**2
assert abs(from_elf/from_moment-1) < 1e-12
out = dict(status='covered_model_response_contribution_not_total_stopping',
    source_url='https://github.com/tongylin/DarkELF/blob/352149fb53b614adbac6ee242045c56be25aad29/data/SiO2/SiO2_mermin.dat',
    source_sha256=source_hash, source_shape=list(data.shape),
    missing_cell_policy='one eps2 NaN at omega=8.1 eV, q=37.2895 eV backward-filled from next source row as in upstream loader; outside kinematic support',
    q_range_eV=[float(q[0]), float(q[-1])], omega_range_eV=[float(w[0]), float(w[-1])],
    rho_g_cm3=rho, gap_eV=gap, speed_km_s=776,
    formula='2/(pi alpha_EM v^2 hbarc rho) integral dq q^3 [sum alpha_i/(q^2+m_i^2)]^2 integral dOmega Omega ELF',
    normalization_relative_error=abs(from_elf/from_moment-1), rows=rows,
    assumptions=['isotropic zero-temperature electronic linear response',
      'interpolate real and imaginary dielectric function before forming ELF',
      'same fixed mediator products; constant initial speed and chosen path column',
      'gap restriction is a channel selection, not a repair or validation of the source model'],
    limitations=['Mermin model table is not a complete measured silica response',
      'no response extrapolated beyond the tabulated momentum/energy domain',
      'below-gap table-floor result is sensitivity only; not a validated electronic channel',
      'missing electronic response, phonons, real geology and trajectory evolution',
      'no total stopping upper bound, capture efficiency, local density or R4 coherence prediction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out, indent=2)+'\n')
print(json.dumps(out, indent=2))
