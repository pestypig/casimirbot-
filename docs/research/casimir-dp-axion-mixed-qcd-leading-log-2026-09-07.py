"""Selected six-flavour leading-log QCD evolution; not a complete eta_tT."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import solve_ivp
p=Path(__file__).with_name('casimir-dp-axion-mixed-box-matching-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='96d041e242800bab74079682bcd976eb3c349dc92404c00f1ade812b6289ce0f'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[];scale_errors=[]')[0],str(p),'exec'),n)
low=162.6;F=float(n['H1'](n['x'],n['m'].mpf(str(low)))+n['H2'](n['x'],n['m'].mpf(str(low))))
def evaluate(M,a):
    L=math.log(M/low);c=7*a/(2*math.pi);logr=-math.log1p(c*L);r=math.exp(logr)
    hard=-1.5*r**(10/7)
    source=-4*math.pi/(3*a)*math.expm1(3*logr/7)
    total=hard+source+F;bare=-1.5+2*L+F
    def rhs(t,z):
        at=a/(1+c*t);k=(at/a)**(8/7)
        return [4*at/(4*math.pi)*z[0]-2*k]
    sol=solve_ivp(rhs,[L,0],[-1.5*r**(8/7)],rtol=1e-11,atol=1e-12)
    assert sol.success
    return dict(M_GeV=M,alpha_s_low=a,alpha_s_high=a*r,hard_over_Klow=hard,source_over_Klow=source,EW_finite_over_Klow=F,total_over_Klow=total,no_QCD_over_Klow=bare,ratio_to_no_QCD=total/bare,ODE_relative_error=abs((sol.y[0,-1]+F)/total-1))
rows=[evaluate(M,a) for M in [2000.,5000.,20000.] for a in [.106,.108,.110]]
checks=dict(analytic_matches_ODE=max(r['ODE_relative_error'] for r in rows)<1e-9,zero_QCD_limit=abs(evaluate(2000.,1e-8)['ratio_to_no_QCD']-1)<1e-7,zero_interval_limit=abs(evaluate(low,.108)['ratio_to_no_QCD']-1)<1e-14)
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='Six-flavour one-loop QCD beta, Yukawa running and VLL homogeneous running applied to verified electroweak source. Fixed matching scales; no mixed two-loop anomalous dimension or finite QCD matching. Alpha range is diagnostic, not a confidence interval.',rows=rows,checks=checks,full_QCD_matching_completed=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
