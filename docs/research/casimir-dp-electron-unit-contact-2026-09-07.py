"""Covered electronic ELF contribution to fixed-separation coherence loss."""
import hashlib,json,math,sys
from pathlib import Path
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.integrate import simpson
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design']
models=[{}];v=776/299792.458;m=1e11;hc=1.973269804e-5
pref=2*.003*29979245800/(math.pi*(1/137.035999084)*v*hc*3.51)*d['mass_kg']*1000*d['hold_time_s']
rows=[]
for label,h in [('withLFE','467ad77324dec54c4000c10405d8b1de958e6e935ed8368d6906a390c048d229'),('noLFE','cce62a651d8d624c428555e08dd2796a25dac2f73a1979db1e9bc562416f8630')]:
 p=Path(sys.argv[1])/'data/C'/f'Diamond_LMZZ_yambo_{label}.dat'
 assert hashlib.sha256(p.read_bytes()).hexdigest()==h
 a=np.loadtxt(p,skiprows=1);w,q=np.unique(a[:,0]),np.unique(a[:,1])
 grid=np.empty((len(w),len(q),2));grid[np.searchsorted(w,a[:,0]),np.searchsorted(q,a[:,1])]=a[:,2:]
 interp=RegularGridInterpolator((w,q),grid,bounds_error=True)
 for model in models:
  # Unit contact potential W=1 GeV^-2; A=W/(4pi) in eV^-2.
  vals=[]
  for n in [512,1024]:
   onset=2*w[0]/(v+math.sqrt(v*v-2*w[0]/m))
   qs=np.geomspace(onset,q[-1],n+1);upper=np.minimum(w[-1],qs*v-qs**2/(2*m));upper=np.maximum(upper,w[0])
   z=np.linspace(0,1,n+1);ws=w[0]+(upper[:,None]-w[0])*z
   pts=np.stack([ws,np.broadcast_to(qs[:,None],ws.shape)],axis=-1)
   eps=interp(pts);elf=eps[...,1]/np.sum(eps**2,axis=-1);assert np.all(elf>=0)
   inner=simpson(elf,x=z,axis=1)*(upper-w[0])
   amp=np.full_like(qs,1e-18/(4*math.pi))
   phase=qs*d['branch_separation_m']/(hc/100)
   filt=1-np.sinc(phase/np.pi)
   val=pref*simpson(qs**4*amp**2*inner*filt,x=np.log(qs))
   event=pref*simpson(qs**4*amp**2*inner,x=np.log(qs))
   assert abs(val/event-1)<=1/phase.min()+1e-10
   vals.append(float(val))
  drift=abs(vals[-1]/vals[-2]-1);assert drift<.01
  rows.append(dict(response=label,unit_contact_D=vals[-1],contact_W_for_DP_comparator_GeV_minus2=math.sqrt(.029511464722144533/vals[-1]),refinement_relative=drift))
out=dict(status='conditional_unit_electron_density_contact_response_not_matching',rows=rows,
 formula='D=2 n c M t/(pi alpha_EM v hbarc rho) integral dq q^3 A(q)^2 [1-sinc(qd/hbar)] integral dOmega ELF',
 assumptions=['bulk isotropic zero-temperature electronic response','fixed separated branches during hold','unit momentum-independent electron number-density potential W=1 GeV^-2; not a matched model'],
 limitations=['only 5.5-50 eV and q within tabulated 0-30.614 keV domain','local-field comparison is not a total uncertainty bound','no subgap phonons, finite-surface response, preparation or recombination history','not a captured-population or measurability prediction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(rows,indent=2))
