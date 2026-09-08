"""Angular identity and explicitly invalid independent-carbon slow extrapolation."""
from pathlib import Path
import hashlib
import json
import numpy as np
from scipy.integrate import quad
from scipy.optimize import minimize_scalar

p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(raw)['leading_design']
F=lambda x: 1-np.sinc(x/np.pi)**2
checks=[]
for x in [.01,.5,1.9979477996,5.,20.]:
    angular=quad(lambda u:.5*(1-np.sinc(x*np.sqrt(2*(1-u))/np.pi)), -1,1,epsabs=1e-12)[0]
    error=abs(angular-F(x))
    assert error<1e-12
    checks.append(dict(x=x,absolute_error=error))
peak=minimize_scalar(lambda x:-F(x)/x,bounds=(.01,np.pi),method='bounded')
# Outside the searched first lobe, F(x)/x <= 1/pi, below this peak.
assert F(peak.x)/peak.x>1/np.pi
M=100.;mc=12*.93149410242-6*.00051099895;mu=M*mc/(M+mc)
d=c['branch_separation_m']
assert d==2.5e-7
v=peak.x*1.973269804e-16/(mu*d)
sigma=4*np.pi/(mu*v)**2*.3893793721e-27
N=c['mass_kg']/(12*1.66053906660e-27)
D=.3/M*v*2.99792458e10*c['hold_time_s']*N*sigma*F(peak.x)
out=dict(status='invalid_independent_carbon_peak_not_signal_prediction',
         config_sha256=hashlib.sha256(raw).hexdigest(), angular_checks=checks,
         peak_x=float(peak.x),speed_m_s=float(v*299792458),
         formal_D=float(D),single_carbon_sigma_cm2=float(sigma),
         overlap_diagnostic=float(N*sigma/(np.pi*(c['radius_m']*100)**2)),
         assumptions=['isotropic incident directions and elastic s-wave CM scattering',
                      'stationary free-carbon targets; invalid for this slow solid extrapolation',
                      'unitarity saturation and density 0.3 GeV/cm3, not a matched population'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
