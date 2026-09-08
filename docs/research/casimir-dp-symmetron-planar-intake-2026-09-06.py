"""Ideal one-plane symmetron background, no recoil or decoherence rate claim."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import solve_bvp
cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha=hashlib.sha256(cfg.read_bytes()).hexdigest()
assert sha=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
# x=mu*z, psi=phi/(mu/sqrt(lambda)); field vacuum and ideal dense wall.
x=np.linspace(0,12,401)
analytic=np.tanh(x/math.sqrt(2))
def ode(x,y):return np.vstack((y[1],-y[0]+y[0]**3))
def bc(a,b):return np.array([a[0],b[0]-math.tanh(12/math.sqrt(2))])
result=solve_bvp(ode,bc,x,np.vstack((1-np.exp(-x),np.exp(-x))),tol=1e-9,max_nodes=10000)
error=float(np.max(abs(result.sol(x)[0]-analytic)))
hc=1.973269804e-7;z=10e-6
rows=[]
for mu in [.001,.01,.1]:
    phi_ratio=math.tanh(mu*z/(math.sqrt(2)*hc))
    rows.append({'mu_eV':mu,'illustrative_z_m':z,'far_vacuum_fluctuation_range_m':hc/(math.sqrt(2)*mu),'background_phi_over_far_vev':phi_ratio,'two_local_vertices_product_over_far_value':phi_ratio**2,'squared_vertex_product_over_far_value':phi_ratio**4})
checks={'nonlinear_BVP_converged':result.success,'profile_matches_analytic':error<1e-7,'wall_and_far_boundary_conditions':abs(result.sol(0)[0])<1e-10 and abs(result.sol(12)[0]-analytic[-1])<1e-10,'local_vertex_suppression_not_enhancement':all(0<r['squared_vertex_product_over_far_value']<1 for r in rows)}
checks={k:bool(v) for k,v in checks.items()}
assert all(checks.values())
out={'checks':checks,'max_profile_error':error,'config_sha256':sha,'rows':rows,'scope':'Infinite perfectly screened plane and empty half-space; same broken vacuum at infinity; no sphere backreaction, finite geometry, gas or DM density. Vertex ratios are not scattering-rate ratios: inhomogeneous propagator and environmental state uncomputed. z=10um is illustrative, not an authenticated branch coordinate.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
