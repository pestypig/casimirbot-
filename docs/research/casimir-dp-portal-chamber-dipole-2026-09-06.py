"""Fixed-chamber source-displacement dipole, not a translated monopole."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import solve_bvp
from scipy.interpolate import CubicSpline
base=Path(__file__).parent
parent=base/'casimir-dp-portal-chamber-green-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='700d66e7954360999dc44812dba05fc3d57ea8b70355b74b3990d1a099b1b24b'
mod={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
p=mod['p'];mu=mod['mu'];hc=mod['hc'];ratio=mod['ratio']
def dipole(bg,vacuum=False,tol=1e-8):
    profiles=bg['profiles'];edges=np.array([0.]+[s['r_um'][-1] for s in profiles])*1e-6*mu/hc;length=np.diff(edges)
    spl=[CubicSpline(np.array(s['r_um'])*1e-6*mu/hc,s['u']) for s in profiles]
    def rhs(t,y):
        out=np.zeros_like(y)
        for k in range(3):
            x=edges[k]+length[k]*t;V=np.full_like(x,2.) if vacuum else (ratio if k==1 else 0)-1+3*spl[k](x)**2
            out[2*k]=length[k]*y[2*k+1]
            out[2*k+1]=length[k]*V*y[2*k]
            if k>0:out[2*k+1]+=2*length[k]*y[2*k+1]/x
        return out
    def bc(l,r):return np.array([l[0]-1,r[0]-l[2],r[1]-l[3],r[2]-l[4],r[3]-l[5],r[4]])
    mesh=np.linspace(0,1,301);y=np.zeros((6,len(mesh)));root2=math.sqrt(2)
    for k in range(3):
        x=edges[k]+length[k]*mesh;y[2*k]=(1+root2*x)*np.exp(-root2*x);y[2*k+1]=-2*x*np.exp(-root2*x)
    S=np.zeros((6,6));S[1,1]=2
    sol=solve_bvp(rhs,bc,mesh,y,S=S,tol=tol,max_nodes=30000)
    assert sol.success,sol.message
    def ev(r):
        x=r*1e-6*mu/hc;k=min(int(np.searchsorted(edges[1:],x,side='right')),2)
        return float(sol.sol((x-edges[k])/length[k])[2*k]),float(spl[k](x)),float(spl[k](x,1)),k,(x-edges[k])/length[k]
    return sol,ev,edges
rows=[]
for bg in p['rows']:
    sol,ev,edges=dipole(bg);mon,mev,_=mod['green'](bg);samples=[]
    for r in [1.,10.,100.]:
        j,u,up,k,t=ev(r);x=r*1e-6*mu/hc;h,_=mev(r);hp=float(mon.sol(t)[2*k+1]);jvac=(1+math.sqrt(2)*x)*math.exp(-math.sqrt(2)*x)
        samples.append({'distance_um':r,'dipole_j':j,'dipole_propagator_over_vacuum':j/jvac,'branch_potential_coefficient_over_vacuum':bg['central_field_fraction']*u*j/jvac,'naive_translated_potential_over_fixed_chamber_dipole':(u*(h-x*hp)-x*up*h)/(u*j)})
    rows.append({'cavity_radius_um':bg['radius_um'],'wall_thickness_um':bg['thickness_um'],'max_relative_residual':float(max(sol.rms_residuals)),'samples':samples})
vac,ev,edges=dipole(p['rows'][0],vacuum=True);errors=[]
k=math.sqrt(2);R=edges[-1];coef=(1+k*R)*math.exp(-k*R)/((1-k*R)*math.exp(k*R))
for r in [1.,10.,100.,1000.]:
    x=r*1e-6*mu/hc;exact=((1+k*x)*math.exp(-k*x)-coef*(1-k*x)*math.exp(k*x))/(1-coef)
    errors.append(abs(ev(r)[0]/exact-1))
bg=p['rows'][3];_,ev1,_=dipole(bg);_,ev2,_=dipole(bg,tol=1e-9)
ref=max(abs(ev1(r)[0]-ev2(r)[0]) for r in [1.,10.,100.])
checks={'analytic_finite_domain_vacuum':max(errors)<1e-6,'regular_origin_derivative':abs(vac.sol(0)[1])<1e-12,'collocation_residual':all(r['max_relative_residual']<1.1e-8 for r in rows),'refinement':ref<1e-7}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out={'checks':checks,'max_vacuum_relative_error':max(errors),'max_refinement_absolute_change':ref,'rows':rows,'scope':'First source-displacement derivative at cavity center, l=1 static Green function with fixed chamber. Point source, no finite-displacement error proof, transport, eikonal integration or coherence rate.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))

