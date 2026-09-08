"""Piecewise nonlinear spherical shell background for the matched scalar model."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import solve_bvp
base=Path(__file__).parent
src=base/'casimir-dp-portal-matched-density-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='2342070b54b1cce63ad4cda9947068d293fb32fd55c07132eaa257df1186d4b8'
p=json.loads(src.read_text());mu=.001;hc=1.973269804e-7
ratio=(p['Xe_mu_critical_eV_at_2900']/mu)**2
# x = mu r/(hbar c), w=x u; each material interval uses its own t in [0,1].
def solve(a_um,t_um,tail=8.,tol=1e-7,source_ratio=ratio):
    a=a_um*1e-6*mu/hc;b=a+t_um*1e-6*mu/hc
    edges=np.array([0.,a,b,b+tail]);length=np.diff(edges);mesh=np.linspace(0,1,201)
    def rhs(t,y):
        out=np.zeros_like(y)
        for j in range(3):
            x=edges[j]+length[j]*t;w=y[2*j]
            nonlinear=np.divide(w**3,x*x,out=np.zeros_like(w),where=x>0)
            out[2*j]=length[j]*y[2*j+1]
            out[2*j+1]=length[j]*(((source_ratio if j==1 else 0)-1)*w+nonlinear)
        return out
    def bc(left,right):return np.array([left[0],right[0]-left[2],right[1]-left[3],right[2]-left[4],right[3]-left[5],right[4]-edges[-1]])
    guess=np.zeros((6,len(mesh)))
    for j in range(3):guess[2*j]=edges[j]+length[j]*mesh;guess[2*j+1]=1.
    sol=solve_bvp(rhs,bc,mesh,guess,tol=tol,max_nodes=20000)
    assert sol.success,sol.message
    values=[];profiles=[]
    for j in range(3):
        ts=np.linspace(0,1,401);x=edges[j]+length[j]*ts;w=sol.sol(ts)[2*j]
        u=np.divide(w,x,out=np.full_like(w,float(sol.sol(0)[1])),where=x>0)
        values.extend(u.tolist());profiles.append({'r_um':(x*hc/mu*1e6).tolist(),'u':u.tolist()})
    assert min(values)>0 and max(values)<1+1e-7
    result={'radius_um':a_um,'thickness_um':t_um,'central_field_fraction':float(sol.sol(0)[1]),'inner_surface_field_fraction':float(sol.sol(1)[0]/a),'outer_surface_field_fraction':float(sol.sol(1)[2]/b),'max_relative_ODE_residual':float(max(sol.rms_residuals)),'max_boundary_residual':float(max(abs(bc(sol.y[:,0],sol.y[:,-1])))),'profiles':profiles}
    return result
rows=[solve(a,t) for a in [50.,250.,1000.] for t in [100.,1000.]]
# Tail and collocation refinement at both a suppressed and near-vacuum center.
refine=[]
for a,t in [(250.,1000.),(1000.,1000.)]:
    ref=solve(a,t,tail=12.,tol=1e-8)
    old=next(r for r in rows if r['radius_um']==a and r['thickness_um']==t)
    refine.append(abs(ref['central_field_fraction']-old['central_field_fraction']))
vac=solve(250.,1000.,source_ratio=0)
critical=(math.pi-math.atan(1/math.sqrt(ratio-1)))*hc/mu*1e6
checks={'zero_source_recovers_vacuum':abs(vac['central_field_fraction']-1)<1e-10,'ODE_and_interface_residuals':all(r['max_relative_ODE_residual']<1.1e-7 and r['max_boundary_residual']<1e-9 for r in rows),'tail_and_collocation_refinement':max(refine)<1e-6,'thicker_shell_reduces_center':all(next(r for r in rows if r['radius_um']==a and r['thickness_um']==1000)['central_field_fraction']<next(r for r in rows if r['radius_um']==a and r['thickness_um']==100)['central_field_fraction'] for a in [50.,250.,1000.])}
assert all(checks.values())
out={'checks':checks,'mu_eV':mu,'density_kg_m3_assumed':2900.,'density_over_critical':ratio,'semi_infinite_wall_linear_critical_radius_um':critical,'max_refinement_absolute_change':max(refine),'rows':rows,'scope':'Positive static radial branch, empty cavity and exterior, homogeneous finite shell, vacuum at far numerical boundary. Hypothetical geometry; no actual chamber attribution or rate. No global stability or thermal/transport admission.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'rows':[{k:v for k,v in r.items() if k!='profiles'} for r in rows]},indent=2))
