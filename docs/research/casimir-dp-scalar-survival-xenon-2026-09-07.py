"""Leading PS-scalar transition Xe rate and no-replenishment envelope."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
b=Path(__file__).parent;p=b/'casimir-dp-exothermic-common-rate-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='88b9b551c88645ce49e1212751068d23ba25cf5d20ba43a351623947f0244567'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
p=b/'casimir-dp-scalar-transition-lifetime-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='a7aa2e7186204c906e0fef1d901cac3cdaafd5ab45ca7304bb9b778ecd3fd38e'
decay=json.loads(p.read_text());a=n['a'];h=n['h'];halo=n['halo'];ckm=n['ckm'];ms=1e-9;mn=.939;rows=[]
for r in decay['rows']:
 m=r['mchi_GeV'];gap=r['gap_GeV'];M=m+gap
 def rate_window(lower,upper):
  total=0.
  for A,atomic,f in a['iso']:
   mass=atomic*.93149410242-54*.00051099895;mu=M*mass/(M+mass)
   lo,hi=n['limits'](M,mass,gap);lo=max(lo,lower);hi=min(hi,upper)
   if lo>=hi:continue
   def kernel(E):
    q=math.sqrt(2*mass*E);vm=abs(mass*E/mu-gap)/q*ckm
    F=n['n']['form'](q,A)
    # Unit g12*gN; gA=gN*mass/mn. Leading heavy-target scalar current.
    return mass*(mass/mn)**2*F*F*(gap*gap+q*q)/(8*math.pi*M*M*(q*q+ms*ms)**2)*h['eta'](vm,*halo)
   total+=f*quad(kernel,lo,hi,epsabs=0,epsrel=1e-9,points=[mu*gap/mass] if lo<mu*gap/mass<hi else None)[0]
  return total*a['conv']*.3/M*ckm**2*1e5*a['xe_atoms']*a['year']
 full=rate_window(5.4e-6,269.9e-6);high=rate_window(200e-6,269.9e-6)
 # f0<=1, x=g12^2, f=x-independent initial population times exp(-A*x).
 # max x exp(-A*x)=1/(e*A)=g_lifetime_age^2/e.
 surviving_g2=r['g_for_lifetime_equal_reference_age']**2/math.e
 caps=[]
 for cap in [1.,math.sqrt(4*math.pi),4*math.pi]:
  caps.append(dict(assumed_gN_cap=cap,max_raw_Xe_window=full*surviving_g2*cap*cap,max_raw_Xe_high=high*surviving_g2*cap*cap))
 rows.append(dict(mchi_GeV=m,unit_coupling_raw_Xe_window=full,unit_coupling_raw_Xe_high=high,survival_optimized_g12_squared_times_fraction=surviving_g2,assumed_caps=caps,gN_for_one_raw_window_event_at_survival_optimum=math.sqrt(1/(full*surviving_g2))))
 assert 0<high<full
out=dict(scope='Physical g12 ubar i gamma5 u, scalar target gA=gN*mA/.939GeV. 1eV mediator. Leading nonrelativistic kinematics and Helm mass-charge proxy. Prescribed halo and .3GeV/cm3 total density. No detector acceptance, source, transport, external fit or force exclusion. Coupling caps are declared diagnostics, not measured bounds or rigorous perturbativity criteria.',rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
