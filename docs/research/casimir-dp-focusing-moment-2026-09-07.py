"""Collisionless isotropic focusing check for the closure inverse-speed moment."""
import json,math
from pathlib import Path
from scipy.integrate import quad
n=.003;u=776.;u0=220.;rows=[]
for escape in [0.,11.2,42.1,600.]:
 speed=math.sqrt(u*u+escape*escape);density=n*speed/u
 assert abs((density/speed)/(n/u)-1)<1e-14
 def F(v):return n/(math.pi**1.5*u0**3)*math.exp(-(v*v-escape*escape)/u0**2)
 measured=4*math.pi*quad(lambda v:v*F(v),escape,escape+20*u0,epsabs=1e-15,epsrel=1e-11)[0]
 reference=2*n/(math.sqrt(math.pi)*u0)
 assert abs(measured/reference-1)<1e-9
 rows.append(dict(chosen_escape_speed_km_s=escape,mono_local_speed_km_s=speed,
  mono_density_enhancement=density/n,inverse_speed_moment_ratio=(density/speed)/(n/u),
  Maxwell_numerical_ratio=measured/reference))
out=dict(status='idealized_collisionless_focusing_identity',rows=rows,
 assumptions=['stationary isotropic distribution at infinity in the potential rest frame',
 'static spherical transparent gravitational potential with all unbound trajectories populated',
 'nonrelativistic particle kinematics and no absorption or energy-changing collisions'],
 interpretation='4 pi integral_v_escape^infty v F_infinity(sqrt(v^2-v_escape^2)) dv = 4 pi integral_0^infty u F_infinity(u) du',
 limitations=['not a moving-laboratory anisotropic halo simulation','not a capture or thermalization model',
 'escape speeds are diagnostic choices, not a fitted site potential','actual recoil rates can change even when the inclusive inverse-speed bound is invariant'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
