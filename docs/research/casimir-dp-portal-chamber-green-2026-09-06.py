"""Static centered-source Green function on authenticated scalar-shell backgrounds."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import solve_bvp
from scipy.interpolate import CubicSpline
base=Path(__file__).parent
src=base/'casimir-dp-portal-spherical-chamber-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='e33690bdcb47b37b8953912893c62337250a99ed4fbeddc692e168e50795f01f'
p=json.loads(src.read_text());mu=p['mu_eV'];hc=1.973269804e-7;ratio=p['density_over_critical']
def green(row,vacuum=False,tol=1e-8):
    profiles=row['profiles'];edges=[profiles[0]['r_um'][0]]+[s['r_um'][-1] for s in profiles]
    edges=np.array(edges)*1e-6*mu/hc;length=np.diff(edges)
    splines=[CubicSpline(np.array(s['r_um'])*1e-6*mu/hc,s['u']) for s in profiles]
    def rhs(t,y):
        out=np.zeros_like(y)
        for j in range(3):
            x=edges[j]+length[j]*t
            V=2.+np.zeros_like(x) if vacuum else (ratio if j==1 else 0)-1+3*splines[j](x)**2
            out[2*j]=length[j]*y[2*j+1];out[2*j+1]=length[j]*V*y[2*j]
        return out
    def bc(l,r):return np.array([l[0]-1,r[0]-l[2],r[1]-l[3],r[2]-l[4],r[3]-l[5],r[4]])
    ts=np.linspace(0,1,301);guess=np.zeros((6,len(ts)))
    for j in range(3):
        x=edges[j]+length[j]*ts;guess[2*j]=np.exp(-math.sqrt(2)*x);guess[2*j+1]=-math.sqrt(2)*guess[2*j]
    sol=solve_bvp(rhs,bc,ts,guess,tol=tol,max_nodes=30000)
    assert sol.success,sol.message
    def evaluate(r_um):
        x=r_um*1e-6*mu/hc;j=min(int(np.searchsorted(edges[1:],x,side='right')),2)
        h=float(sol.sol((x-edges[j])/length[j])[2*j]);u=1. if vacuum else float(splines[j](x))
        return h,u
    return sol,evaluate,edges
rows=[]
for bg in p['rows']:
    sol,ev,edges=green(bg);samples=[]
    for r in [1.,10.,100.]:
        h,u=ev(r);x=r*1e-6*mu/hc;g_ratio=h/math.exp(-math.sqrt(2)*x)
        samples.append({'radius_from_source_um':r,'field_fraction_at_scatterer':u,'radial_Green_numerator_h':h,'G_over_vacuum_Yukawa':g_ratio,'center_to_scatterer_potential_over_vacuum':bg['central_field_fraction']*u*g_ratio})
    rows.append({'cavity_radius_um':bg['radius_um'],'wall_thickness_um':bg['thickness_um'],'central_field_fraction':bg['central_field_fraction'],'h_prime_at_origin':float(sol.sol(0)[1]),'max_relative_residual':float(max(sol.rms_residuals)),'samples':samples})
vac,ev,edges=green(p['rows'][0],vacuum=True)
errors=[]
for r in [1.,10.,100.,1000.]:
    x=r*1e-6*mu/hc;R=edges[-1]
    exact=math.sinh(math.sqrt(2)*(R-x))/math.sinh(math.sqrt(2)*R)
    errors.append(abs(ev(r)[0]/exact-1))
# Collocation sensitivity on a suppressed cavity, holding authenticated profile fixed.
bg=next(r for r in p['rows'] if r['radius_um']==250 and r['thickness_um']==1000)
_,e1,_=green(bg);_,e2,_=green(bg,tol=1e-9)
change=max(abs(e1(r)[0]-e2(r)[0]) for r in [1.,10.,100.])
checks={'vacuum_finite_domain_Green':max(errors)<1e-6,'collocation_residual':all(r['max_relative_residual']<1.1e-8 for r in rows),'positive_sample_Green_functions':all(s['radial_Green_numerator_h']>0 for r in rows for s in r['samples']),'tolerance_refinement':change<1e-7}
assert all(checks.values())
out={'checks':checks,'max_vacuum_relative_error':max(errors),'max_refinement_absolute_change':change,'rows':rows,'scope':'Static l=0 source at center only, phi fluctuations fixed zero at far boundary. Nuclear point-source potential diagnostic outside sphere, frozen nonlinear backgrounds. Not off-center branch difference, dynamic propagator, full scattering amplitude or decoherence rate.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
