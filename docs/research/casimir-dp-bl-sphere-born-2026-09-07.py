"""Formal finite-sphere B-L Born signal and eikonal phase validity diagnostic."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad,simpson
from scipy.special import k0,spherical_jn
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design'];Q=6*d['mass_kg']/(12*1.66053906892e-27)
hc=1.973269804e-7;R=d['radius_m'];v=776/299792.458
p=Path(__file__).with_name('casimir-dp-bl-two-mediator-screen-2026-09-07.json');rows=[]
for r in json.loads(p.read_text())['rows']:
 ms=np.array(r['masses_GeV'])*1e9;cs=np.array(r['effective_alpha_products']);vals=[]
 for count in [32769,65537]:
  q=np.geomspace(1e-7,3472.823879,count);z=q*R/hc;F=3*spherical_jn(1,z)/z
  phase=q*d['branch_separation_m']/hc
  B=np.where(phase<1e-3,phase**2/6-phase**4/120,1-np.sinc(phase/np.pi))
  A=np.sum(cs/(q[:,None]**2+ms**2),axis=1)
  val=.003*776e5*d['hold_time_s']*8*math.pi/v**2*(hc*100)**2*Q**2*simpson(q*q*A*A*F*F*B,x=np.log(q))
  vals.append(float(val))
 assert abs(vals[-1]/vals[-2]-1)<1e-3
 chis=[];potentials=[]
 for mass,c in zip(ms,cs):
  a=mass*R/hc
  integ=quad(lambda t:t*math.sqrt(max(0,1-(t/a)**2))*k0(t),0,min(a,100),epsabs=1e-12,epsrel=1e-10)[0]/a**2
  chis.append(6*c*Q/v*integ)
  numerator=-math.expm1(-a)-a*math.exp(-a)
  potentials.append(3*c*Q*hc/R*numerator/a**2)
 rows.append(dict(masses_GeV=r['masses_GeV'],formal_Born_covered_D=vals[-1],
  grid_refinement_relative=abs(vals[-1]/vals[-2]-1),signed_central_eikonal_phase=sum(chis),
  central_potential_eV=sum(potentials),central_potential_over_incident_energy=sum(potentials)/(.5*1e11*v*v),
  small_phase_Born_diagnostic=bool(abs(sum(chis))<.1)))
out=dict(status='formal_Born_prediction_requires_phase_resummation_where_large',rows=rows,
 sphere_BL_charge=Q,kR=1e11*v*R/hc,input_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
 assumptions=['uniform sphere of neutral C12 B-L charge','fixed isotropic mono-speed source and constant branch separation','coherent continuum q<=qBZ and summed two-mediator potential'],
 limitations=['large central phase invalidates using first-order Born result as physical signal',
 'small potential/energy motivates but does not validate an eikonal calculation',
 'no external constraints, environment response, transport or completed microscopic model'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
