"""Light-mediator classical repulsive transfer diagnostic."""
import math,json,hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-bl-two-mediator-screen-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ddc698c716a2aa274096819bfdf2694b2d60148ae45313690509bc641bd90d56'
product=json.loads(p.read_text())['rows'][1]['effective_alpha_products'][0]
rows=[]
for g in [1e-12,3e-12,1e-11]:
 alpha=4*math.pi*(product/g)**2
 for speed in [30,200,1000,3000]:
  v=speed/299792.458;beta=2*alpha*1e-9/(100*v*v)
  classical=100*v/1e-9
  assert beta<1 and classical>1e6
  cross=2*math.pi/1e-18*beta**2*math.log1p(beta**-2)
  per_mass=cross*.3893793721e-27/(100*1.78266192e-24)
  assert per_mass>0 and math.isfinite(per_mass)
  rows.append(dict(g_SM=g,alpha_dark=alpha,relative_speed_kms=speed,beta=beta,
   classical_parameter=classical,sigma_transfer_cm2_per_g=per_mass))
out=dict(status='conditional_classical_self_scattering_diagnostic_not_halo_exclusion',rows=rows,
 source='https://arxiv.org/html/1302.3898',equation=38,
 assumptions=['repulsive light Yukawa potential only','point particles; 100 GeV mass, 1 eV mediator',
 'transfer cross section proxy; not identical-particle viscosity or full halo transport',
 'heavy-mediator dark coupling, radiation and collective screening not specified'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
