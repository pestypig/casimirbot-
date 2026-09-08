import math,json
from pathlib import Path
from scipy.integrate import quad
from scipy.special import erfc
hc=1.973269804e-7;rms=1e-10;a=(rms/hc)**2/6
exact=math.sqrt(math.pi)*(2-math.sqrt(2))
num=quad(lambda x: (-math.expm1(-x*x))**2/x**2,0,math.inf,epsabs=1e-11)[0]
real=quad(lambda x: erfc(x)**2,0,math.inf,epsabs=1e-11)[0]
assert abs(num/exact-1)<1e-10 and abs(math.pi*real/exact-1)<1e-10
rows=[]
for m in [0,1,1e3,1e5]:
 t=m*math.sqrt(a)
 value,error=quad(lambda x:x*x*(-math.expm1(-x*x))**2/(x*x+t*t)**2,0,math.inf,epsabs=1e-11)
 rows.append(dict(mediator_eV=m,integral_eV_inverse=math.sqrt(a)*value,
  minus_delta_Ueff0_over_alpha_squared_Z_squared=8*math.sqrt(a)*value))
assert all(rows[i]['integral_eV_inverse']>rows[i+1]['integral_eV_inverse'] for i in range(3))
out=dict(status='rigid_gaussian_atom_large_gap_toy_not_material_prediction',electron_rms_m=rms,
 rows=rows,analytic_relative_error=abs(num/exact-1),parseval_relative_error=abs(math.pi*real/exact-1),
 assumptions=['point nucleus plus rigid Gaussian electron density','large-gap constant propagator',
 'no target excitation, material correlations, finite nuclear radius or xenon normalization'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
