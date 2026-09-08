"""Common shifted-halo tensor moment for scalar rigid-sphere envelope and Xe."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import simpson
from scipy.special import spherical_jn
base=Path(__file__).parent
src=base/'casimir-dp-portal-finite-sphere-force-envelope-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='bbdcbe13a829d41385b8023219544f4fb40239c659ed27d320a21c81bcce1e1d'
p=json.loads(src.read_text());xe_src=base/'casimir-dp-portal-contact-spectrum-2026-09-06.json'
assert hashlib.sha256(xe_src.read_bytes()).hexdigest()=='71e7107657b52802e43b2c57439725c2b625a913ac11f4aaf426485fc940a799'
xe=json.loads(xe_src.read_text());parent=base/'casimir-dp-photon-shared-halo-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='23a3cdfd24c5dfe608558285176c9829ec1d0af66b70d451f676d8470cba2542'
mod={'__file__':str(parent)};exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
R=p['sphere_radius_um'];d=p['separation_um'];m=math.sqrt(2)*.001/.1973269804
lo=1e-6;hi=200/R;x=np.linspace(math.log(lo),math.log(hi),120001);q=np.exp(x);F=3*spherical_jn(1,q*R)/(q*R)
J=float(simpson(d*d/4*q**4*F*F/(q*q+m*m)**2,x=x))
# Positive tails for quadratic separation envelope.
J+=d*d*lo**4/(16*m**4)+9*d*d/(4*R**4*hi**4)
vmono=p['speed_km_s']/299792.458
baseD=p['D_finite_sphere_vacuum_quadratic_envelope']
baseI=p['momentum_integral_um_squared']+p['omitted_tail_upper_um_squared']
def tensor(h,n=4001,nt=80):
    v0,esc,earth=np.array(h)/299792.458;z=esc/v0;N=math.erf(z)-2*z*math.exp(-z*z)/math.sqrt(math.pi)
    # Include the velocity where angular truncation begins as an exact grid boundary.
    split=esc-earth;v=np.unique(np.r_[np.linspace(0,split,n//2),np.linspace(split,esc+earth,n//2)])
    tmax=np.clip(np.divide(esc**2-v*v-earth**2,2*v*earth,out=np.ones_like(v),where=v>0),-1,1)
    g,w=np.polynomial.legendre.leggauss(nt);mu=-1+(g[None,:]+1)*(tmax[:,None]+1)/2
    weights=w[None,:]*(tmax[:,None]+1)/2
    dist=np.exp(-(v[:,None]**2+earth**2+2*v[:,None]*earth*mu)/v0**2)/(N*math.pi**1.5*v0**3)
    angular=2*math.pi*dist*weights
    eta=float(simpson(v*np.sum(angular,axis=1),x=v))
    para=float(simpson(v*np.sum(angular*(1-mu*mu),axis=1),x=v))
    perp=float(simpson(v*np.sum(angular*(1+mu*mu)/2,axis=1),x=v))
    norm=float(simpson(v*v*np.sum(angular,axis=1),x=v))
    return eta,para,perp,norm
rows=[];errs=[]
for name,h in mod['scenarios'].items():
    eta,parallel,perpendicular,norm=tensor(h);expected=float(mod['Moments'](h)(0)[0]);errs.append(abs(eta/expected-1))
    for old in [r for r in xe['rows'] if r['halo']==name]:
        mass=old['mass_GeV'];factor=baseD/baseI*J*vmono*1000/mass
        rows.append({'halo':name,'mass_GeV':mass,'Xe_heavy_raw_wide':old['Xe_raw_5p4_269p9'],'Xe_heavy_raw_high':old['Xe_raw_200_270'],'D_local_parallel_to_wind_upper':factor*parallel,'D_local_perpendicular_to_wind_upper':factor*perpendicular,'inverse_speed_moment':eta,'parallel_weighted_moment':parallel,'perpendicular_weighted_moment':perpendicular,'halo_normalization':norm})
a=tensor(mod['scenarios']['central']);b=tensor(mod['scenarios']['central'],n=8001,nt=120)
ref=max(abs(x/y-1) for x,y in zip(a,b))
checks={'halo_normalization':all(abs(r['halo_normalization']-1)<1e-7 for r in rows),'independent_inverse_speed':max(errs)<1e-6,'tensor_trace':all(math.isclose(r['parallel_weighted_moment']+2*r['perpendicular_weighted_moment'],2*r['inverse_speed_moment'],rel_tol=1e-12) for r in rows),'angular_velocity_refinement':ref<1e-7}
assert all(checks.values())
out={'checks':checks,'quadratic_separation_kernel_um_squared':J,'max_inverse_speed_relative_error':max(errs),'refinement_relative_change':ref,'rows':rows,'scope':'Same unattenuated shifted halo and matched tree parameters for heavy Xe component and homogeneous-vacuum rigid-sphere eikonal upper envelope. Angular separation inequality; no full chamber, halo transport, slow-speed validity proof, experimental acceptance or full portal prediction.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'central':[r for r in rows if r['halo']=='central']},indent=2))
