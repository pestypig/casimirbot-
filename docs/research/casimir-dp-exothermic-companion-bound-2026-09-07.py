"""Conditional independent-carbon second-Born potential bound; not full matching."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
root=Path(__file__).resolve().parents[2]
p=root/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(p.read_text()); d=c['leading_design']
m=45.; M=12*.93149410242; mu=m*M/(m+M); v=798/299792.458
gap=.001; med=1.; P=1.7e-17; alpha=1/137.035999084; Z=6
N=d['mass_kg']/(12*1.66053906892e-27); E=mu*v*v/2
assert E<gap
# L2 convolution norm of 4 pi alpha_eff Z/(k^2+med^2), stripping alpha_eff^2 Z^2.
norm=quad(lambda k:8*k*k/(k*k+med*med)**2,0,math.inf)[0]
assert abs(norm/(2*math.pi/med)-1)<1e-10
# Zero-external-momentum resolvent check, stripping alpha_eff^2 Z^2.
numeric=quad(lambda k:8*k*k/((k*k+med*med)**2*(gap+k*k/(2*mu))),0,math.inf)[0]
exact=4*math.pi*mu/(med*(med+math.sqrt(2*mu*gap))**2)
assert abs(numeric/exact-1)<1e-10
rows=[]
for f in [.5,.0062,1e-6]:
    W=2*math.pi*alpha*P*Z**2/(f*med*(gap-E))
    sig=mu*mu*W*W/math.pi*.3893793721e-27
    D=2*(1-f)*.3/m*798e5*N*d['hold_time_s']*sig
    rows.append(dict(excited_fraction=f,W_upper_GeV_minus2=W,D_independent_carbon_upper=D))
out=dict(status='conditional_second_Born_potential_bound',maximum_relative_kinetic_energy_GeV=E,
    rows=rows,norm_relative_error=abs(norm/(2*math.pi/med)-1),
    zero_momentum_resolvent_relative_error=abs(numeric/exact-1),
    scope='Ground-state incident particles, independent free carbon nuclei, NR Yukawa potential second Born only; no complete field-theory or solid matching')
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
