"""Real Yukawa sphere eikonal overlap; restricted velocity interval."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from numpy.polynomial.legendre import leggauss
from scipy.integrate import cumulative_simpson,quad
from scipy.interpolate import CubicSpline
from scipy.special import i0,k0
b=Path(__file__).parent;p=b/'casimir-dp-axial-sphere-fold-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='3d8582e219cdf5144a4a844030f95dcf12eb9b86547f49d5f129f2387dde8f8d'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
p=b/'casimir-dp-dark-scalar-sphere-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='f09759040f9a9b2e3b87fef034cb7e7ccc292e9974561b9a79e1d0f1080740d3'
old=json.loads(p.read_text());a=1e-9*n['R'];u=np.linspace(1e-10,1,30001);density=u*np.sqrt(1-u*u)
ci=cumulative_simpson(density*i0(a*u),x=u,initial=0)
ck=cumulative_simpson(density*k0(a*u),x=u,initial=0)
J=k0(a*u)*ci+i0(a*u)*(ck[-1]-ck);spline=CubicSpline(u,J)
def profile(t):
    return np.where(t<1,spline(np.minimum(t,1)),k0(a*np.maximum(t,1))*ci[-1])
def gl(count,lo,hi):
    x,w=leggauss(count);return lo+(x+1)*(hi-lo)/2,w*(hi-lo)/2
halo=n['halo'];ckm=n['ckm'];h=n['h'];vlo=10.
def calc(row,res):
    m=row['mchi_GeV'];phase=row['formal_target_phase_at_300km_s']
    bb=[];ww=[]
    for lo,hi in [(0,2),(2,6),(6,16)]:
        x,w=gl(res,lo,hi);bb.extend(x);ww.extend(w)
    t=np.array(bb)[:,None,None];bw=np.array(ww)[:,None,None]
    mu,mw=gl(res//4,0,1);phi,pw=gl(res//2,0,2*math.pi)
    d=n['sep']*np.sqrt(1-mu[None,:,None]**2)
    cosine=np.cos(phi[None,None,:])
    rplus=np.sqrt(t*t+d*d/4+t*d*cosine);rminus=np.sqrt(t*t+d*d/4-t*d*cosine)
    diff=(profile(rplus)-profile(rminus))/J[0]
    weight=t*bw*mw[None,:,None]*pw[None,None,:]
    born_area=np.sum(weight*diff**2/2)
    total=0.;born=0.
    for lo,hi in [(vlo,halo[1]-halo[2]),(halo[1]-halo[2],halo[1]+halo[2])]:
        vs,ws=gl(res,lo,hi)
        for v,w in zip(vs,ws):
            z=diff*phase*300/v
            flux=w*h['pdf'](v,*halo)*v*1e5
            total+=flux*np.sum(weight*2*np.sin(z/2)**2)
            born+=flux*born_area*(phase*300/v)**2
    factor=.3/m*n['d']['hold_time_s']*(n['d']['radius_m']*100)**2
    return total*factor,born*factor
low=quad(lambda v:h['pdf'](v,*halo)*ckm/v if v else 0,0,vlo,epsabs=1e-12)[0]/n['meaninv']
rows=[]
for row in old['rows']:
    if row['scalar_mass_GeV']!=1e-9:continue
    coarse=calc(row,128);fine=calc(row,192)
    expected=.0295114647221*(1-low)
    rows.append(dict(mchi_GeV=row['mchi_GeV'],theta=row['formal_theta_for_target'],D_eikonal_v_ge_10=fine[0],D_quadratic_v_ge_10=fine[1],eikonal_over_quadratic=fine[0]/fine[1],quadrature_relative_change=abs(coarse[0]/fine[0]-1),born_recovery_relative_error=abs(fine[1]/expected-1),omitted_low_velocity_quadratic_D=.0295114647221*low))
assert all(r['D_eikonal_v_ge_10']<=r['D_quadratic_v_ge_10'] for r in rows)
assert all(r['born_recovery_relative_error']<1e-4 for r in rows)
out=dict(scope='Real static uniform sphere, 1eV Yukawa only; heavy Higgs neglected at sphere momentum. Isotropic separation average, straight paths, velocity10km/s to halo maximum, b/R<=16. Low-velocity quadratic remainder is within eikonal theory only, not an exact scattering bound. No full-solid or detector admission.',rows=rows,profile_grid_points=len(u),low_velocity_inverse_moment_fraction=low,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))

