"""Defined off-diagonal Dirac vector decay; finite electron-mass phase space."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-strong-transport-visible-screen-2026-09-07.json'
a=json.loads(p.read_text())['rows'][1]['effective_alpha_product']
def width(m1,m2,ma,me,product=a):
    delta=m2-m1;S=m2+m1
    if delta<=2*me:return 0.
    def integrand(s):
        lam=(delta*delta-s)*(S*S-s)
        beta=math.sqrt(max(0,1-4*me*me/s)) if me else 1.
        return math.sqrt(max(0,lam))*(delta*delta-s)*(S*S+2*s)*beta*(1+2*me*me/s)/(ma*ma-s)**2
    lo=4*me*me;hi=delta*delta
    val=quad(lambda u:integrand(lo+(hi-lo)*u),0,1,epsabs=1e-30,epsrel=1e-10)[0]*(hi-lo)
    return product**2/(12*math.pi*m2**3)*val
m1,m2,ma,me=.003,.006,.01,.00051099895
gamma=width(m1,m2,ma,me);proper=1.973269804e-16/gamma
EA=50.;boost=EA/ma;betaA=math.sqrt(1-1/boost**2)
Estar=(ma*ma+m2*m2-m1*m1)/(2*ma)
pstar=math.sqrt(Estar*Estar-m2*m2)
Emin=boost*(Estar-betaA*pstar);gmin=Emin/m2
min_length=proper*math.sqrt(gmin*gmin-1)
P10=-math.expm1(-10/min_length)
heavy=width(1,1.001,.1,0)
reference=4*a*a*.001**5/(15*math.pi*.1**4)
ratio=heavy/reference
assert abs(ratio-1)<.003
assert width(.003,.004,.01,me)==0
assert gamma<width(m1,m2,ma,0)
out=dict(status='conditional_semivisible_benchmark_lifetime',
    interaction='gD A_mu (eta1_bar gamma^mu eta2 + h.c.) + epsilon e A_mu e_bar gamma^mu e',
    product=a,masses_GeV=dict(eta1=m1,eta2=m2,mediator=ma,electron=me),
    width_GeV=gamma,proper_decay_length_m=proper,chosen_parent_energy_GeV=EA,
    minimum_daughter_energy_GeV=Emin,minimum_lab_decay_length_m=min_length,
    maximum_decay_probability_within_chosen_10m=P10,
    checks=dict(heavy_small_gap_massless_ratio=ratio,closed_threshold=True,electron_mass_suppression=True),
    source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
    limitations=['Specific added light-sector vector transition, not full gauge completion',
      '50 GeV parent and 10 m flight distance are diagnostic choices, not authenticated NA64 acceptance',
      'Tree three-body width with off-shell propagator; no extra decay channels',
      'No cosmology or new local coherence prediction','No exclusion of all semivisible models'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
