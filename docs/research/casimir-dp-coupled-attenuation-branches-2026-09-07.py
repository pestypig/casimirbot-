"""Two roots of uncollided count equation; not a full transport prediction."""
import math,json,hashlib
from pathlib import Path
from scipy.special import lambertw, gammainc
p=Path(__file__).with_name('casimir-dp-silica-attenuation-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='b96dedea2ee78f9e10bfbc5d6a2e74fe177aa6b49ef722fb511fac172bcd8f68'
d=json.loads(p.read_text());tau=d['optical_depth']
C=d['raw_high_counts_from_uncollided_component']*math.exp(tau)
m=100.;mp=.94;muP=m*mp/(m+mp);med=.01;v=776/299792.458
sig0=3.008770724735438e-35
rows=[]
for branch in [0,-1]:
    a=float(-lambertw(-tau/C,branch).real/tau)
    count=C*a*math.exp(-tau*a)
    assert math.isclose(count,1,rel_tol=1e-10)
    ma=131*.93149410242;mu=m*ma/(m+ma)
    sigxe=sig0*a*54**2*(mu/muP)**2/(1+4*mu**2*v*v/med**2)
    tauXe=300/(131*1.66053906892e-24)*sigxe
    alpha=math.sqrt(sig0*a/.3893793721e-27*med**4/(16*math.pi*muP**2))
    rows.append(dict(branch=branch,cross_section_multiplier=a,
      zero_momentum_proton_cross_section_cm2=sig0*a,silica_optical_depth=tau*a,
      uncollided_fraction=math.exp(-tau*a),raw_uncollided_high_count=count,
      diagnostic_xenon_column_g_cm2=300,point_xenon_optical_depth=tauXe,
      straight_track_fixed_energy_P_at_least_two=float(gammainc(2,tauXe)),
      effective_proton_alpha=alpha,point_xenon_range_strength_2muZalpha_over_med=2*mu*54*alpha/med))
assert rows[0]['silica_optical_depth']<1<rows[1]['silica_optical_depth']
out=dict(status='algebraic_uncollided_branches_only',source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
 equation='C*a*exp(-tau0*a)=1',unattenuated_reference_count=C,reference_silica_tau=tau,
 rows=rows,limitations=['not total flux or accepted count','point nuclei','chosen columns',
 'fixed-speed straight-track Poisson xenon diagnostic','Born extrapolation not authenticated at strong branch',
 'no captured distribution','no external-constraint recast'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
