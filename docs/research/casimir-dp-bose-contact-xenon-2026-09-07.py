"""Same contact coefficient: raw idealized Xe counts and stimulated envelope."""
import hashlib, json, math
from pathlib import Path
from scipy.integrate import quad

base=Path(__file__).parent
prior=base/'casimir-dp-bose-finite-time-bound-2026-09-07.json'
b=json.loads(prior.read_text())
hc=1.973269804e-14
conv=hc**2
c=29979245800.  # cm/s
v0=22000000./c
vmax=77600000./c
z=vmax/v0
norm=math.erf(z)-2*z*math.exp(-z*z)/math.sqrt(math.pi)
A=131.293
ma=A*.93149410242
u=1.66053906892e-27
exposure=2840/(A*u)*365.25*86400  # target seconds
radius=1.2*A**(1/3)*1e-13/hc  # ideal uniform sphere, GeV^-1

def pdf(v):
    return 4/math.sqrt(math.pi)*v*v/v0**3*math.exp(-(v/v0)**2)/norm

def eta(v):
    if v>=vmax:return 0.
    return 2/(math.sqrt(math.pi)*v0*norm)*(math.exp(-(v/v0)**2)-math.exp(-z*z))

def form(E):
    x=math.sqrt(2*ma*E)*radius
    return 1-x*x/10 if abs(x)<1e-4 else 3*(math.sin(x)-x*math.cos(x))/x**3

assert abs(quad(pdf,0,vmax)[0]-1)<1e-12
rows=[]
for r in b['rows']:
    m=r['mass_GeV'];mu=m*ma/(m+ma)
    def raw(lo,hi,finite=True):
        hi=min(hi,2*mu*mu*vmax*vmax/ma)
        if hi<=lo:return 0.
        return exposure*.3/m*c*conv*quad(lambda E: ma*A*A/(2*math.pi)
            *(form(E)**2 if finite else 1)*eta(math.sqrt(ma*E/(2*mu*mu))),
            lo,hi,epsabs=0,epsrel=1e-9)[0]
    high=raw(200e-6,269.9e-6)
    low=raw(5.4e-6,200e-6)
    # Independent speed-space integration for point-target high band.
    point_speed=exposure*.3/m*c*conv*quad(lambda v: 0 if v==0 else
        pdf(v)*ma*A*A/(2*math.pi*v)*max(0,min(269.9e-6,2*mu*mu*v*v/ma)-200e-6),
        0,vmax,points=[math.sqrt(ma*200e-6/(2*mu*mu))],epsabs=0,epsrel=1e-8)[0]
    err=abs(point_speed/raw(200e-6,269.9e-6,False)-1)
    assert err<1e-7
    rows.append(dict(mass_GeV=m, raw_high_per_C2=high,raw_low_per_C2=low,
        raw_low_high_ratio=low/high, C_for_one_raw_high_GeV_minus2=1/math.sqrt(high),
        stimulated_D_upper_per_raw_high=r['unit_C_GeV_minus2_stimulated_D_upper']/high,
        point_speed_energy_relative_error=err))
out=dict(status='conditional_shared_contact_normalization',
    prior_sha256=hashlib.sha256(prior.read_bytes()).hexdigest(),
    model='C n_target n_chi; dsigma/dE=mA A^2 C^2 F^2/(2 pi v^2)',
    population='unshifted isotropic truncated Gaussian, v0=220 km/s, vmax=776 km/s, rho=.3 GeV/cm3',
    xenon='mean-A uniform sphere radius 1.2 A^(1/3) fm; raw true energies; 2.84 tonne-year',
    rows=rows,limitations=['One raw high count is a normalization illustration, not a fit',
      'Uniform mean-isotope target is not authenticated LZ nuclear or detector response',
      'Stimulated upper bound only, not total coherence',
      'No cold population substituted into xenon normalization',
      'No microscopic completion, external constraint admission, or transport'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
