"""Scalar rigid-sphere response and Born-extrapolation audit."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
from scipy.special import k0
b=Path(__file__).parent;p=b/'casimir-dp-axial-sphere-fold-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='3d8582e219cdf5144a4a844030f95dcf12eb9b86547f49d5f129f2387dde8f8d'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
R=n['R'];Q=n['Q'];target=.0295114647221;theta0=3e-10;gN0=.3*.939/246.2;rows=[]
for m in [40.,100.]:
 gap=.000248*(m+131.293*.93149410242)/m;y=gap/1000
 for ms in [1e-10,1e-9,1e-8,1e-6]:
  def integrand(z):
   x=math.exp(z);q=x/R
   return 2*x*x/R**2*n['F'](x)**2*n['loss'](x*n['sep'])*(1/(q*q+ms*ms)-1/(q*q+125**2))**2
  ints=[quad(integrand,math.log(1e-8),math.log(cut),epsabs=0,epsrel=1e-8,limit=500)[0] for cut in [40.,80.]]
  K=.3/m*n['d']['hold_time_s']*2.99792458e10*.3893793721e-27*y*y*gN0*gN0*Q*Q/(4*math.pi)*n['meaninv']*ints[1]
  zreq=math.sqrt(target/K);theta=.5*math.asin(2*zreq) if zreq<=.5 else None
  a=ms*R
  line=quad(lambda z:z*math.sqrt(max(0.,1-z*z))*k0(a*z),0,1,epsabs=1e-14,epsrel=1e-10)[0] if a<100 else 1/a**2
  # Heavy Higgs line term is negligible; retained through its large-a asymptote.
  line-=1/(125*R)**2
  def phase(mix):return 6*Q*y*gN0*mix/(4*math.pi*(300/299792.458))*line
  rows.append(dict(mchi_GeV=m,scalar_mass_GeV=ms,K_in_D_equals_K_sin2theta_cos2theta=K,D_reference_mixing_upper_in_qR_interval=K*(math.sin(theta0)*math.cos(theta0))**2,cutoff40_over80=ints[0]/ints[1],formal_theta_for_target=theta,formal_target_phase_at_300km_s=phase(zreq) if theta is not None else None,reference_phase_at_300km_s=phase(math.sin(theta0)*math.cos(theta0)),formal_target_alphaNN=math.sin(theta)**2*.3**2/(4*math.pi*6.708e-39*246.2**2) if theta is not None else None))
out=dict(scope='Symmetric dark-scalar pilot w500GeV; conditional total elastic density .3GeV/cm3. Born rigid uniform-sphere response qR1e-8..80, orientation-averaged separation. Inverse-speed moment gives an upper bound for this interval only; not complete solid response. Formal target angles are not physical predictions when phase is large. No stellar recast or all-velocity Born admission.',reference_theta=theta0,reference_source='https://arxiv.org/abs/1611.05852',rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
