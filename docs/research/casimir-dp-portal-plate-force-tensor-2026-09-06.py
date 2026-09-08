"""Three-dimensional plate force curvature in the matched weak-source model."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
parent=base/'casimir-dp-portal-plate-force-invariant-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='5776eae754d7a3388283f64850d7ef1a03c6e4d72461bd36e5f2ba208300196d'
mod={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
Q=mod['Q'];m=mod['m'];side=mod['side'];z0=mod['z'];c=mod['c'];fixed=mod['fixed'];conv=mod['conv'];mn=mod['mn'];hc=mod['hc']
def tensor(tum,n=70):
    t=tum*1e-6
    g,w=np.polynomial.legendre.leggauss(n);x=(g+1)*side/4;wx=w*side/4
    gz,wz=np.polynomial.legendre.leggauss(28);zz=z0+(gz+1)*t/2;wz=wz*t/2
    X=x[:,None,None];Y=x[None,:,None];Z=zz[None,None,:];R=np.sqrt(X*X+Y*Y+Z*Z)
    W=8*wx[:,None,None]*wx[None,:,None]*wz[None,None,:];exp=np.exp(-m*R)
    common=m*m/R**3+3*m/R**4+3/R**5;diag=m/R**2+1/R**3
    H=[float(np.sum(W*exp*(common*A*A-diag))) for A in [X,Y,Z]]
    I=float(np.sum(W*exp/R));return H,I
rows=[];errors=[]
for rho in [2900.,8600.]:
    pref=c*c*fixed*rho*conv/(mn*mn*4*math.pi*hc*hc)
    for tum in [.1,1.,10.]:
        H,I=tensor(tum);analyticZ=2*(Q(z0)-Q(z0+tum*1e-6));errors.append(abs(H[2]/analyticZ-1))
        rows.append({'density_kg_m3_benchmark':rho,'plate_thickness_um':tum,'normal_acceleration_curvature_s_inverse_squared':pref*H[2],'parallel_acceleration_curvature_s_inverse_squared':pref*H[0],'normal_instability_frequency_Hz':math.sqrt(pref*H[2])/(2*math.pi),'parallel_restoring_frequency_Hz':math.sqrt(-pref*H[0])/(2*math.pi),'trace_s_inverse_squared':pref*sum(H),'relative_Helmholtz_trace_error':abs(sum(H)/(m*m*I)-1)})
H1,_=tensor(1.,70);H2,_=tensor(1.,100);ref=max(abs(a/b-1) for a,b in zip(H1,H2))
checks={'independent_normal_curvature':max(errors)<1e-6,'Helmholtz_trace_identity':all(r['relative_Helmholtz_trace_error']<1e-10 for r in rows),'one_unstable_two_restoring_directions':all(r['normal_acceleration_curvature_s_inverse_squared']>0 and r['parallel_acceleration_curvature_s_inverse_squared']<0 and r['trace_s_inverse_squared']>0 for r in rows),'quadrature_refinement':ref<1e-6}
assert all(checks.values())
out={'checks':checks,'normal_crosscheck_relative_error':max(errors),'quadrature_relative_change':ref,'rows':rows,'scope':'Linearized scalar force tensor at symmetry center of isolated square plates, vacuum background and weak-source approximation. Scalar-induced restoring directions are not an authenticated apparatus trap. No global trajectory or decoherence prediction.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
