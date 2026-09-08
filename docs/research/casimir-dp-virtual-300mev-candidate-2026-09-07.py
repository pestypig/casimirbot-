from pathlib import Path
import os,json,math,hashlib
import numpy as np
root=Path(__file__).resolve().parent
source=root/'casimir-dp-virtual-mass-scan-2026-09-07.json'; scan=json.loads(source.read_text())
ext=Path(os.environ['TEMP'])/'casimir-darkcast-intake/darkcast/limits'
rows=[]
for m in [.1,.3]:
 limits=[]
 for name in ['BaBar_Lees2014xha','NA62_Dobrich2023dkm','NuCAL_Tsai2019mtm','CHARM_Tsai2019mtm','A1_Merkel2014avp']:
  p=ext/(name+'.lmt');d=np.loadtxt(p)
  if not d[0,0]<=m<=d[-1,0]:continue
  vals=[float(np.exp(np.interp(np.log(m),np.log(d[:,0]),np.log(d[:,j])))) for j in range(1,d.shape[1])]
  limits.append(dict(name=name,epsilon_bounds=vals,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 rows.append(dict(mediator_GeV=m,limits=limits))
r=next(r for r in scan['rows'] if r['mediator_GeV']==.3)
a=r['effective_alpha'];ad=.1;g=math.sqrt(4*math.pi*ad);v=.3/(2*g);eps=a/math.sqrt(ad/137.035999084);y=.01/(math.sqrt(2)*v);lam=.3**2/(2*v*v)
assert lam<4*math.pi and y*y/(4*math.pi)<1
assert abs(eps*math.sqrt(ad/137.035999084)/a-1)<1e-14
out=dict(status='broader_partial_screen_and_conditional_candidate',source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),rows=rows,candidate=dict(mediator_GeV=.3,gap_GeV=.01,dark_mass_GeV=100,alpha_D=ad,epsilon=eps,effective_alpha=a,scalar_mass_GeV=.3,v_D_GeV=v,y=y,lambda_D=lam,portal_status='not fixed; no scalar-mediated rate claimed'),omissions=['complete modern laboratory inventory','self-interactions and cosmology','full loop matching','detector-level xenon likelihood','material coherence response'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out['candidate'],indent=2))
