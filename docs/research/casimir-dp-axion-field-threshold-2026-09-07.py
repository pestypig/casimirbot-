"""Leading heavy-light chiral messenger two-point threshold, symmetric-background limit."""
import hashlib,json,math
from pathlib import Path
import mpmath as mp
mp.mp.dps=45
base=Path(__file__).parent
parent=base/'casimir-dp-axion-potential-closure-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='44f6aa06188a196acba3554dffc5d4bcc817f29c1ff80aedc4d524968852a3ac'
potential=next(r for r in json.loads(parent.read_text())['rows'] if r['lambda_PhiH']==.03)
Nc=mp.mpf(3);M=mp.mpf(2000)
def B(s,mu):
    # Finite MS-bar B0(s;M^2,0), below threshold.
    return -mp.quad(lambda x:mp.log(x*(M*M-(1-x)*s)/(mu*mu)),[0,1])
def Pi(s,y,mu):
    A0=M*M*(1-mp.log(M*M/(mu*mu)))
    return -Nc*y*y/(8*mp.pi**2)*(A0+(M*M-s)*B(s,mu))
rows=[];derivative_errors=[];mass_errors=[]
for name,y in [('A',mp.mpf('.0032')),('h',mp.mpf('.2')/mp.sqrt(2))]:
    for mu in [M/2,M,2*M]:
        L=mp.log(M*M/(mu*mu))
        Z=Nc*y*y/(8*mp.pi**2)*(mp.mpf('.5')-L)
        numeric=mp.diff(lambda s:Pi(s,y,mu),0)
        derivative_errors.append(float(abs(numeric-Z)))
        dm2=-Nc*y*y*M*M/(4*mp.pi**2)*(L-1)
        mass_errors.append(float(abs(Pi(0,y,mu)+dm2)))
        rows.append(dict(field=name,mu_GeV=float(mu),delta_Z=float(Z),inverse_two_point_at_zero_GeV2=float(Pi(0,y,mu))))
ZA=next(r['delta_Z'] for r in rows if r['field']=='A' and r['mu_GeV']==2000)
ZH=next(r['delta_Z'] for r in rows if r['field']=='h' and r['mu_GeV']==2000)
derived=dict(field_only_delta_kappaA=-.03*ZA,field_only_delta_lambdaA=-2*potential['lambda_Phi']*ZA,field_only_delta_lambdaH=-2*potential['lambda_H']*ZH,field_only_relative_A_Yukawa=-ZA/2)
errors=[]
for Q in [0.,.05,.246,1.]:
    raw=(1.36*5.6e-5)/((1+ZA)*Q*Q+1.)
    canonical=(1.36/math.sqrt(1+ZA))*(5.6e-5/math.sqrt(1+ZA))/(Q*Q+1/(1+ZA))
    errors.append(abs(raw/canonical-1))
checks=dict(two_point_derivative=max(derivative_errors)<1e-35,mass_sign_matches_potential=max(mass_errors)<1e-30,field_redefinition_amplitude=max(errors)<1e-12)
assert all(checks.values())
out=dict(scope='Unbroken/small-background leading heavy-light one-loop MS-bar subset, yu=0. Inverse propagator=p^2-m0^2+Pi; kinetic coefficient 1+delta_Z. No full broken-vacuum, fermion, vertex, gauge or parameter matching.',checks=checks,rows=rows,derived=derived,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
