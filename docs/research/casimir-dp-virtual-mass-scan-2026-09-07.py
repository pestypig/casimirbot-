from pathlib import Path
import json,hashlib,os,subprocess
import numpy as np
root=Path(__file__).resolve().parent
src=root/'casimir-dp-virtual-nuclear-match-2026-09-07.py'
text=src.read_text().split('coarse=run(384)')[0]
ns={'__file__':str(src)};exec(text,ns)
refined={'__file__':str(src)};exec(text.replace('leggauss(80)','leggauss(160)'),refined)
ext=Path(os.environ['TEMP'])/'casimir-darkcast-intake'
assert subprocess.check_output(['git','-C',str(ext),'rev-parse','HEAD'],text=True).strip()=='5a2a53a8984827be06e2939e6c3705f79d180048'
rows=[]
for med in [.003,.01,.03,.1,.3,1.]:
 ns['med']=refined['med']=med
 c=ns['run'](384);f=ns['run'](768);g=refined['run'](768)
 radial=max(abs(x/y-1) for x,y in zip(c,f));energy=max(abs(x/y-1) for x,y in zip(f,g))
 assert radial<1e-5 and energy<1e-5
 B=g[0]**-.5;alpha=(B*.01)**.5;admax=min(1,med**2/(2*.01**2));emin=alpha/(admax/137.035999084)**.5
 intervals=[]
 for name in ['E137_Andreas2012mt','E141_Riordan1987aw','NA64_Banerjee2019hmi','NA48_Batley2015lha']:
  p=ext/'darkcast/limits'/(name+'.lmt');d=np.loadtxt(p)
  if not d[0,0]<=med<=d[-1,0]:continue
  vals=[float(np.exp(np.interp(np.log(med),np.log(d[:,0]),np.log(d[:,j])))) for j in range(1,d.shape[1])]
  intervals.append(dict(name=name,lower=vals[0],upper=vals[1] if len(vals)>1 else .01,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 remaining=[];cursor=emin
 for r in sorted(intervals,key=lambda r:r['lower']):
  lo=max(emin,r['lower']);hi=min(.01,r['upper'])
  if hi<=cursor:continue
  if lo>cursor:remaining.append([cursor,lo])
  cursor=max(cursor,hi)
 if cursor<.01:remaining.append([cursor,.01])
 rows.append(dict(mediator_GeV=med,gap_GeV=.01,effective_alpha=alpha,raw_low_high=g[1]/g[0],epsilon_floor=emin,radial_refinement=radial,energy_refinement=energy,screened_intervals=intervals,not_covered_by_four_searches=remaining))
 print(med,rows[-1]['raw_low_high'],remaining,flush=True)
Path(__file__).with_suffix('.json').write_text(json.dumps(dict(status='conditional_mass_scan_not_allowed_region',kernel_source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),rows=rows),indent=2)+'\n')
