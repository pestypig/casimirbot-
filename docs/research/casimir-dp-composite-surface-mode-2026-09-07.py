"""Conditional quadrupole response and kinematics; no fitted excitation gap."""
import json
import math
from pathlib import Path
from scipy.special import spherical_jn

M, N, mbar = 1e5, 1e4, 10.
R = (9*math.pi*M/(4*mbar**4))**(1/3)
ell = 2
mass_density = 3*M/(4*math.pi*R**3)
B = mass_density*R**5/ell
qxe = math.sqrt(2*122*248e-6)
qsoft = 1.973269804e-16/2.5e-7
mu = M*122/(M+122)
vmax = 794.2/299792.458
rows=[]
for gap_keV in [28.,100.,248.]:
    gap = gap_keV*1e-6
    eps = 1/math.sqrt(2*B*gap)
    sigma = gap**2*R**3*mass_density/(ell*(ell+2)*(ell-1))
    assert math.isclose(math.sqrt(ell*(ell+2)*(ell-1)*sigma/(R**3*mass_density)),gap)
    f2 = 9/(4*math.pi)*(2*ell+1)*eps**2*spherical_jn(ell,qxe*R)**2
    rows.append(dict(gap_keV=gap_keV, epsilon=eps,
        surface_tension_GeV3=sigma, epsilon_qxe_R=eps*qxe*R,
        normalized_one_mode_family_F2_xe=f2,
        normalized_elastic_F2_xe=(3*spherical_jn(1,qxe*R)/(qxe*R))**2,
        vmin_248keV_kms=(122*248e-6/mu+gap)/qxe*299792.458,
        necessary_q_min_excitation_GeV=gap/vmax,
        max_energy_at_soft_q_eV=qsoft*vmax*1e9,
        soft_excitation_kinematically_forbidden=(qsoft*vmax<gap)))
out=dict(status='hypothetical gaps determine tension and amplitude; no microscopic spectrum or rate',
    M_GeV=M,N=N,mean_mass_GeV=mbar,R_GeVinv=R,l=ell,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
