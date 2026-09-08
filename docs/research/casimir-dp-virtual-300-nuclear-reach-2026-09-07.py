import json,math,hashlib
from pathlib import Path
import numpy as np
from numpy.polynomial.legendre import leggauss
base=Path(__file__).parent;src=base/'casimir-dp-virtual-nuclear-match-2026-09-07.py'
ns={'__file__':str(src)};exec(src.read_text().split('\ndef run(n):')[0],ns)
source=base/'casimir-dp-virtual-300mev-candidate-2026-09-07.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='54fc7fe2ae81ff6062486128741a26c7bfa3931b5baf18e0286934bbd8134884'
a=json.loads(source.read_text())['candidate'];ns['med']=a['mediator_GeV'];B=a['effective_alpha']**2/a['gap_GeV']
a['carbon_forward_W_GeV_minus2']=float(ns['kernel'](12,6,768)(0)*B)
cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json').read_text())['leading_design']
N=c['mass_kg']/(12*1.66053906660e-27);v=776/299792.458;ma=12*.93149410242-6*.00051099895;mu=100*ma/(100+ma);qmax=2*mu*v
rows=[]
for n in [96,192]:
 x,w=leggauss(n);q=qmax*(x+1)/2;W=ns['kernel'](12,6,768)(q)*B
 sigma=qmax/2*np.sum(w*q*W*W)/(2*math.pi*v*v)*.3893793721e-27
 rows.append(float(sigma))
assert abs(rows[0]/rows[1]-1)<1e-8
mean=.003*776e5*c['hold_time_s']*N*rows[1]
upper_sigma=mu**2*a['carbon_forward_W_GeV_minus2']**2/math.pi*.3893793721e-27
assert rows[1]<=upper_sigma
out=dict(carbon_forward_W_GeV_minus2=a['carbon_forward_W_GeV_minus2'],status='independent_free_carbon_impulse_benchmark_not_inclusive_solid_bound',
 total_cross_section_cm2=rows[1],mean_events_in_hold=mean,
 decoherence_filter_bound_twice_events=2*mean,
 forward_amplitude_cross_section_envelope_cm2=upper_sigma,
 max_free_carbon_recoil_keV=qmax*qmax/(2*ma)*1e6,
 refinement_relative=abs(rows[0]/rows[1]-1),
 assumptions=['same xenon-normalized virtual nuclear interaction','independent stationary free carbon nuclei',
 'entire kinematic interval; low-q portion not validated as solid impulse response',
 'no coherent pair terms, electrons or phonon response; not added to continuum result'])
R=c['radius_m']/1.973269804e-16
pref=.003*776e5*c['hold_time_s']*.3893793721e-27/(2*math.pi*v*v)*(N*a['carbon_forward_W_GeV_minus2']/R)**2
out['separate_smooth_sphere_loose_D_bound']=26.5*pref
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
