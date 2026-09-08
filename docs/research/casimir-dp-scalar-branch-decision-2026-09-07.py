"""Consolidated conditional 100 GeV benchmark, no physical admission."""
import json,hashlib,math
from pathlib import Path
b=Path(__file__).parent;refs={}
def read(stem):
 p=b/(stem+'-2026-09-07.json');refs[p.name]=hashlib.sha256(p.read_bytes()).hexdigest();return json.loads(p.read_text())
selection=read('casimir-dp-dark-scalar-selection');sphere=read('casimir-dp-dark-scalar-sphere');xe=read('casimir-dp-dark-scalar-xenon-companion');exo=read('casimir-dp-exothermic-common-rate')
r=next(x for x in selection['rows'] if x['mchi_GeV']==100);s=next(x for x in sphere['rows'] if x['mchi_GeV']==100 and x['scalar_mass_GeV']==1e-9);x=next(x for x in xe['rows'] if x['mchi_GeV']==100 and x['scalar_mass_GeV']==1e-9 and x['angle_role']=='reference');e=next(x for x in exo['rows'] if x['mchi_GeV']==100)
p=b/'casimir-dp-exothermic-common-rate-2026-09-07.py';assert hashlib.sha256(p.read_bytes()).hexdigest()=='88b9b551c88645ce49e1212751068d23ba25cf5d20ba43a351623947f0244567'
code=p.read_text().split('\nrows=[]')[0];assert code.count("F*F*h['eta']")==1
code=code.replace("F*F*h['eta']","F*F*(10000/(10000+q*q))**2*h['eta']")
n={'__file__':str(p)};exec(compile(code,str(p),'exec'),n);a=n['a'];gap=r['gap_GeV'];values=[]
for lower,upper in [(5.4e-6,269.9e-6),(200e-6,269.9e-6)]:
 total=0.
 for A,atomic,f in a['iso']:
  mass=atomic*.93149410242-54*.00051099895;lo,hi=n['limits'](100,mass,gap);lo=max(lo,lower);hi=min(hi,upper)
  if lo<hi:total+=n['rate'](100,A,54,mass,gap,lo,hi)*f*a['xe_atoms']*a['year']
 values.append(total)
scale=(2e-10)**2*(1-(2e-10)**2)/(math.sin(3e-10)*math.cos(3e-10))**2
out=dict(parameters=dict(mchi_GeV=100,gap_GeV=gap,vev_GeV=500,gchi=.1,mV_GeV=100,gB=r['tree_baryon_coupling_symmetric'],ms_GeV=1e-9,sin_theta=2e-10,prescribed_present_excited_fraction=1,halo_density_GeV_cm3=.3),predictions=dict(Xe_vector_raw_full=values[0],Xe_vector_raw_high=values[1],Xe_scalar_raw_full=x['Xe_raw_window']*scale,D_scalar_rigid_interval=s['D_reference_mixing_upper_in_qR_interval']*scale,D_exothermic_independent_carbon_upper=e['D_independent_upper'],vector_contact_full_relative_change=values[0]/e['Xe_raw_window']-1),source_hashes=refs,scope='Single explicit conditional tree benchmark. Scalar reference from corrected stellar intake, not an allowed-model claim. Present excited fraction prescribed, not demonstrated; detector and full solid response missing. Scalar interval and independent-nuclear quantities are not a certified complete total.',full_model_admitted=False)
assert 0<values[1]<values[0]<e['Xe_raw_window']
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
