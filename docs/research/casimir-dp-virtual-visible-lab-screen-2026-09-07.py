from pathlib import Path
import os,json,hashlib,subprocess
import numpy as np
root=Path('docs/research'); ext=Path(os.environ['TEMP'])/'casimir-darkcast-intake'
commit=subprocess.check_output(['git','-C',str(ext),'rev-parse','HEAD'],text=True).strip()
assert commit=='5a2a53a8984827be06e2939e6c3705f79d180048'
source=root/'casimir-dp-virtual-gauge-completion-2026-09-07.json'
points=json.loads(source.read_text())['rows'];limits={}
for name in ['E137_Andreas2012mt','E137_Bjorken2009mm','E141_Riordan1987aw']:
 p=ext/'darkcast/limits'/(name+'.lmt');d=np.loadtxt(p);x=.01
 assert np.all(np.diff(d[:,0])>=0) and d[0,0]<x<d[-1,0]
 k=np.searchsorted(d[:,0],x);bracket=d[k-1:k+1];assert bracket[0,0]<x<bracket[1,0]
 log=[float(np.exp(np.interp(np.log(x),np.log(d[:,0]),np.log(d[:,j])))) for j in [1,2]]
 lin=[float(np.interp(x,d[:,0],d[:,j])) for j in [1,2]]
 limits[name]=dict(sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bracket=bracket.tolist(),log_interpolated=log,linear_interpolated=lin)
for row in points:
 ep=row['epsilon'];row['excluded_by']=[name for name,v in limits.items() if max(v['log_interpolated'][0],v['linear_interpolated'][0])<ep<min(v['log_interpolated'][1],v['linear_interpolated'][1])]
 assert row['excluded_by']
out=dict(status='conditional_visible_decay_benchmark_screen',darkcast_commit=commit,source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),limits=limits,points=points,assumption='BR(Aprime->e+e-) approximately one; no open additional dark decay channels')
(root/'casimir-dp-virtual-visible-lab-screen-2026-09-07.json').write_text(json.dumps(out,indent=2)+'\n')
print([(p['alpha_D'],p['excluded_by']) for p in points])
