"""Conditional NDR NLO VLL running with consistently truncated RGI factor."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import solve_ivp
import sympy as s
p=Path(__file__).with_name('casimir-dp-axion-low-qcd-evolution-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='f4110443183bf55fafdc2c775f312433b40649c3fcab69621135e46e82494738'
d={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[')[0],str(p),'exec'),d)
def constants(nf):
    b0=11-2*nf/3;b1=102-38*nf/3;g0=4.;g1=-7+4*nf/9
    return b0,b1,g0/(2*b0),g0*b1/(2*b0*b0)-g1/(2*b0)
def alpha_run(ah,high,low,nf):
    b0,b1,_,_=constants(nf)
    sol=solve_ivp(lambda t,y:[-b0*y[0]**2/(2*math.pi)-b1*y[0]**3/(8*math.pi**2)],[math.log(high),math.log(low)],[ah],rtol=1e-12,atol=1e-14)
    assert sol.success;return float(sol.y[0,-1])
def run(mu):
    ah=.108;high=162.6;leading=1.;correction=0.;ledger=[]
    for low,nf in [(4.18,5),(1.3,4),(mu,3)]:
        al=alpha_run(ah,high,low,nf);_,_,exponent,J=constants(nf)
        leading*=(ah/al)**exponent;correction+=J*(al-ah)/(4*math.pi)
        ledger.append(dict(nf=nf,high_GeV=high,low_GeV=low,alpha_high=ah,alpha_low=al,J=J))
        high=low;ah=al
    _,_,a3,J3=constants(3)
    # Expand the bracket once at NLO; do not retain products of one-loop factors.
    running=leading*(1+correction)
    rgi=leading*ah**a3*(1+correction-J3*ah/(4*math.pi))
    return dict(mu_GeV=mu,ledger=ledger,RGI_over_weak=rgi,C_RGI_imag_GeV_minus2=d['highC'].imag*rgi,C_running_imag_GeV_minus2=d['highC'].imag*running)
rows=[run(mu) for mu in [2.,3.,4.]]
# Check cancellation through alpha^2 of the RGI coefficient derivative.
alpha=s.symbols('alpha',positive=True);b0,b1,g0,g1=s.symbols('b0 b1 g0 g1');aa=g0/(2*b0);JJ=g0*b1/(2*b0*b0)-g1/(2*b0)
beta=-b0*alpha**2/(2*s.pi)-b1*alpha**3/(8*s.pi**2)
gamma=g0*alpha/(4*s.pi)+g1*alpha**2/(16*s.pi**2)
series=s.simplify(s.series(gamma+aa*beta/alpha-JJ*beta/(4*s.pi)/(1-JJ*alpha/(4*s.pi)),alpha,0,3).removeO())
checks=dict(NDR_J3=bool(abs(constants(3)[3]-307/162)<1e-12),RGI_derivative_through_NLO=bool(series==0),hadronic_scale_invariance=bool(max(abs(r['RGI_over_weak']/rows[1]['RGI_over_weak']-1) for r in rows)<1e-10))
assert all(checks.values())
out=dict(scope='NDR gamma0=4, gamma1=-7+4nf/9; two-loop alpha, expanded NLO evolution/RGI factor. Conditional on finite matching convention compatibility; no complete UV or observable claim.',rows=rows,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(dict(rows=[{k:v for k,v in r.items() if k!='ledger'} for r in rows],checks=checks),indent=2))
