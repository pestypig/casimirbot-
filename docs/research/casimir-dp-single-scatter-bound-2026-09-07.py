"""Conservative exactly-one-scatter bound in a chosen xenon slab."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-darkelf-xenon-match-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='6eaf46b926f7c93e75b6a5b4751be6995f7fc7076899b82fde11fddaf3ee1c23'
n={'__file__':str(p)};exec(p.read_text().split('# Analytic integrated')[0],n)
bp=base/'casimir-dp-coupled-attenuation-branches-2026-09-07.json'
assert hashlib.sha256(bp.read_bytes()).hexdigest()=='16e728335769bbfa142a873a44d585de38118fb5a686705517d8866246d7e9f1'
b=json.loads(bp.read_text())['rows'][1]
scale=3.9*b['cross_section_multiplier'];sigma0=3.9*b['zero_momentum_proton_cross_section_cm2']
m=100.;med=.01;muP=n['muP'];vi=n['v']
isos=[(A,n['mass'](M),M,f) for A,M,f in n['iso']]
vmin=min(math.sqrt(200e-6*ma/(2*(m*ma/(m+ma))**2)) for _,ma,_,_ in isos)
vafter=math.sqrt(vmin*vmin-2*10e-6/m)
sinmax=math.sqrt(2*max(ma for _,ma,_,_ in isos)*10e-6)/(m*vafter)
assert sinmax<1
# Momentum dot product remains positive over this domain, so select acute angle.
assert m*m*vmin*vmin>(m+max(ma for _,ma,_,_ in isos))*10e-6
ratio=n['coefficient'](5.4,10)/n['coefficient'](200,269.9)
meanmass=sum(M*f for _,_,M,f in isos)
def tau_point(v,column):
 return column/(meanmass*1.66053906892e-24)*sum(f*sigma0*54**2*((m*ma/(m+ma))/muP)**2/(1+4*(m*ma/(m+ma))**2*v*v/med**2) for _,ma,_,f in isos)
rows=[]
for column in [100,300,600]:
 for cosmin in [.9,1.]:
  cout=cosmin*math.sqrt(1-sinmax*sinmax)-math.sqrt(1-cosmin*cosmin)*sinmax
  assert cout>0
  bound=max(tau_point(vmin,column)/cosmin,tau_point(vafter,column)/cout)
  survival=math.exp(-bound)
  rows.append(dict(column_g_cm2=column,incident_cosine_min=cosmin,post_collision_cosine_min=cout,
   total_path_optical_depth_upper=bound,no_other_collision_factor_lower=survival,
   exactly_one_low_to_exactly_one_high_ratio_lower=survival*ratio))
# Numerical domain check supplements, but does not replace, analytic monotonic argument.
checks=[]
for speed in np.linspace(vmin*299792.458+1e-5,776,20):
 n['v']=speed/299792.458
 high=n['coefficient'](200,269.9);low=n['coefficient'](5.4,10)
 assert low/high>=ratio*(1-1e-10)
 checks.append(dict(speed_kms=float(speed),raw_ratio=low/high))
n['v']=vi
out=dict(status='conditional_analytic_one_collision_bound_not_LZ_exclusion',
 incident_speed_range_kms=[vmin*299792.458,776],minimum_post_low_collision_speed_kms=vafter*299792.458,
 low_keV=[5.4,10],high_keV=[200,269.9],coupling_multiplier=scale,
 initial_low_to_high_cross_section_ratio=ratio,sin_deflection_upper=sinmax,rows=rows,checks=checks,
 assumptions=['infinite transverse homogeneous xenon slab with stated finite mass column',
 'elastic stationary nuclei with same charge Helm/Born kernel','exactly one physical nuclear collision; no other channels',
 'incoming speed and direction restricted as recorded','no prior detector collisions or unresolved multiple scatters'],
 limitations=['not a bound for arbitrary geometry or accepted LZ event classes','no efficiencies or pulse response',
 'point total cross section upper-bounds Helm total only within the stipulated kernel',
 'does not establish Born validity or allowed couplings','does not fix incident subset abundance'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='checks'},indent=2))
