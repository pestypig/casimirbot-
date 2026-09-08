"""Forward scalar loop masters only; no fermion amplitude or rate."""
from pathlib import Path
import json, math, hashlib, warnings
from scipy.integrate import quad, IntegrationWarning
warnings.simplefilter('error', IntegrationWarning)
base=Path(__file__).resolve().parent
p=base/'casimir-dp-virtual-300mev-candidate-2026-09-07.json'
raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='54fc7fe2ae81ff6062486128741a26c7bfa3931b5baf18e0286934bbd8134884'
c=json.loads(raw)['candidate'];M=c['dark_mass_GeV'];a=c['mediator_GeV'];g=c['gap_GeV'];m=.00051099895
rows=[]
for sign in [-1,1]:
    def integrand(y,z):
        x=1-y-z
        delta=x*a*a+y*(2*M*g+g*g)+(y*M+sign*z*m)**2
        assert delta>0
        return x/delta**2
    def direct(y):
        return quad(lambda z:integrand(y,z),0,1-y,epsabs=1e-8,epsrel=1e-7)[0]
    def transformed(t):
        y=t*t
        return 2*t*quad(lambda z:integrand(y,z),0,1-y,epsabs=1e-10,epsrel=1e-9)[0]
    v1=quad(direct,0,1,epsabs=1e-7,epsrel=1e-6,points=[1e-6,1e-4,.001,.01])[0]/(16*math.pi**2)
    v2=quad(transformed,0,1,epsabs=1e-10,epsrel=1e-8,points=[.001,.01,.1])[0]/(16*math.pi**2)
    assert abs(v1/v2-1)<1e-8
    rows.append(dict(electron_routing_sign=sign,scalar_master_GeV_minus4=v2,coordinate_relative_difference=abs(v1/v2-1)))
out=dict(status='forward_scalar_denominator_masters_not_matched_amplitude',candidate_sha256=hashlib.sha256(raw).hexdigest(),rows=rows,
         missing=['fermion tensor numerators and Majorana diagram conventions','relative signs and symmetry factors','gauge completion and operator reduction','finite external momentum corrections','material convolution'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
