"""Flight-time scales; no detector timing or selection simulation."""
import json,hashlib,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-single-scatter-bound-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='1352382c5385a70f694e74b3f9158e0cbaa2c33692dec1a3e6a6e5921c3d715e'
d=json.loads(p.read_text());speeds=d['incident_speed_range_kms']
rows=[]
for speed in speeds:
 rows.append(dict(speed_kms=speed,skin_prompt_path_m=speed*1000*.25e-6,
  od_prompt_path_m=speed*1000*.3e-6,
  flight_times_us=[dict(path_m=L,time_us=L/(speed*1000)*1e6) for L in [.1,.2,.5,1.]]))
assert math.isclose(rows[1]['skin_prompt_path_m'],.194)
out=dict(status='kinematic_timing_screen_not_tagging_efficiency',source='https://arxiv.org/html/2609.02823v1',
 source_location='Data Analysis veto definitions',prompt_half_width_us=dict(skin=.25,od=.3),rows=rows,
 assumptions=['constant speed between deposition sites','prompt scintillation used as deposition clock'],
 limitations=['slowing requires integral ds/v(s)','no scintillation timing spread, photon propagation or electronics offsets',
 'flight distance is actual path length, not radial separation','amplitude thresholds and delayed classification still required',
 'no sample fractions or acceptance predicted'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
