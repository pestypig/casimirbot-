"""Frozen-gap Yukawa range screen; no inferred measured boundary response."""
from pathlib import Path
import hashlib,json,math
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design'];hc=1.973269804e-7
rows=[dict(mass_eV=m,range_m=hc/m,gap_attenuation=math.exp(-d['gap_m']*m/hc)) for m in [.001,.01,.01973269804,.1,1.,10.]]
out=dict(scope='Geometric exp(-gap/range) only; not a force, noise, decoherence or exclusion bound. Gap is nearest surface distance. No density or state-dependent scalar susceptibility assigned.',gap_m=d['gap_m'],rows=rows,mass_for_range_equals_gap_eV=hc/d['gap_m'],full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
