from pathlib import Path
import json,math,hashlib
import numpy as np
from numpy.polynomial.legendre import leggauss
root=Path(__file__).resolve().parent;cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(cfg.read_text())['leading_design'];src=root/'casimir-dp-electron-contact-cross-check-2026-09-07.json';W=6*json.loads(src.read_text())['rows'][0]['W_at_reference_24_8_GeV_minus2']
N=c['mass_kg']/(12*1.6605390666e-27);v=776/299792.458;cs=18/299792.458;ma=12*.93149410242;T=4*8.617333262e-14;hc=1.973269804e-16
pref=.003*776e5*c['hold_time_s']*.3893793721e-27*N*W*W/(2*math.pi*v*v)
rows=[]
for frac in [.03,.1,1.]:
 Q=frac*2*math.pi*hc/3.57e-10;a=Q*c['branch_separation_m']/hc;b=Q*cs/(2*T);vals=[]
 assert cs+Q/(2*100)<v
 for n in [16,32]:
  z,w=leggauss(n);edges=np.linspace(0,1,max(10,math.ceil(a/math.pi))+1);x=edges[:-1,None]+np.diff(edges)[:,None]*(z+1)/2
  vals.append(float(np.sum(np.diff(edges)[:,None]*w/2*x*x/np.tanh(b*x)*(1-np.sinc(a*x/math.pi)))))
 assert abs(vals[1]/vals[0]-1)<1e-8
 rows.append(dict(cutoff_fraction_2pi_over_a=frac,q_cut_eV=Q*1e9,D=pref*Q**3/(2*ma*cs)*vals[-1],refinement_relative=abs(vals[1]/vals[0]-1)))
out=dict(status='long_wavelength_longitudinal_acoustic_contact_model_not_total_phonons',rows=rows,input_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),temperature_K=4,sound_speed_km_s=18,assumptions=['adiabatic six-electron density follows each carbon atom','linear isotropic LA dispersion','single-phonon emission and absorption, Debye-Waller factor set to one','no Umklapp, optical modes, finite-size mode discretization or microscopic response'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(rows,indent=2))
