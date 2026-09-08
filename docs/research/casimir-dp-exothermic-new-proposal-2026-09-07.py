"""Independent free-carbon direct-channel upper coefficient for 2609.05204v1."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
root=Path(__file__).resolve().parents[2]
p=root/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
cfg=json.loads(p.read_text());d=cfg['leading_design']
m,delta,mediator=45.,.001,1.
P=1.7e-17 # source Fig 1 f_H alpha_D epsilon^2; illustrative, not likelihood fit
ma=12*.93149410242;mu=m*ma/(m+ma);Z=6
Nc=d['mass_kg']/(12*1.66053906892e-27)
vmax=798/299792.458;em=1/137.035999084;conv=.3893793721e-27
def sigma_v_upper(v):
    return 16*math.pi*em*P*Z**2*mu**2/mediator**4*math.sqrt(v*v+2*delta/mu)
checks=[]
for v in [100/299792.458,300/299792.458,vmax]:
    s=math.sqrt(v*v+2*delta/mu)
    lo=mu**2/(2*ma)*(s-v)**2;hi=mu**2/(2*ma)*(s+v)**2
    num=v*quad(lambda E:8*math.pi*em*P*Z**2*ma/(v*v*mediator**4),lo,hi,epsabs=1e-40)[0]
    err=abs(num/sigma_v_upper(v)-1);assert err<1e-12
    checks.append(err)
events=.3/m*29979245800*sigma_v_upper(vmax)*conv*Nc*d['hold_time_s']
out=dict(status='new_primary_direct_channel_screen',source='https://arxiv.org/html/2609.05204v1',
    inputs=dict(mass_GeV=m,gap_GeV=delta,mediator_GeV=mediator,weighted_coupling_product=P,maximum_speed_kms=798),
    zero_speed_carbon_recoil_keV=m*delta/(m+ma)*1e6,
    independent_carbon_event_upper=events,independent_scattering_D_upper=2*events,
    ratio_to_frozen_DP_exponent=2*events/cfg['frozen_diosi']['gaussian_exponent_at_hold'],
    integration_max_relative_error=max(checks),
    limitations=['Independent free-carbon charge response; F=1 and contact propagator upper',
      'Direct excited-state channel only, not elastic loops or complete solid response',
      'Source product is illustrative; no LZ likelihood reproduced',
      'No empirical local sensitivity, population-evolution replay or lifetime verification'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
