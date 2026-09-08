"""Uniform-density optical potential using the existing matched nuclear kernel."""
from pathlib import Path
import hashlib
import json
import math
from scipy.integrate import solve_ivp

base=Path(__file__).resolve().parent
cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
raw=cfg.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(raw)['leading_design']
src=base/'casimir-dp-virtual-300-nuclear-reach-2026-09-07.json'
data=src.read_bytes();W=json.loads(data)['carbon_forward_W_GeV_minus2']
assert W<0
R=c['radius_m']/1.973269804e-16
N=c['mass_kg']/(12*1.66053906660e-27)
n=N/(4*math.pi*R**3/3)
sphere_mass=c['mass_kg']/1.7826619216279e-27
mu=100*sphere_mass/(100+sphere_mass)
z=math.sqrt(2*mu*n*abs(W))*R
# a/R = 1-tan(z)/z. Series avoids cancellation for this weak well.
a_over_R=-(z*z/3+2*z**4/15+17*z**6/315)
sol=solve_ivp(lambda x,y:[y[1],-z*z*y[0]],(0,1),(0,1),rtol=1e-12,atol=1e-14)
assert sol.success
numeric=1-sol.y[0,-1]/sol.y[1,-1]
assert abs(numeric-a_over_R)<1e-12
ratio=(math.pi/(2*z))**2
out=dict(status='conditional_uniform_sphere_no_resonance_at_matched_coupling',
         config_sha256=hashlib.sha256(raw).hexdigest(),
         nuclear_input_sha256=hashlib.sha256(data).hexdigest(),
         W_GeV_minus2=W,potential_well_depth_GeV=n*abs(W),z=z,
         scattering_length_over_R=a_over_R,numerical_absolute_error=abs(numeric-a_over_R),
         first_threshold_z=math.pi/2,W_multiplier_to_first_threshold=ratio,
         threshold_W_magnitude_GeV_minus2=abs(W)*ratio,
         formal_alpha_multiplier=math.sqrt(ratio),
         formal_perturbative_xenon_rate_multiplier=ratio**2,
         caveats=['Uniform static density and short-range local carbon kernel only',
                  'No electronic, lattice excitation or surface response',
                  'Threshold extrapolation is not an admitted model or event forecast',
                  'Original virtual-kernel matching limitations remain'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
