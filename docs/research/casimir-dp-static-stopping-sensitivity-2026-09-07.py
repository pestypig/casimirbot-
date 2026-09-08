"""Sensitivity of an electronic stopping envelope to static-response continuation."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
d=json.loads(p.read_text());m=100.;v=776/299792.458;me=.00051099895;wp=30e-9;Y=(2*m*v)**2
ne_per_gram=30/(60*1.66053906892e-24);pref=2*math.pi/(me*v**2)*ne_per_gram*.3893793721e-27
rows=[]
for r in d['rows']:
 a=np.array(r['masses_GeV'])**2;c=np.array(r['effective_alpha_products']);models=[]
 for label,freeze in [('fsum_only',None),('unchecked_qminus4',math.inf),('freeze_at_200keV',.0002),('freeze_at_100keV',.0001)]:
  def integrand(t):
   y=math.exp(t);q=math.sqrt(y);omega=max(0,q*v-y/(2*m));factor=1.
   if label!='fsum_only':
    qr=min(q,freeze)
    epsminus=4*me*me*wp*wp/qr**4
    static=epsminus/(1+epsminus)
    factor=min(1,omega*omega/wp**2*static)
   assert 0<=factor<=1
   return y*y*sum(c/(y+a))**2*factor
  lo=math.log(min(a)*1e-12);hi=math.log(Y)
  value=quad(integrand,lo,hi,epsabs=1e-40,epsrel=1e-8,limit=300)[0]
  refined=quad(integrand,lo,hi,epsabs=1e-41,epsrel=1e-9,limit=500)[0]
  assert abs(value/refined-1)<1e-5
  models.append(dict(model=label,formal_initial_speed_electronic_envelope_keV_at_7e9=refined*pref*7e9*1e6,integration_refinement=abs(value/refined-1)))
 assert all(z['formal_initial_speed_electronic_envelope_keV_at_7e9']<=models[0]['formal_initial_speed_electronic_envelope_keV_at_7e9']*(1+1e-8) for z in models)
 previous=json.loads(p.with_name('casimir-dp-charge-fsum-stopping-2026-09-07.json').read_text())
 prior=next(z for z in previous['rows'] if z['masses_GeV']==r['masses_GeV'])
 ratio=(30/me)/(30/me+14**2/(28*.93149410242)+2*8**2/(16*.93149410242))
 expected=prior['columns'][1]['initial_speed_upper_loss_keV']*ratio
 assert abs(models[0]['formal_initial_speed_electronic_envelope_keV_at_7e9']/expected-1)<1e-8
 rows.append(dict(masses_GeV=r['masses_GeV'],models=models))
out=dict(status='illustrative_static_response_sensitivity_not_material_bound',plasma_frequency_eV=30,rows=rows,
 factor='min[1,omega_max(q)^2/omega_p^2 * (1-1/epsilon_model(q,0))]',
 assumptions=['zero-temperature isotropic electronic response','trial epsilon-1=4 me^2 omega_p^2/q^4, optionally frozen','same summed mediator products and diagnostic electron count per gram'],
 limitations=['trial response is not silica data or the papers DFT curve','unchecked q^-4 continuation is outside nonrelativistic validity at high momentum','plateau is an assumption, not a rigorous relativistic envelope','no capture probability, finite-temperature response, or supplied population'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
