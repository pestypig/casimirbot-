"""Top self-Yukawa trajectory sensitivity on a frozen matching subset."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-uv-current-sensitivity-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='1ffe60c11fd453d45eb7c1b86d35f2af7a9dc74c87df9f8e7a31e0959c4f1f57'
z={'__file__':str(p)};exec(compile(p.read_text().split('\nbase=value(')[0],str(p),'exec'),z)
d=z['d'];np=z['np'];M=d['M'];a=d['a'];c=d['c'];L=d['L'];yt0=d['yt0']
d['initial']['phiq1']=z['original1']-17*z['unit'];d['initial']['phiq3']=z['original3']+9*z['unit']
base=z['value'](1e-9)
old_standard=d['standard']
def yt(t):
    u=1+c*t
    reciprocal=u**(8/7)*(1/yt0**2-63/(16*math.pi**2*c)*(1-u**(-1/7)))
    assert reciprocal>0
    return 1/math.sqrt(reciprocal)
def standard(t):
    C=old_standard(t);C['Gu']=d['V'].conj().T@np.diag([0.,0.,yt(t)])
    return C
d['standard']=standard
# Update the same mixed hard boundary formula using its new high-scale Yukawa.
B=d['B'];high=standard(L);Y=high['Gu']@high['Gu'].conj().T
hard=-np.einsum('ij,kl->ijkl',B,B)/(256*math.pi**2*M*M)+1.5*(np.einsum('ij,kl->ijkl',B,Y)+np.einsum('ij,kl->ijkl',Y,B))/(256*math.pi**2*M*M)
d['initial']['qq1']=hard.copy();d['initial']['qq3']=hard.copy()
full=z['value'](1e-7);tight=z['value'](1e-9)
from scipy.integrate import solve_ivp
def rhs(t,w):
    gs2=4*math.pi*a/(1+c*t)
    return [(4.5*w[0]**2-8*gs2)*w[0]/(16*math.pi**2)]
sol=solve_ivp(rhs,[0,L],[yt0],rtol=1e-11,atol=1e-13,dense_output=True)
assert sol.success
grid=np.linspace(0,L,11)
ode_error=max(abs(sol.sol(t)[0]/yt(t)-1) for t in grid)
beta_errors=[]
for t in grid:
    C=standard(t);b=d['beta'](C)['Gu']/(16*math.pi**2)
    expected=d['V'].conj().T@np.diag([0.,0.,rhs(t,[yt(t)])[0]])
    beta_errors.append(float(np.max(np.abs(b-expected))/np.max(np.abs(expected))))
checks=dict(analytic_vs_ODE=bool(ode_error<1e-9),library_beta=bool(max(beta_errors)<1e-12),coefficient_tolerance=bool(abs(full/tight-1)<1e-8),low_boundary=bool(abs(yt(0)/yt0-1)<1e-12))
assert all(checks.values())
out=dict(scope='Self-consistent one-loop gs/yt subsystem only. Other SM couplings remain imposed zero, not a closed full SM flow. Frozen UV subset includes quartic current terms; mixed hard boundary updated with yt(M).',QCD_only_imag_GeV_minus2=base,top_self_imag_GeV_minus2=tight,fractional_coefficient_change=tight/base-1,yt_low=yt0,yt_high_QCD_only=yt0*(1+c*L)**(-4/7),yt_high_with_self=yt(L),analytic_ODE_max_relative_error=float(ode_error),beta_max_relative_error=max(beta_errors),checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
