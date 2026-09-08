from pathlib import Path
import json,hashlib,math
import numpy as np
from scipy.integrate import solve_bvp
root=Path(__file__).resolve().parent;src=root/'casimir-dp-virtual-300mev-candidate-2026-09-07.json';p=json.loads(src.read_text())['candidate']
M=p['dark_mass_GeV'];med=p['mediator_GeV'];delta=p['gap_GeV'];ad=p['alpha_D'];beta=M*ad/med;gamma=2*M*delta/med**2
rows=[]
for x0,L in [(1e-4,20.),(3e-5,30.),(1e-5,30.)]:
 x=np.geomspace(x0,L,1200)
 def fun(x,y):
  z=beta*np.exp(-x)/x
  return np.array([y[1],-z*y[2],y[3],-z*y[0]+gamma*y[2]])
 def bc(a,c):return np.array([a[0]-x0*a[1],a[2]-x0*a[3],c[1]-1,c[3]+math.sqrt(gamma)*c[2]])
 y=np.zeros((4,len(x)));y[0]=x;y[1]=1
 s=solve_bvp(fun,bc,x,y,tol=1e-8,max_nodes=20000)
 assert s.success,s.message
 rows.append(dict(x_min=x0,x_max=L,scattering_length_GeV_inverse=(L-s.y[0,-1])/med,max_residual=float(max(s.rms_residuals)),nodes=len(s.x)))
rel=abs(rows[-1]['scattering_length_GeV_inverse']/rows[-2]['scattering_length_GeV_inverse']-1)
assert rel<2e-6
out=dict(status='zero_energy_vector_only_coupled_channel_diagnostic',source_sha256=hashlib.sha256(src.read_bytes()).hexdigest(),beta=beta,gamma=gamma,real_pair_excitation_threshold_relative_km_s=math.sqrt(8*delta/M)*299792.458,rows=rows,last_cutoff_relative=rel,omissions=['scalar diagonal potential','finite-velocity partial waves','spin statistics and transport weighting','halo distribution and observational inference'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
