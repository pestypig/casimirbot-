"""Independent-carbon elastic s-wave ceiling at a specified mono-speed."""
from pathlib import Path
import hashlib
import json
import math

p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
raw=p.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(raw)['leading_design']
v=776/299792.458
mxe=122.298655189
mc=12*.93149410242-6*.00051099895
mu_required=math.sqrt(mxe*248e-6/(2*v*v))
minimum_mass=mu_required*mxe/(mxe-mu_required)
assert abs(2*(minimum_mass*mxe/(minimum_mass+mxe))**2*v*v/mxe/248e-6-1)<1e-14
ncarbon=c['mass_kg']/(12*1.66053906660e-27)
rows=[]
for mass in [minimum_mass,100.,1000.]:
    mu=mass*mc/(mass+mc)
    sigma=4*math.pi/(mu*v)**2*.3893793721e-27
    mean=.3/mass*776e5*c['hold_time_s']*ncarbon*sigma
    rows.append(dict(dark_mass_GeV=mass,carbon_s_wave_ceiling_cm2=sigma,
                     mean_scatters_ceiling=mean,D_ceiling=2*mean))
out=dict(status='conditional_independent_carbon_s_wave_ceiling',
         config_sha256=hashlib.sha256(raw).hexdigest(),
         speed_km_s=776,density_GeV_cm3=.3,carbon_mass_GeV=mc,
         source='https://arxiv.org/abs/2101.00142',rows=rows,
         caveats=['Not a total material or all-partial-wave bound',
                  'Not halo averaged; no additional slow population',
                  'No xenon coupling fit or transport admission',
                  'D ceiling is not an expected measurable signal'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
