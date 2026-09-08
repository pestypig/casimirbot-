"""Conditional covered ER spectrum folded through released XENON1T response."""
import hashlib,json,sys
from pathlib import Path
import numpy as np
from scipy.interpolate import interp1d
from scipy.integrate import simpson
# Reuse audited spectral-density normalization and authenticated atomic inputs.
p=Path(__file__).with_name('casimir-dp-xenon-electron-covered-2026-09-07.py')
source=p.read_text(); ns={'__file__':str(p),'__name__':'fold_inputs'}
exec(compile(source.split('\nrows=[]',1)[0],str(p),'exec'),ns)
root=Path(sys.argv[2]);rp=root/'s2_response_er.csv'
assert hashlib.sha256(rp.read_bytes()).hexdigest()=='24bc8d0548ec1e405240177ee5e84c89121592eb44dd96a2608bf573878a334a'
a=np.genfromtxt(rp,delimiter=',',names=True)
cols=[k for k in a.dtype.names if k.startswith('s2_bin_')]
R=np.column_stack([a[k] for k in cols]);re=a['energy_kev']*1000
response=interp1d(np.log(re),R,axis=0,bounds_error=True)
q=ns['q'];v=ns['v'];m=ns['m'];K=ns['interp']
pref=ns['pref']*356770/(2840*365)
common=json.loads(ns['p'].read_text())
rows=[]
for row in [{}]:
 # W=1 GeV^-2 contact electron density potential.
 def fold(floor,n):
  es=np.geomspace(floor,min(re[-1],ns['E'][-1]),n+1)
  qlo=np.maximum(q[0],2*es/(v+np.sqrt(v*v-2*es/m)))
  qhi=np.minimum(q[-1],m*(v+np.sqrt(v*v-2*es/m)))
  z=np.linspace(0,1,n+1)
  qs=np.exp(np.log(qlo)[:,None]+np.log(qhi/qlo)[:,None]*z)
  qs=np.clip(qs,q[0],q[-1])
  pts=np.stack([np.broadcast_to(np.log(es)[:,None],qs.shape),np.log(qs)],axis=-1)
  amp=np.full_like(qs,1e-18/(4*np.pi))
  spectrum=pref*simpson(qs**2*amp**2*K(pts),x=z,axis=1)*np.log(qhi/qlo)
  raw=simpson(es*spectrum,x=np.log(es))
  bins=simpson((es*spectrum)[:,None]*response(np.log(es)),x=np.log(es),axis=0)
  assert np.all(bins>=0) and bins.sum()<=raw
  return raw,bins
 variants=[]
 for floor in [186.]:
  coarse=fold(floor,512);raw,bins=fold(floor,1024)
  error=abs(bins.sum()/coarse[1].sum()-1);assert error<.01
  variants.append(dict(energy_floor_eV=floor,raw_events=raw,
   selected_events_all_released_S2_bins=float(bins.sum()),
   refinement_relative=error,selected_bin_counts=bins.tolist()))
 rows.append(dict(unit_contact_W_GeV_minus2=1.,variants=variants))
out=dict(status='conditional_covered_detector_prediction_not_exclusion',
 baseline_script_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
 exposure_kg_day=356770,response_sha256=hashlib.sha256(rp.read_bytes()).hexdigest(),rows=rows,
 assumptions=['fixed mono-speed flux at XENON1T, without transport','published ER response including selections','linear response interpolation in log energy','same covered atomic K response and unit contact W=1 GeV^-2'],
 limitations=['all released S2 bins, not a model-specific statistical ROI','50 eV variant extends below published analysis cutoff and is sensitivity only','no liquid-wavefunction correction or omitted atomic tail estimate','no likelihood, systematic profiling, or confidence limit'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(rows[0]['variants'][0]['selected_events_all_released_S2_bins'])
