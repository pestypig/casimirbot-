"""Positive-propagator envelope for all mediator masses and charge ratios."""
import hashlib,json,math
from pathlib import Path
import numpy as np
b=Path(__file__).parent;p=b/'casimir-dp-exothermic-common-rate-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='88b9b551c88645ce49e1212751068d23ba25cf5d20ba43a351623947f0244567'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
p=b/'casimir-dp-exothermic-mixed-targets-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='0af391938e5ae2b456967819be1a9fa799010153ba257b93f11551c5013b5a65'
j=json.loads(p.read_text());rows=[]
for w in j['rows']:
 m=w['mchi_GeV'];d=.000248*(m+131.293*.93149410242)/m;qc=[];qx=[]
 for atomic in [12.,13.00335483507]:
  mass=atomic*.93149410242-6*.00051099895;mu=m*mass/(m+mass)
  lo,hi=n['limits'](m,mass,d);q=math.sqrt(2*mass*lo)
  independent=2*d/(math.sqrt(n['vmax']**2+2*d/mu)+n['vmax'])
  assert abs(q/independent-1)<1e-12;qc.append(q)
 for A,atomic,f in n['a']['iso']:
  mass=atomic*.93149410242-54*.00051099895;lo,hi=n['limits'](m,mass,d)
  if max(lo,5.4e-6)<min(hi,269.9e-6):qx.append(math.sqrt(2*mass*min(hi,269.9e-6)))
 qmin=min(qc);qmax=max(qx);factor=max(1.,(qmax/qmin)**4)
 scan=[((qmax*qmax+mv*mv)/(qmin*qmin+mv*mv))**2 for mv in np.r_[0,np.logspace(-6,4,101)]]
 assert max(scan)<=factor*(1+1e-12)
 rows.append(dict(mchi_GeV=m,carbon_qmin_GeV=qmin,xenon_window_qmax_GeV=qmax,max_propagator_ratio=factor,combined_charge_and_propagator_enhancement_bound=factor*w['max_carbon_over_xenon_enhancement'],D_upper_at_reference_raw_Xe=factor*w['max_D_at_same_raw_xenon']))
out=dict(scope='Nonrelativistic single common spacelike propagator 1/(q^2+mV^2), constant proton/neutron charges, existing isotope/Helm and carbon F=1 independent-nucleus approximations. All nonnegative mediator masses allowed algebraically; no total survival or detector fit claimed.',inequality='(C_m/X_m)/(C_contact/X_contact) <= ((qXe_max^2+mV^2)/(qC_min^2+mV^2))^2 <= max(1,(qXe_max/qC_min)^4)',rows=rows,checks=dict(independent_q_endpoint=True,mediator_mass_envelope_scan=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
