"""Thermal vector recycling: optimistic coupling-cap/detailed-balance screen."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
b=Path(__file__).parent;p=b/'casimir-dp-real-vector-survival-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='54747aaf8ba502583dcc42fe19680cafc9d458dfba337f5b1bf7038fb36dac38'
j=json.loads(p.read_text());hc=1.973269804e-14;cap=4*math.pi;rows=[]
def integral(z,upper):return quad(lambda y:y*y*math.hypot(y,z)/math.expm1(math.hypot(y,z)) if y or z else 0.,0,upper,epsabs=1e-11,epsrel=1e-10,points=[.01,.1,1.,10.])[0]
assert abs(integral(0.,150)/(math.pi**4/15)-1)<1e-10
for w in j['rows']:
 if w['mediator_GeV']>1e-6:continue
 P=w['required_transition_times_gB'];x=(cap*cap/P)**2
 T=w['gap_GeV']/math.log(x-1);occ=1/math.expm1(w['gap_GeV']/T);fraction=occ/(1+2*occ)
 assert abs(x*fraction-1)<1e-12
 # Equal degeneracies: spontaneous+stimulated downward flow balances absorption.
 assert abs(((1-fraction)*occ)/(fraction*(1+occ))-1)<1e-12
 z=w['mediator_GeV']/T;I=integral(z,150);assert abs(integral(z,100)/I-1)<1e-10
 rho=T**4*I/(2*math.pi**2*hc**3)
 rows.append(dict(mchi_GeV=w['mchi_GeV'],mediator_GeV=w['mediator_GeV'],max_squared_product_scale=x,min_bath_temperature_keV=T*1e6,required_excited_fraction=fraction,required_resonant_occupation=occ,min_one_polarization_energy_density_GeV_cm3=rho,ratio_to_frozen_local_DM_density=rho/.3))
out=dict(scope='Stationary homogeneous thermal bath with zero chemical potential; equal internal degeneracies, leading recoil-free detailed balance; both g12 and gB capped at4pi. One populated polarization gives conservative thermal-energy comparison. Not a nonthermal-spectrum or transport exclusion; no full gauge/thermalization model.',balance='f*=nV/(1+2nV)=1/(1+exp(gap/T)); S=x f*=1 requires T=gap/log(x-1), x>2.',rows=rows,checks=dict(balance=True,blackbody_integral=True,integration_cutoff=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
