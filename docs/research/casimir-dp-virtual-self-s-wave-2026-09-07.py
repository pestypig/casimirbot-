from pathlib import Path
import json,math
import numpy as np
from scipy.integrate import solve_bvp
root=Path(__file__).resolve().parent
p=json.loads((root/'casimir-dp-virtual-300mev-candidate-2026-09-07.json').read_text())['candidate']
rows=[]
M=100.;med=.3;beta=M*.1/med;gamma=2*M*.01/med**2;ah=p['y']**2/(8*math.pi)
for scalar in [False,True]:
 for speed in [0,30,200,1000,3000]:
  vals=[]
  for x0,L in [(3e-5,25.),(1e-5,35.)]:
   k=M*(speed/299792.458)/(2*med);x=np.geomspace(x0,L,1400)
   def fun(x,y):
    z=beta*np.exp(-x)/x;h=M*ah/med*np.exp(-x)/x if scalar else 0
    return np.array([y[1],(-h-k*k)*y[0]-z*y[2],y[3],-z*y[0]+(gamma-h-k*k)*y[2]])
   def bc(a,c):return np.array([a[0]-x0*a[1],a[2]-x0*a[3],c[1]-1,c[3]+math.sqrt(gamma-k*k)*c[2]])
   y=np.zeros((4,len(x)));y[0]=x;y[1]=1
   s=solve_bvp(fun,bc,x,y,tol=1e-8,max_nodes=25000)
   assert s.success,s.message
   if speed==0:val=(L-s.y[0,-1])/med
   else:val=(math.atan2(k*s.y[0,-1],s.y[1,-1])-k*L+math.pi/2)%math.pi-math.pi/2
   vals.append(val)
  difference=abs(vals[1]-vals[0])
  assert difference<1e-5
  rows.append(dict(scalar_included=scalar,relative_speed_km_s=speed,quantity='scattering_length_GeV_inverse' if speed==0 else 's_wave_phase_mod_pi_radians',coarse=float(vals[0]),fine=float(vals[1]),absolute_refinement=difference))

out=dict(status='scalar_and_vector_s_wave_only_not_halo_constraint',alpha_h=ah,rows=rows,omissions=['higher partial waves','halo velocity integration','complete observational constraints','coherence prediction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
