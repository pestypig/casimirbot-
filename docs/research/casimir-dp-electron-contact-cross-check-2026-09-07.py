from pathlib import Path
import os,json,hashlib,numpy as np
from scipy.interpolate import interp1d
from scipy.integrate import quad
root=Path(__file__).resolve().parent
src=root/'casimir-dp-electron-contact-xenon-fold-2026-09-07.json';a=json.loads(src.read_text())['rows'][0]['variants'][0]
bp=Path(os.environ['TEMP'])/'casimir-xenon1t-s2-fallback/s2_binning_info.csv'
assert hashlib.sha256(bp.read_bytes()).hexdigest()=='637539acfbb0f568c4a0c185ef2d179bb612f6470fec1e2492067a6b417e2282'
b=np.genfromtxt(bp,delimiter=',',names=True);x=b['linear_center_pe'];f=interp1d(x,np.array(a['selected_bin_counts'])/(b['end_pe']-b['start_pe']));N,err=quad(f,165.3,271.7,points=x[(x>165.3)&(x<271.7)],epsabs=1e-7)
assert 0<N<a['selected_events_all_released_S2_bins']
kdoc=root/'casimir-dp-electron-unit-contact-2026-09-07.json';ks=json.loads(kdoc.read_text())['rows'];rows=[]
for k in ks:
 K=k['unit_contact_D'];rows.append(dict(response=k['response'],unit_contact_D=K,unit_contact_ROI_events=N,D_at_reference_24_8=K*24.8/N,W_at_reference_24_8_GeV_minus2=(24.8/N)**.5,formal_ROI_events_at_DP_target=N*.029511464722144533/K))
out=dict(status='conditional_contact_cross_experiment_rate_ratio_not_new_confidence_limit',rows=rows,fold_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),diamond_sha256=hashlib.sha256(kdoc.read_bytes()).hexdigest(),assumptions=['same unattenuated 100 GeV mono-speed population','constant electron-density contact potential','published 186 eV cutoff and fixed 165.3-271.7 PE ROI','24.8 is a reference-model allowance, not a newly calculated limit','covered electronic response only'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(rows,indent=2))
