import json,hashlib,math
from pathlib import Path
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design']
q=1.973269804e-7/d['radius_m'];v=776/299792.458
# Whole-sphere mass greatly exceeds 100 GeV; use infinite-target limit.
mu=1e11
lo=-v*q-q*q/(2*mu);hi=v*q-q*q/(2*mu)
assert q<mu*v and lo<0<hi
out=dict(status='necessary_rigid_target_soft_window_not_total_decoherence_bound',
 q_soft_eV=q,delta_min_eV=lo,delta_max_eV=hi,particle_mass_eV=mu,
 assumptions=['stationary rigid sphere; no internal excitation or radiation',
 'nonrelativistic two-body scattering; splitting small compared with particle mass',
 'qR/hbar<=1 defines fully coherent window, not a hard form-factor cutoff',
 'infinite target mass approximation; 776 km/s speed cap'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
