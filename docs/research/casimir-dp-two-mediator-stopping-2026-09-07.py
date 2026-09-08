"""Two-mediator elastic energy-loss moments in a specified silica path column."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
d=json.loads(p.read_text());v=776/299792.458;K=.5*100*v*v;conv=.3893793721e-27
rows=[]
for r in d['rows']:
 masses=np.array(r['masses_GeV']);alpha=np.array(r['effective_alpha_products']);a=masses*masses
 tau=0.;loss=0.;absolute_loss=0.;checks=[]
 for A,Z,mult in [(28,14,1),(16,8,2)]:
  ma=A*.93149410242;mu=100*ma/(100+ma);Y=4*mu*mu*v*v
  J0=np.zeros((2,2));J1=J0.copy()
  for i in range(2):
   for j in range(2):
    if i==j:
     J0[i,j]=1/a[i]-1/(Y+a[i]);J1[i,j]=math.log1p(Y/a[i])+a[i]/(Y+a[i])-1
    else:
     J0[i,j]=math.log((Y+a[i])*a[j]/((Y+a[j])*a[i]))/(a[j]-a[i])
     J1[i,j]=(a[j]*math.log1p(Y/a[j])-a[i]*math.log1p(Y/a[i]))/(a[j]-a[i])
  pref=4*math.pi*Z*Z/v**2*conv;number=mult/(60*1.66053906892e-24)
  sigma=pref*float(alpha@J0@alpha);moment=pref*float(alpha@J1@alpha)/(2*ma)
  absolute=pref*float(abs(alpha)@J1@abs(alpha))/(2*ma)
  assert sigma>0 and 0<moment<=absolute
  lower=math.log(min(a)*1e-12)
  numerical=quad(lambda t:math.exp(2*t)*sum(alpha/(math.exp(t)+a))**2,lower,math.log(Y),epsabs=1e-40,epsrel=1e-9)[0]*pref/(2*ma)
  assert abs(moment/numerical-1)<1e-7
  tau+=number*sigma;loss+=number*moment;absolute_loss+=number*absolute
  checks.append(dict(A=A,relative_moment_error=abs(moment/numerical-1)))
 columns=[]
 for X in [4e5,7e9]:
  # |F_n-F_e|<=2 for normalized rigid charge profiles gives factor four;
  # while v>=vi/sqrt(2), inverse-v^2 gives another factor two with upper endpoint frozen.
  probability_bound=min(1,8*absolute_loss*X/(K/2))
  columns.append(dict(path_column_g_cm2=X,point_collision_mean_at_initial_speed=tau*X,
   first_order_point_mean_loss_keV=loss*X*1e6,first_order_fractional_loss=loss*X/K,
   conditional_probability_bound_to_lose_half_energy_within_path_column=probability_bound))
 rows.append(dict(masses_GeV=masses.tolist(),collision_coefficient_per_column=tau,energy_loss_GeV_per_column=loss,absolute_sum_energy_loss_GeV_per_column=absolute_loss,columns=columns,checks=checks))
out=dict(status='conditional_elastic_path_budget_not_earth_capture',initial_speed_kms=776,initial_kinetic_energy_keV=K*1e6,rows=rows,
 checks=['normalization receipt hash','positive moments','analytic versus log-quadrature moment'],
 limitations=['chosen silica composition and path budgets, not actual geology','point nuclear collision means omit screening','rigid-neutral bound excludes inelastic electronic/material channels','path column is integrated along trajectory, not vertical depth','no slow distribution, diffusion or capture rate'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
