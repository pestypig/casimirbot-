"""Trajectory diagnostics and analytic distant-impact bound for the scalar pilot."""
from pathlib import Path
import hashlib,json,math
from scipy.special import k1
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-dark-scalar-eikonal-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='04255df34b5e281f69d659b8279451cd2272ca66b580979cdc157c732f8f82c1'
z={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),z)
n=z['n'];a=z['a'];R=n['R'];J0=z['J'][0]
deriv=max(abs(z['spline'](z['u'],1)).max(),a*k1(a)*z['ci'][-1])
rows=[]
for r in z['old']['rows']:
 if r['scalar_mass_GeV']!=1e-9:continue
 m=r['mchi_GeV'];P=r['formal_target_phase_at_300km_s'];qa=P*(300/n['ckm'])/(6*J0)
 V0=3*qa/R*(1-(1+a)*math.exp(-a))/a**2
 speeds=[]
 for vk in [10.,300.]:
  v=vk/n['ckm'];speeds.append(dict(speed_km_s=vk,kR=m*v*R,central_potential_over_kinetic_energy=V0/(m*v*v/2),sampled_max_deflection_rad=P*300/vk*deriv/J0/(m*v*R)))
 # Outside B=16, both shifted points are outside the sphere. Mean value
 # theorem and monotone K1 give |delta J| <= ci[-1]*a*sep*K1(a*(t-sep/2)).
 # 1-cos(delta chi) <= delta chi^2/2; angular integral is 2*pi.
 tail=math.pi*(P/J0*z['ci'][-1]*a*n['sep'])**2*quad(lambda t:t*k1(a*(t-n['sep']/2))**2,16,math.inf,epsabs=1e-40,epsrel=1e-10)[0]
 factor=.3/m*n['d']['hold_time_s']*(n['d']['radius_m']*100)**2*1e5*300**2*n['meaninv']/n['ckm']
 rows.append(dict(mchi_GeV=m,theta=r['formal_theta_for_target'],speed_diagnostics=speeds,distant_impact_D_bound_within_eikonal=tail*factor,speed_at_central_potential_equals_kinetic_km_s=math.sqrt(2*V0/m)*n['ckm']))
assert all(r['distant_impact_D_bound_within_eikonal']<1e-18 for r in rows)
assert all(r['speed_diagnostics'][0]['central_potential_over_kinetic_energy']<.001 for r in rows)
out=dict(rows=rows,scope='Real static 1eV Yukawa sphere. Sampled derivative diagnostic, not a rigorous exact-scattering error estimate. Tail inequality valid within the same eikonal phase model; its final integral evaluated numerically. Low-speed exact scattering and full material response unresolved.',full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
