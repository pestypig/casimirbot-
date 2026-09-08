"""Two-body vector emission combined with xenon-required coupling product."""
import hashlib,json,math
from pathlib import Path
import sympy as sy
from scipy.optimize import minimize_scalar
b=Path(__file__).parent
p=b/'casimir-dp-axial-sphere-fold-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='d172da8fadf850625d96940b8c7d537e5660eb94c9b463af550a068da3cacf43'
fold=json.loads(p.read_text())
p=b/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
ref={w['mchi_GeV']:w for w in json.loads(p.read_text())['rows']}
M,m,v=sy.symbols('M m v',positive=True)
# Contract the spin-averaged vector tensor with -g+q q/v^2.
pP=(M*M+m*m-v*v)/2;pq=(M*M-m*m-v*v)/2;Pq=(M*M-m*m+v*v)/2
contracted=2*pP-6*m*M+4*pq*Pq/(v*v)
factorized=((M-m)**2-v*v)*((M+m)**2+2*v*v)/(v*v)
assert sy.simplify(contracted-factorized)==0

def width_per_g2(m,d,v):
 if v>=d:return 0.
 M=m+d
 return math.sqrt((d*d-v*v)*((M+m)**2-v*v))*(d*d-v*v)*((M+m)**2+2*v*v)/(16*math.pi*M**3*v*v)
assert width_per_g2(40.,.001,.001)==0
rows=[]
for w in fold['rows']:
 m=w['mchi_GeV'];v=w['mediator_GeV'];d=abs(ref[m]['delta_GeV'])
 product=ref[m]['C_nucleon_GeV_minus2']*(.04+v*v)/math.sqrt(w['xenon_propagator_factor_at_qref'])
 k=width_per_g2(m,d,v);caps=[]
 for cap in [math.sqrt(4*math.pi),4*math.pi]:
  gmin=product/cap;tau=6.582119569e-25/(k*gmin*gmin) if k else None
  maxS=tau/(math.e*4.35e17) if tau else None
  if k:
   opt=minimize_scalar(lambda z:-z*math.exp(-z),bounds=(.01,10),method='bounded')
   assert abs((-opt.fun)*math.e-1)<1e-10
  caps.append(dict(gB_cap=cap,min_transition_coupling=gmin,max_partial_lifetime_s_at_reference=tau,max_present_Xe_strength_over_reference_no_replenishment=maxS))
 rows.append(dict(mchi_GeV=m,mediator_GeV=v,gap_GeV=d,required_transition_times_gB=product,real_vector_decay_open=bool(k),coupling_caps=caps))
out=dict(scope='Physical off-diagonal vector vertex g12; leading scattering normalization retained, exact two-body mass kinematics. Constant primordial population with no replenishment, f0<=1, selected coupling caps are assumptions not experimental bounds. Other decay modes can reduce lifetimes.',width='g12^2 sqrt((gap^2-mV^2)*((M+m)^2-mV^2))*(gap^2-mV^2)*((M+m)^2+2mV^2)/(16 pi M^3 mV^2)',population='At fixed mediator and gB cap, tau_max(x)=tau_ref/x, S<=x exp(-age*x/tau_ref), max S=tau_ref/(e age).',rows=rows,checks=dict(symbolic_spin_tensor_contraction=True,threshold_closure=True,numerical_population_maximum=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
