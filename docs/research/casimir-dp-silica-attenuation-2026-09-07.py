"""Independent point-nucleus silica column diagnostic; not site transport."""
import math,json,hashlib
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-darkelf-xenon-match-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='c92d809cdf9dbaac381e73a78eaed8191c974f8bd78fd86910d16c17b064ca34'
x=json.loads(p.read_text());m=100.;mp=.94;muP=m*mp/(m+mp)
v=776/299792.458;med=.01;sig0=x['equivalent_zero_momentum_proton_cross_section_cm2']
column=4e5  # g/cm^2, chosen diagnostic, not measured overburden
units=column/(60*1.66053906892e-24)
rows=[];tau=0.;energy=0.
for A,Z,multiplicity in [(28,14,1),(16,8,2)]:
    ma=A*.93149410242;mu=m*ma/(m+ma)
    Emax=2*mu**2*v*v/ma
    cross=sig0*Z**2*(mu/muP)**2/(1+4*mu**2*v*v/med**2)
    pref=sig0*ma*Z**2/(2*muP**2*v*v)
    ds=lambda E:pref*(med**2/(2*ma*E+med**2))**2
    num=quad(ds,0,Emax,epsabs=1e-60,epsrel=1e-10)[0]
    assert math.isclose(num,cross,rel_tol=1e-9)
    delta=units*multiplicity*cross
    loss=units*multiplicity*quad(lambda E:E*ds(E),0,Emax,epsabs=1e-60)[0]
    tau+=delta;energy+=loss
    rows.append(dict(A=A,Z=Z,multiplicity=multiplicity,cross_section_cm2=cross,optical_depth=delta))
required_survival=1/(x['raw_high_counts_per_fast_cm3']*.003)
out=dict(status='conditional_point_nucleus_column_only',source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
 column_g_cm2=column,composition='Si-28 O-16 twice, mass-number molar approximation',rows=rows,
 optical_depth=tau,uncollided_fraction=math.exp(-tau),
 first_order_mean_loss_fraction=energy/(.5*m*v*v),
 required_fast_fraction_at_stated_source_and_coupling=required_survival,
 optical_depth_if_every_collision_removed_fast_particle=-math.log(required_survival),
 raw_high_counts_from_uncollided_component=.003*math.exp(-tau)*x['raw_high_counts_per_fast_cm3'],
 limitations=['point nuclei','independent Born collisions','chosen column, not site geology',
 'no electrons or material excitations','no redistributed spectrum','not an experimental exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
