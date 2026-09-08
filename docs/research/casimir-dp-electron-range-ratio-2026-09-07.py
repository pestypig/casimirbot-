from pathlib import Path
import os,json,hashlib,numpy as np
from scipy.interpolate import interp1d
from scipy.integrate import quad
r=Path(__file__).resolve().parent;dp=r/'casimir-dp-electron-range-diamond-2026-09-07.json';xp=r/'casimir-dp-electron-range-xenon-2026-09-07.json';d=json.loads(dp.read_text())['rows'];xs=json.loads(xp.read_text())['rows'];bp=Path(os.environ['TEMP'])/'casimir-xenon1t-s2-fallback/s2_binning_info.csv'
assert hashlib.sha256(bp.read_bytes()).hexdigest()=='637539acfbb0f568c4a0c185ef2d179bb612f6470fec1e2492067a6b417e2282'
b=np.genfromtxt(bp,delimiter=',',names=True);x=b['linear_center_pe'];rows=[]
for row in xs:
 f=interp1d(x,np.array(row['variants'][0]['selected_bin_counts'])/(b['end_pe']-b['start_pe']));N=quad(f,165.3,271.7,points=x[(x>165.3)&(x<271.7)],epsabs=1e-15)[0]
 assert N>0
 for a in d:
  if a['mediator_eV']==row['mediator_eV']:rows.append(dict(mediator_eV=row['mediator_eV'],response=a['response'],ROI_events_per_Wref_squared=N,D_at_reference_24_8=24.8*a['D_per_Wref_squared']/N))
out=dict(status='conditional_single_yukawa_electron_ratio_scan_not_exclusion',diamond_sha256=hashlib.sha256(dp.read_bytes()).hexdigest(),xenon_sha256=hashlib.sha256(xp.read_bytes()).hexdigest(),rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
