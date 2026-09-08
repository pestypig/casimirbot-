"""Conditional xenon-normalized rigid-sphere axial elastic fold."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
b=Path(__file__).parent
p=b/'casimir-dp-exothermic-common-rate-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='88b9b551c88645ce49e1212751068d23ba25cf5d20ba43a351623947f0244567'
s=p.read_text().split('\nrows=[]')[0];assert s.count("F*F*h['eta']")==1
s=s.replace("F*F*h['eta']","F*F*prop(q)*h['eta']")
n={'__file__':str(p),'prop':lambda q:1.};exec(compile(s,str(p),'exec'),n)
p=b/'casimir-dp-axial-elastic-kernel-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='f394c3292816f6a810f05adb2ba45597dfb012d359a4e9372463d918db79c22d'
audit=json.loads(p.read_text());base=json.loads((b/'casimir-dp-exothermic-common-rate-2026-09-07.json').read_text())
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design'];R=d['radius_m']/1.973269804e-16;Q=d['mass_kg']/1.66053906892e-27;sep=d['branch_separation_m']/d['radius_m'];a=n['a'];halo=n['halo'];h=n['h'];ckm=n['ckm']
meanv=quad(lambda v:h['pdf'](v,*halo)*v/ckm,0,sum(halo[1:]),epsabs=1e-12)[0]
meaninv=quad(lambda v:h['pdf'](v,*halo)*ckm/v if v else 0.,0,sum(halo[1:]),epsabs=1e-8)[0]
def F(x):return 1-x*x/10+x**4/280 if x<1e-3 else 3*(math.sin(x)-x*math.cos(x))/x**3
def loss(x):return x*x/6-x**4/120+x**6/5040 if x<1e-3 else 1-math.sin(x)/x
rows=[]
for old,pilot in zip(base['rows'],audit['rows']):
 m=old['mchi_GeV']
 if m not in [40.,100.]:continue
 release=abs(old['delta_GeV']);mus=m*(Q*.93149410242)/(m+Q*.93149410242)
 for mv in [1.,.01,.001,1e-6,1e-9]:
  qref=.2;n['prop']=lambda q:((qref*qref+mv*mv)/(q*q+mv*mv))**2
  xe=0.
  for A,atomic,f in a['iso']:
   mass=atomic*.93149410242-54*.00051099895;lo,hi=n['limits'](m,mass,release);lo=max(lo,5.4e-6);hi=min(hi,269.9e-6)
   if lo<hi:xe+=n['rate'](m,A,54,mass,release,lo,hi)*f*a['xe_atoms']*a['year']
  xf=xe/old['Xe_raw_window'];CAref=pilot['CA_GeV_minus2']/math.sqrt(xf)
  def integrand(logx):
   x=math.exp(logx);q=x/R
   return 2*x*x/R**2*F(x)**2*loss(x*sep)*n['prop'](q)
  values=[quad(integrand,math.log(1e-8),math.log(cut),epsabs=0,epsrel=1e-8,limit=500)[0] for cut in [40.,80.]]
  pref=.3/m*d['hold_time_s']*2.99792458e10*.3893793721e-27*CAref**2*Q**2/(4*math.pi)
  upper=pref*meanv*values[1]
  # At every qR<=80 the missing velocity term is bounded by this fraction.
  relative_bracket=(80/R)**2/(4*mus**2)*meaninv/meanv
  rows.append(dict(mchi_GeV=m,mediator_GeV=mv,xenon_propagator_factor_at_qref=xf,D_rigid_qR_80_upper=upper,D_rigid_qR_80_lower=upper*(1-relative_bracket),velocity_bracket_fraction=relative_bracket,cutoff_40_over_80=values[0]/values[1],real_vector_decay_open=mv<release))
out=dict(scope='Conditional Born rigid-spin-zero sphere, orientation-averaged branch separation, qR 1e-8..80 only. Same raw Xe reference count at each mediator mass. Total elastic density .3 GeV/cm3 and excited fraction1 assumed; no survival/production closure, no full solid response or Born-validity claim. Pure baryon target charges at this order; kinetic-mixing charge corrections omitted.',rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
