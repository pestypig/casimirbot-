"""FLAG24 bag update; conditional charged-kaon proxy and covariance envelope."""
import hashlib, json, math
from pathlib import Path
p = Path(__file__).with_name('casimir-dp-axion-ndr-qcd-evolution-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest() == 'e705f95fbad0b65809030e4aa8b4b48f9ab7edc0f9d85d13130ddb1878626087'
c = json.loads(p.read_text())['rows'][1]['C_RGI_imag_GeV_minus2']
f, sf, b, sb = .1557, .0007, .7533, .0091
m, kappa, dm, observed = .497611, .92, 3.484e-15, .002228
def eps(fk, bk):
    return abs(c)*fk**2*m*bk*kappa/(3*math.sqrt(2)*dm)
value = eps(f,b)
# First-order covariance propagation only for f and B; rho is unknown.
a, z = 2*sf/f, sb/b
errors = [{'rho':r, 'relative_sigma':math.sqrt(a*a+z*z+2*r*a*z)} for r in [-1,0,1]]
assert abs(value/eps(f,.7625)-b/.7625) < 1e-14
assert abs(errors[0]['relative_sigma']-abs(a-z)) < 1e-14
assert abs(errors[-1]['relative_sigma']-(a+z)) < 1e-14
out = dict(source='https://arxiv.org/pdf/2411.04268v3', source_locations='eqs 81, 98-100, 111-112; footnote 35',
    inputs=dict(C_RGI_imag_GeV_minus2=c, nf_lattice='2+1', Bhat=b, Bhat_sigma=sb,
        fK_charged_proxy_GeV=f, fK_sigma_GeV=sf, mK_GeV=m, kappa=kappa, dmK_GeV=dm),
    conditional_epsilon_NP_magnitude=value, fraction_observed=value/observed,
    ratio_to_previous_bag=value/eps(f,.7625), input_only_covariance_scenarios=errors,
    excluded_uncertainties=['neutral/isospin conversion','UV matching','SM input scheme','QCD truncation','CKM and signed SM amplitude','kappa and mass inputs'],
    checks=dict(bag_linear_scaling=True,covariance_extrema=True),
    model_admitted=False, exclusion_or_fit=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
