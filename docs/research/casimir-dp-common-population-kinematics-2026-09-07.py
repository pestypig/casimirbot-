"""Same-speed elastic Xe-capable subpopulation; no bound on slow companions."""
import hashlib
import json
import math
from pathlib import Path
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design']
mA=122.; sphere=d['mass_kg']/1.7826619216279e-27
hbc=1.973269804e-16
qxe=math.sqrt(2*mA*248e-6)
vmax=794.2/299792.458
mu_required=qxe/(2*vmax)
mmin=mu_required*mA/(mA-mu_required)
assert abs(2*(mmin*mA/(mmin+mA))**2*vmax**2/mA/248e-6-1)<1e-12
rows=[]
for label,q in [('inverse_separation',hbc/d['branch_separation_m']),('soft_interval_top',80*hbc/d['radius_m'])]:
    cap=(q/qxe)**2
    # mu_sphere >= mu_Xe, so k_sphere >= q_Xe/2 for Xe-capable speeds.
    for mass in [mmin,100,1000,1e8,1e14]:
        mux=mass*mA/(mass+mA); mus=mass*sphere/(mass+sphere)
        speed=qxe/(2*mux)
        actual=q*q/(4*(mus*speed)**2)
        assert actual<=cap*(1+1e-12)
    rows.append(dict(label=label,q_eV=q*1e9,pair_covariance_upper=cap,
        fractional_second_moment_enhancement_upper_N10000=9999*cap,
        formal_hits_for_unit_enhancement=1/cap))
out=dict(status='kinematic screen of same-speed elastic Xe-capable population only',
    representative_Xe_mass_GeV=mA,recoil_keV=248,qxe_GeV=qxe,
    conditional_halo_vmax_kms=794.2,minimum_elastic_particle_mass_GeV=mmin,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
