from pathlib import Path
import os,json,hashlib,subprocess,math
import numpy as np
root=Path(__file__).resolve().parent
ext=Path(os.environ['TEMP'])/'casimir-darkcast-intake'
assert subprocess.check_output(['git','-C',str(ext),'rev-parse','HEAD'],text=True).strip()=='5a2a53a8984827be06e2939e6c3705f79d180048'
source=root/'casimir-dp-virtual-nuclear-match-2026-09-07.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='5dd97935c6c3559c0eb8fd2d15eae38b79af9e1f955a790def87be9b8888be9e'
a=json.loads(source.read_text())['effective_alpha_product']
eps_min=a/math.sqrt(.5/137.035999084); eps_max=.01
rows=[]
for name in ['E137_Andreas2012mt','E141_Riordan1987aw','NA64_Banerjee2019hmi','NA48_Batley2015lha']:
 p=ext/'darkcast/limits'/(name+'.lmt');d=np.loadtxt(p);x=.01
 assert np.all(np.diff(d[:,0])>=0) and d[0,0]<x<d[-1,0]
 k=np.searchsorted(d[:,0],x)
 log=[float(np.exp(np.interp(np.log(x),np.log(d[:,0]),np.log(d[:,j])))) for j in range(1,d.shape[1])]
 linear=[float(np.interp(x,d[:,0],d[:,j])) for j in range(1,d.shape[1])]
 lo=max(log[0],linear[0]);hi=min(log[1],linear[1]) if len(log)>1 else eps_max
 rows.append(dict(name=name,lower=lo,upper=hi,bracket=d[k-1:k+1].tolist(),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
reach=eps_min
for row in rows:
 assert row['lower']<reach<row['upper']
 reach=row['upper']
assert reach==eps_max
# Independent dense coverage check supplements the interval proof.
for ep in np.geomspace(eps_min,eps_max,10001):
 assert any(r['lower']<ep<=r['upper'] for r in rows)
out=dict(status='conditional_continuous_visible_decay_screen',epsilon_domain=[eps_min,eps_max],alpha_D_domain=[a*a*137.035999084/eps_max**2,.5],intervals=rows,covered=True,confidence='union of published exclusions, not a combined likelihood',assumptions=['dominant electron-pair mediator decay','fixed 10 MeV mediator and gap, authenticated preceding nuclear normalization','NA48 prompt upper-limit interpretation','epsilon<=0.01 declared scope'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
