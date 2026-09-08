"""Formal zero-temperature charge-density f-sum stopping envelope."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
d=json.loads(p.read_text());v=776/299792.458;m=100.;me=.00051099895;K=.5*m*v*v
charge_mass_per_gram=(30/me+14**2/(28*.93149410242)+2*8**2/(16*.93149410242))/(60*1.66053906892e-24)
def moment(Y,a,c):
 J=np.empty((2,2))
 for i in range(2):
  for j in range(2):
   if i==j:J[i,j]=math.log1p(Y/a[i])+a[i]/(Y+a[i])-1
   else:J[i,j]=(a[j]*math.log1p(Y/a[j])-a[i]*math.log1p(Y/a[i]))/(a[j]-a[i])
 return float(c@J@c)
rows=[]
for r in d['rows']:
 a=np.array(r['masses_GeV'])**2;c=np.array(r['effective_alpha_products']);Y=(2*m*v)**2
 I=moment(Y,a,c);Ia=moment(Y,a,abs(c))
 num=quad(lambda t:math.exp(2*t)*sum(c/(math.exp(t)+a))**2,math.log(min(a)*1e-12),math.log(Y),epsabs=1e-40,epsrel=1e-10)[0]
 assert abs(I/num-1)<1e-7 and 0<I<=Ia
 pref=2*math.pi/v**2*charge_mass_per_gram*.3893793721e-27
 rows.append(dict(masses_GeV=r['masses_GeV'],initial_stopping_upper_GeV_per_column=pref*I,
  absolute_amplitude_stopping_upper_GeV_per_column=pref*Ia,
  columns=[dict(path_column_g_cm2=X,initial_speed_upper_loss_keV=X*pref*I*1e6,
   half_energy_loss_probability_upper=min(1,2*pref*Ia*X/(K/2))) for X in [4e5,7e9]],
  fraction_of_formal_moment_from_q_above_electron_mass=1-moment(me*me,a,c)/I,
  log_quadrature_relative_error=abs(I/num-1)))
out=dict(status='conditional_nonrelativistic_zero_temperature_fsum_envelope',initial_energy_keV=K*1e6,qmax_GeV=2*m*v,rows=rows,
 assumptions=['Born coupling to total nonrelativistic charge density','isotropic target in ground state','coordinate-dependent target interactions and standard kinetic terms','all 30 electrons per silica formula included','fixed integrated path-column budget'],
 limitations=['upper bound not realized stopping rate','no material static response supplied','large-q nonrelativistic target validity must be assessed','finite-temperature positive-frequency response not bounded by zero-temperature identity alone','no Earth capture or local-density prediction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
