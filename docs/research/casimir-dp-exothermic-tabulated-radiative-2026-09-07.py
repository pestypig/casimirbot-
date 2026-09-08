"""Authors' finite-mass table folded with the heavy-current spectral kernel."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.integrate import quad
from scipy.special import beta
base=Path(__file__).parent;p=base/'casimir-dp-radiative-enhancement-source-2026-09-07.txt'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='883a02811f5b436d6bfb3ebcc2da1ad5344f4b1842806ff5559beb9875f4557c'
data=np.loadtxt(p,delimiter=',',skiprows=1);x=data[:,0]*.001;y=data[:,1]
assert np.all(np.diff(x)>0) and np.all(y>=1)
interp=PchipInterpolator(x,y,extrapolate=False);me=.00051099895;alpha=1/137.035999084
coeff=[1,335/714,128941/839664,44787/1026256,1249649333/108064756800,36494147/12382420050,867635449/1614300688000]
def series(q):return sum(c*(q/me)**(2*k) for k,c in enumerate(coeff))
join_error=abs(series(x[0])/y[0]-1)
# Preserve the failed consistency check as evidence; do not promote this splice.
join_pass=bool(join_error<1e-4)
def enhancement(q,mode):
    if q<x[0]:return series(q)
    assert q<=x[-1]
    return float(interp(q)) if mode=='pchip' else float(np.interp(q,x,y))
p=base/'casimir-dp-exothermic-common-rate-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
rates=json.loads(p.read_text());r=alpha/(4*math.pi);rows=[]
for w in rates['rows']:
    if w['mchi_GeV'] not in [40.,100.]:continue
    gap=abs(w['delta_GeV']);points=[(q/gap)**2 for q in x if q<gap]
    factors={}
    for mode in ['pchip','linear']:
        factors[mode]=quad(lambda u:u**4*(1-u)**1.5*enhancement(gap*math.sqrt(u),mode),0,1,points=points,limit=200,epsabs=1e-11)[0]/beta(5,2.5)
    Ce=r*w['C_nucleon_GeV_minus2']
    leading=Ce**2*17*alpha**3/(93312000*math.pi**6*me**8)*gap**13*beta(5,2.5)
    tau=6.582119569e-25/(leading*factors['pchip'])
    rows.append(dict(mchi_GeV=w['mchi_GeV'],enhancement_factors=factors,interpolation_fractional_difference=factors['linear']/factors['pchip']-1,conditional_electron_loop_only_lifetime_s=tau,age_over_lifetime=4.35e17/tau))
out=dict(scope='UNVALIDATED DIAGNOSTIC: table/series overlap discrepancy unresolved. Tabulated one-loop electron spectral width; leading heavy-dark-current/contact approximation. Low-mass table gap filled by six-term series. Interpolation comparison is not a theory error bound; other decay channels omitted.',source='https://arxiv.org/src/1705.00619 anc/enhancement.txt',table_rows=len(x),series_join_relative_difference=join_error,overlap_comparison=[dict(mass_MeV=float(q*1000),table=float(v),series=float(series(q)),series_over_table_minus_one=float(series(q)/v-1)) for q,v in zip(x,y) if q<.0006],rows=rows,checks=dict(monotonic_grid=True,low_mass_series_join_pass=join_pass,no_high_mass_extrapolation=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
