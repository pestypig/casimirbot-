import math,json
from pathlib import Path
from scipy.integrate import quad
from scipy.special import erfc
s=.1/math.sqrt(6);lattice=.357
J=(2-math.sqrt(2))/math.sqrt(math.pi)
F=lambda z:z*erfc(z/2)-2/math.sqrt(math.pi)*math.exp(-z*z/4)
rows=[]
for mult,dist in [(4,lattice*math.sqrt(3)/4),(12,lattice/math.sqrt(2)),(12,lattice*math.sqrt(11)/4),(6,lattice)]:
 k=dist/s
 fun=lambda x:(-math.expm1(-x*x))**2/x**3 if x else 0
 momentum=quad(fun,0,math.inf,weight='sin',wvar=k,epsabs=1e-11,limlst=200)[0]/k/(math.pi*J)
 real=quad(lambda r:erfc(r/2)*(F(r+k)-F(abs(r-k))),0,30,points=[k],epsabs=1e-12)[0]/(4*k*J)
 assert real>0 and abs(real-momentum)<1e-10
 rows.append(dict(neighbors=mult,distance_nm=dist,overlap_over_self=real,independent_difference=abs(real-momentum)))
out=dict(status='four_shell_rigid_gaussian_forward_overlap_not_full_diamond_response',rows=rows,
 amplitude_multiplier_four_shells=1+sum(r['neighbors']*r['overlap_over_self'] for r in rows),
 assumptions=['rms cloud 0.1 nm, massless mediator, constant gap','ideal bulk diamond lattice 0.357 nm',
 'four shells only, forward amplitude only; no quantum density fluctuations'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
