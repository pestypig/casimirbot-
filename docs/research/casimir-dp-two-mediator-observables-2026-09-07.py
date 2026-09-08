"""Frozen observable distinction and static mediator range diagnostic."""
import hashlib,json,math
from pathlib import Path
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text());gap=d['leading_design']['gap_m'];hc=1.973269804e-7
rows=[]
for mass in [1e3,1e5,1e7,1e9]:
 lam=hc/mass
 rows.append(dict(mediator_mass_eV=mass,range_m=lam,gap_over_range=gap/lam,
  log10_static_Yukawa_gap_factor=-gap/lam/math.log(10)))
# C_bs = apparatus_b * exp(-D_s) for factorizable boundary-independent scattering.
# log R4 = log C_AS-log C_AC-log C_RS+log C_RC.
Dsep=.029511464722144533;Dcompact=0.;a=-.002;r=-.005
cells=[a-Dsep,a-Dcompact,r-Dsep,r-Dcompact]
logR=cells[0]-cells[1]-cells[2]+cells[3]
assert abs(logR)<1e-16 and Dsep-Dcompact>0
out=dict(status='observable_identity_and_static_range_diagnostic_not_signal_prediction',
 primary_estimand=d['pilot_design']['primary_estimand'],boundary_estimand=d['pilot_design']['boundary_estimand'],
 gap_m=gap,static_range_rows=rows,demonstration_log_cross_ratio=logR,
 demonstration_primary_contraction_difference=Dsep-Dcompact,
 caveats=['demonstration exponent is the frozen comparator, not a scattering prediction',
 'direct static Yukawa gap factor is not a bound on real-particle flux modulation',
 'gap is the configured scale; actual source-sphere distance needs as-built geometry',
 'boundary-dependent material noise and transport require their own response calculation',
 'primary measurability still requires supplied population, branch-history kernel and qualified noise'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
