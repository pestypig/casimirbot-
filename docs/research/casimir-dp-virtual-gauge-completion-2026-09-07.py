from pathlib import Path
import json, math, hashlib
root=Path('docs/research'); source=root/'casimir-dp-virtual-nuclear-match-2026-09-07.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='5dd97935c6c3559c0eb8fd2d15eae38b79af9e1f955a790def87be9b8888be9e'
p=json.loads(source.read_text()); a=p['effective_alpha_product']; ma=p['mediator_GeV']; gap=p['gap_GeV']; rows=[]
for ad in [.001,.01,.1,.5]:
 g=math.sqrt(4*math.pi*ad); v=ma/(2*g); y=gap/(math.sqrt(2)*v); ep=a/math.sqrt(ad/137.035999084)
 assert abs(ep*math.sqrt(ad/137.035999084)/a-1)<1e-14
 assert abs(math.sqrt(2)*y*v/gap-1)<1e-14
 rows.append(dict(alpha_D=ad,epsilon=ep,v_D_GeV=v,y=y,alpha_y=y*y/(4*math.pi),scalar_mass_ceiling_GeV=math.sqrt(8*math.pi)*v))
out=dict(status='conditional_minimal_charge_two_Higgs_completion_not_experimental_constraint',rows=rows,alpha_D_ceiling=min(1,ma*ma/(2*gap*gap)),assumptions=['equal Majorana Yukawa couplings','alpha_D<=1, y^2/(4pi)<=1, lambda<=4pi are chosen loose perturbativity criteria','scalar portal and full loop matching not specified'])
(root/'casimir-dp-virtual-gauge-completion-2026-09-07.json').write_text(json.dumps(out,indent=2)+'\n')
