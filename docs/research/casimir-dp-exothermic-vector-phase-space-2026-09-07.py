"""Leading heavy-dark-fermion vector decay phase space, two integration forms."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
data=json.loads(p.read_text());me=.00051099895;hbar=6.582119569e-25;age=4.35e17;r=(1/137.035999084)/(4*math.pi)
def energy(z):
    if z>=.5:return 0.
    return 30*quad(lambda x:math.sqrt(max(0,x*x-z*z))*math.sqrt(max(0,(1-x)**2-z*z))*(x*(1-x)-z*z),z,1-z,epsabs=1e-12,epsrel=1e-11)[0]
def invariant(z):
    if z>=.5:return 0.
    return 2.5*quad(lambda u:(1-u)**1.5*(math.sqrt(1-4*z*z/u)*(1+2*z*z/u) if z else 1),4*z*z,1,epsabs=1e-12,epsrel=1e-11)[0]
assert abs(energy(0)-1)<1e-12 and abs(invariant(0)-1)<1e-12
rows=[]
for w in data['rows']:
    gap=abs(w['delta_GeV']);z=me/gap;F=energy(z);F2=invariant(z)
    assert abs(F-F2)<1e-10
    C=w['C_nucleon_GeV_minus2'];gamma=C*C*r*r*gap**5*F/(60*math.pi**3)
    tau=hbar/gamma if gamma else None
    maxstrength=tau/(math.e*age) if tau else None
    rows.append(dict(mchi_GeV=w['mchi_GeV'],F_energy=F,F_invariant=F2,lifetime_s_at_reference=tau,max_present_strength_over_reference_no_replenishment=maxstrength,pair_decay_closed=F==0))
out=dict(scope='Vector contact Ce=r Cb, leading gap/mchi expansion; finite electron mass exact at this order. Other decay channels and UV momentum dependence omitted.',r=r,age_s=age,rows=rows,checks=dict(massless_limit=True,two_phase_space_forms=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
