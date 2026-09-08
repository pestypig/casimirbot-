"""Shared vector normalization; raw Xe coefficients, no detector likelihood."""
import ast, hashlib, json, math
from pathlib import Path
from scipy.integrate import quad
from scipy.special import spherical_jn
base=Path(__file__).parent
p=base/'casimir-dp-darkelf-thermal-partial-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='08d49d1ed65f5f693da2e8addfa3818fa57bb641dba9bea6ab1068f991ba86dc'
local=json.loads(p.read_text())
# Reuse the recorded isotope input, without executing its unrelated dipole model.
isofile=base/'casimir-dp-photon-charge-tail-2026-09-06.py'
tree=ast.parse(isofile.read_text())
iso=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign)
         and any(isinstance(t,ast.Name) and t.id=='iso' for t in n.targets))
assert abs(sum(f for _,_,f in iso)-1)<1e-12
mchi=100.;med=.01;mp=.94;muP=mchi*mp/(mchi+mp)
q0=mchi*220/299792.458  # exact constructor default used by the prior run
sigma=1e-38;v=776/299792.458;speed_cm=776e5
year=365*86400  # same year convention as DarkELF
targets=2840/(sum(m*f for _,m,f in iso)*1.66053906892e-27)

def mass(m):return m*.93149410242-54*.00051099895
def emax(ma):return 2*(mchi*ma/(mchi+ma))**2*v*v/ma*1e6
def ds(E,A,ma,helm=True):
    if E>emax(ma):return 0.
    q=math.sqrt(2*ma*E*1e-6)
    F=1.
    if helm:
        c=1.23*A**(1/3)-.60
        r=math.sqrt(c*c+7*math.pi**2*.52**2/3-5*.9**2)
        z=q*r/.1973269804
        F=3*spherical_jn(1,z)/z*math.exp(-.5*(q*.9/.1973269804)**2) if z else 1.
    return sigma*ma/(2*muP**2*v*v)*54**2*F**2*((q0*q0+med*med)/(q*q+med*med))**2*1e-6

def coefficient(lo,hi,helm=True):
    return targets*year*speed_cm*sum(f*quad(lambda E:ds(E,A,mass(m),helm),lo,min(hi,emax(mass(m))),
               epsabs=1e-60,epsrel=1e-8)[0] for A,m,f in iso if lo<emax(mass(m)))

# Analytic integrated point-charge propagator check for every isotope.
for A,m,f in iso:
    ma=mass(m);lo=200.;hi=min(269.9,emax(ma))
    numeric=quad(lambda E:ds(E,A,ma,False),lo,hi,epsabs=1e-60)[0]
    analytic=sigma*54**2/(4*muP**2*v*v)*(q0*q0+med*med)**2*(1/(2*ma*lo*1e-6+med*med)-1/(2*ma*hi*1e-6+med*med))
    assert math.isclose(numeric,analytic,rel_tol=1e-9)
high=coefficient(200,269.9)
full=coefficient(5.4,269.9)
ratios=[]
for r in local['rows']:
    ratio=r['mean_events_in_frozen_hold']/high
    ratios.append(dict(particle_temperature_K=r['particle_temperature_K'],
                       partial_D_per_raw_high_Xe_at_equal_number_density=ratio,
                       slow_to_fast_density_ratio_for_DP_and_one_raw_high_count=.029511464722144533/ratio))
out=dict(status='conditional_shared_coefficients_not_joint_population',
    local_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),isotope_source_sha256=hashlib.sha256(isofile.read_bytes()).hexdigest(),
    mchi_GeV=mchi,mediator_GeV=med,reference_momentum_GeV=q0,reference_proton_cross_section_cm2=sigma,
    equivalent_zero_momentum_proton_cross_section_cm2=sigma*((q0*q0+med*med)/(med*med))**2,
    fast_distribution='mono-speed 776 km/s; number density 1/cm3; no attenuation',
    raw_high_counts_per_fast_cm3=high,raw_full_counts_per_fast_cm3=full,
    raw_full_to_high_ratio=full/high,ratios=ratios,
    raw_differential_counts_per_keV_per_fast_cm3=[dict(E_keV=E,value=targets*year*speed_cm*sum(f*ds(E,A,mass(m)) for A,m,f in iso)) for E in [5.4,10,25,50,100,150,200,248,269.9]],
    limitations=['partial diamond channel','conditional independent distributions','Helm charge form factor',
                 'no detector acceptance or resolution','no LZ fit/exclusion','no terrestrial supply calculation'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
