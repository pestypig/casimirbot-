"""Isotope-resolved baryon plus electric-charge coherent target comparison."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.linalg import eigh
from scipy.optimize import minimize_scalar
b=Path(__file__).parent;p=b/'casimir-dp-exothermic-common-rate-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='88b9b551c88645ce49e1212751068d23ba25cf5d20ba43a351623947f0244567'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
p=b/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
ref=json.loads(p.read_text());a=n['a'];r=(1/137.035999084)/(4*math.pi);rows=[]
for old in ref['rows']:
 m=old['mchi_GeV'];release=abs(old['delta_GeV']);X=np.zeros((2,2));C=np.zeros((2,2))
 for A,atomic,f in a['iso']:
  mass=atomic*.93149410242-54*.00051099895;lo,hi=n['limits'](m,mass,release);lo=max(lo,5.4e-6);hi=min(hi,269.9e-6)
  rate=0 if lo>=hi else n['rate'](m,A,54,mass,release,lo,hi)*f*a['xe_atoms']*a['year']
  v=np.array([1.,54/A]);X+=rate*np.outer(v,v)
 for A,atomic,f in [(12,12.,1-a['f13']),(13,13.00335483507,a['f13'])]:
  mass=atomic*.93149410242-6*.00051099895;lo,hi=n['limits'](m,mass,release)
  rate=n['rate'](m,A,6,mass,release,lo,hi,False)*f*a['nc']/a['f13']*a['d']['hold_time_s']
  v=np.array([1.,6/A]);C+=rate*np.outer(v,v)
 assert abs(X[0,0]/old['Xe_raw_window']-1)<1e-10
 assert abs(C[0,0]/old['C_independent_F1_events_upper']-1)<1e-7
 Xn=X/X[0,0];Cn=C/C[0,0];values,vectors=eigh(Cn,Xn)
 v=vectors[:,-1];res=np.linalg.norm(Cn@v-values[-1]*Xn@v)/np.linalg.norm(Cn@v)
 assert res<1e-10 and np.linalg.eigvalsh(Xn).min()>0
 opt=minimize_scalar(lambda z: -float(np.array([1.,z])@Cn@np.array([1.,z]))/float(np.array([1.,z])@Xn@np.array([1.,z])),bounds=(-3.,-2.),method="bounded",options={"xatol":1e-12})
 assert abs(-opt.fun/values[-1]-1)<1e-7
 tests=[]
 for sign in [-1,1]:
  u=np.array([1.,sign*r]);xf=float(u@Xn@u);cf=float(u@Cn@u)
  tests.append(dict(mixing_ratio=sign*r,proton_cross_section_over_baryon_reference=(1+sign*r)**2,xenon_factor=xf,carbon_factor=cf,carbon_factor_at_fixed_raw_xenon=cf/xf))
 rows.append(dict(mchi_GeV=m,xenon_response_matrix=X.tolist(),carbon_response_matrix=C.tolist(),benchmark_mixing=tests,max_carbon_over_xenon_enhancement=float(values[-1]),extremizing_Cmix_over_Cb=float(v[1]/v[0]),generalized_eigen_residual=float(res),max_D_at_same_raw_xenon=float(old['D_independent_upper']*values[-1])))
out=dict(operator='Cb Jdark (Jbaryon + r Jem): Cp=Cb(1+r), Cn=Cb, Ce=-Cb*r; isotope amplitude Cb(A+r Z)',scope='Momentum-independent real coherent vector charges; archived Xe Helm and carbon independent-nucleus F=1 bound. Fixed raw Xe truth-energy window, not detector likelihood or experimental exclusion. Generalized eigenvalue permits all real mixing ratios without survival/UV constraints and therefore is a permissive target-response ceiling within these approximations.',rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
