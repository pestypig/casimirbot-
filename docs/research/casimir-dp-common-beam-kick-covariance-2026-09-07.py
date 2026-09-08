"""Elastic angular covariance screen, not a burst probability calculation."""
import hashlib
import json
import math
from pathlib import Path
import numpy as np

p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design']
hbc=1.973269804e-16
target_mass=d['mass_kg']/1.7826619216279e-27
particle_mass=1000.
mu=target_mass*particle_mass/(target_mass+particle_mass)
v=776/299792.458
k=mu*v
rows=[]
for label,q in [('old_toy_x1e-4',1e-4*hbc/d['branch_separation_m']),
                ('inverse_separation',hbc/d['branch_separation_m']),
                ('soft_interval_top',80*hbc/d['radius_m'])]:
    qz=q*q/(2*k)
    qt=q*math.sqrt(1-(q/(2*k))**2)
    az=np.arange(128)*2*math.pi/128
    kicks=np.array([qt*np.cos(az),qt*np.sin(az),np.full(128,qz)]).T
    assert np.max(np.abs(np.sum(kicks*kicks,axis=1)/q**2-1))<1e-12
    # Azimuthal integration recovers zero mean transverse kick.
    assert abs(kicks[:,0].mean()/q)<1e-14
    assert abs(kicks[:,1].mean()/q)<1e-14
    correlation=q*q/(4*k*k)
    rows.append(dict(label=label,q_eV=q*1e9,qparallel_eV=qz*1e9,
        pair_dot_over_single_q2=correlation,
        fractional_variance_enhancement_at_10000_hits=9999*correlation,
        formal_hits_for_order_one_variance_enhancement=1/correlation))
out=dict(status='conditional independent-azimuth common-beam covariance, not exact contrast',
    particle_mass_GeV=particle_mass,target_mass_GeV=target_mass,
    speed_kms=776,relative_momentum_GeV=k,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
