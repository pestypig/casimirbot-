import math,json
from pathlib import Path
import numpy as np
from scipy.integrate import quad
from scipy.special import erfc
from numpy.polynomial.legendre import leggauss
s=1e-10/1.973269804e-7/math.sqrt(6)
den=(2-math.sqrt(2))/math.sqrt(math.pi)
gx,gw=leggauss(512);x=4*(gx+1);w=4*gw
rows=[]
for q in [0,.7141704424363171,3472.823879,1e4,1e5]:
 k=2*s*q
 result=quad(lambda y:erfc(y)**2*np.sinc(k*y/math.pi),0,8,epsabs=1e-12,limit=300)[0]/den
 independent=float(np.sum(w*erfc(x)**2*np.sinc(k*x/math.pi))/den)
 assert abs(result-independent)<1e-10
 rows.append(dict(q_eV=q,amplitude_ratio=result,cross_section_shape_ratio=result**2,
 independent_absolute_difference=abs(result-independent)))
assert abs(rows[0]['amplitude_ratio']-1)<1e-12
out=dict(status='large_gap_rigid_atom_finite_q_shape_not_coherence_rate',rows=rows,
 assumptions=['massless mediator; point nucleus; Gaussian rigid electron cloud rms 0.1 nm',
 'constant-gap propagator; no extension of forward finite-gap check claimed',
 'no atomic arrangement, medium response, flux or xenon normalization'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
