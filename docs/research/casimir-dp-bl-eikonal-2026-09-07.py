"""Uniform-sphere elastic phase-screen decoherence, isotropic incidence."""
import json,math
from pathlib import Path
import numpy as np
from scipy.special import i0,k0
from scipy.interpolate import PchipInterpolator
from scipy.integrate import simpson
from numpy.polynomial.legendre import leggauss
p=Path(__file__).with_name('casimir-dp-bl-sphere-born-2026-09-07.json');prior=json.loads(p.read_text())
d=json.loads(Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json').read_text())['leading_design']
models=json.loads(p.with_name('casimir-dp-bl-two-mediator-screen-2026-09-07.json').read_text())['rows']
R=d['radius_m'];hc=1.973269804e-7;v=776/299792.458;Q=prior['sphere_BL_charge'];sep=d['branch_separation_m']/R
flux=.003*776e5*d['hold_time_s']*(R*100)**2
rows=[]
for model in models[:2]:
 a=model['masses_GeV'][0]*1e9*R/hc;alpha=model['effective_alpha_products'][0]
 gx,gw=leggauss(128);t=(gx+1)/2;wt=gw/2
 bs=np.linspace(0,1,2049)
 # Split radial projected-density integral at b to resolve its derivative.
 s1=bs[:,None]*t;s2=bs[:,None]+(1-bs[:,None])*t
 left=np.sum(wt*3*s1*np.sqrt(1-s1*s1)*i0(a*s1),axis=1)*bs
 right=np.sum(wt*3*s2*np.sqrt(1-s2*s2)*k0(a*s2),axis=1)*(1-bs)
 C=np.sum(wt*3*t*np.sqrt(1-t*t)*i0(a*t))
 values=2*alpha*Q/v*(k0(a*np.maximum(bs,1e-30))*left+i0(a*bs)*right)
 interp=PchipInterpolator(bs,values)
 def phase(b):
  flat=np.asarray(b);inside=flat<=1
  out=np.empty_like(flat);out[inside]=interp(flat[inside]);out[~inside]=2*alpha*Q/v*C*k0(a*flat[~inside])
  return out
 def integrate(nr,nphi,nmu,tail):
  b=np.geomspace(1e-6,max(4.,tail/a),nr);phis=2*np.pi*np.arange(nphi)/nphi
  mu,wmu=leggauss(nmu);tot=born=0.
  for u,weight in zip(mu,wmu):
   shift=sep*np.sqrt(1-u*u)
   other=np.sqrt(np.maximum(0,b[:,None]**2+shift**2+2*b[:,None]*shift*np.cos(phis)))
   delta=phase(b)[:,None]-phase(other)
   # Stable full phase and its quadratic limit, same impact coordinates.
   full=np.mean(2*np.sin(delta/2)**2,axis=1)
   weak=np.mean(delta**2/2,axis=1)
   tot+=weight/2*2*np.pi*simpson(b*b*full,x=np.log(b))
   born+=weight/2*2*np.pi*simpson(b*b*weak,x=np.log(b))
  return flux*tot,flux*born
 coarse=integrate(2049,128,24,16);fine=integrate(4097,256,48,24)
 ref=next(r['formal_Born_covered_D'] for r in prior['rows'] if r['masses_GeV']==model['masses_GeV'])
 assert abs(fine[1]/ref-1)<.005
 assert abs(fine[0]/coarse[0]-1)<.02
 assert 0<fine[0]<=fine[1]
 rows.append(dict(masses_GeV=model['masses_GeV'],eikonal_D=fine[0],quadratic_phase_D=fine[1],
  momentum_Born_D=ref,quadratic_recovery_relative=abs(fine[1]/ref-1),
  combined_grid_tail_refinement=abs(fine[0]/coarse[0]-1),central_phase=float(values[0])))
out=dict(status='conditional_uniform_sphere_eikonal_prediction_not_allowed_model',rows=rows,
 formula='sigma_dec(d_perp)=integral d^2b [1-cos(chi(b)-chi(b+d_perp))], averaged over incident directions',
 assumptions=['straight-line eikonal phase screen, uniform B-L sphere','same fixed incoming population and products','heavy 1-GeV mediator phase omitted as negligible in this macroscopic screen'],
 limitations=['not an exact partial-wave solution or full eikonal error bound','heavy phase omission not included in a rigorous total error budget',
 'no external coupling constraints, environment or underground transport','constant separation during hold, not full branch history'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
