from pathlib import Path
import math,json,hashlib
from scipy.special import k0
from scipy.optimize import brentq
from scipy.integrate import quad
root=Path(__file__).resolve().parent;cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json');assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(cfg.read_text())['leading_design'];src=root/'casimir-dp-virtual-300mev-candidate-2026-09-07.json';p=json.loads(src.read_text())['candidate'];N=c['mass_kg']/(12*1.6605390666e-27);C=2*p['effective_alpha']*12*N/(776/299792.458)
s=brentq(lambda x:math.log(k0(x))-math.log(math.sqrt(2)/C),1e-8,100);assert abs(C*k0(s)/math.sqrt(2)-1)<1e-10
R=c['radius_m'];fluence=.3/p['dark_mass_GeV']*776e5*c['hold_time_s']*1e4;rows=[]
for med in [1.,10.,100.,p['mediator_GeV']*1e9]:
 lam=1.973269804e-7/med;B=R+lam*s
 def tail(limit):return 4*math.pi*lam*quad(lambda y:(R+lam*(s+y))*(C*k0(s+y))**2,0,limit,epsabs=1e-30,epsrel=1e-10)[0]
 t60=tail(60);t100=tail(100);assert abs(t60/t100-1)<1e-8
 # K0(s+y)<=K0(s) exp(-y), from its positive integral representation.
 remainder=4*math.pi*lam*C*C*k0(s)**2*math.exp(-200)*((R+lam*(s+100))/2+lam/4)
 rows.append(dict(mediator_eV=med,split_radius_m=B,D_interior_bound=fluence*4*math.pi*B*B,D_tail_bound=fluence*(t100+remainder),D_total_bound=fluence*(4*math.pi*B*B+t100+remainder)))
out=dict(status='conditional_yukawa_eikonal_support_plus_tail_bound',C=C,split_s=s,candidate_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),rows=rows,assumptions=['all source charges localized within frozen radius','absolute charge sum 12 per carbon; no neutrality cancellation credited','same fixed coupling envelope for illustrative mass variants, not new xenon fits','straight-line static Yukawa eikonal description'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
