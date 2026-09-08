"""Spectral convolution and finite series diagnostic, not exact radiative width."""
import math,json
from pathlib import Path
from scipy.integrate import quad
from scipy.special import beta
me=.00051099895
coeff=[1,335/714,128941/839664,44787/1026256,1249649333/108064756800,36494147/12382420050,867635449/1614300688000]
rows=[]
for mass in [40.,100.]:
    gap=.000248*(1+131.293*.93149410242/mass);z=gap*gap/(me*me)
    terms=[c*z**k*beta(5+k,2.5)/beta(5,2.5) for k,c in enumerate(coeff)]
    numerical=quad(lambda u:u**4*(1-u)**1.5*sum(c*(z*u)**k for k,c in enumerate(coeff)),0,1,epsabs=1e-12)[0]/beta(5,2.5)
    assert abs(numerical/sum(terms)-1)<1e-10
    rows.append(dict(mchi_GeV=mass,gap_GeV=gap,convolved_terms=terms,partial_sum=sum(terms),direct_endpoint_series=sum(c*z**k for k,c in enumerate(coeff))))
# Master kernel recovers the vector electron-pair width C^2 Delta^5/(60pi^3).
massless=quad(lambda u:(1-u)**1.5/(24*math.pi**3),0,1,epsabs=1e-14,epsrel=1e-12)[0]
assert abs(massless/(1/(60*math.pi**3))-1)<1e-9
out=dict(scope='Heavy transition-current spectral kernel; source six-term large-electron-mass series convolved exactly term by term. No remainder bound or exact radiative lifetime.',source='https://arxiv.org/pdf/1705.00619 Eq9-10 TableI',coefficients=coeff,rows=rows,checks=dict(vector_pair_normalization=True,analytic_moments_vs_quadrature=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
