"""Uniform finite-sphere Yukawa eikonal upper envelope with exact branch separation."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import simpson,quad
from scipy.special import j0,spherical_jn
base=Path(__file__).parent
src=base/'casimir-dp-portal-plate-force-invariant-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='7e329ea1dae462ec34a8b16c376e04e0c2baa811e48aed3460f29433ec52b170'
p=json.loads(src.read_text());alpha=p['alpha_vacuum_fixed']
cfg=base.parent.parent/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design'];R=d['radius_m']*1e6;sep=d['branch_separation_m']*1e6;B=d['mass_kg']/1.66053906892e-27
m=math.sqrt(2)*.001/.1973269804 # inverse micrometres
qlo=1e-6;qhi=200/R
# Integrate positive momentum kernel in log q; retained branch factor is exact.
def integrate(n,perp=sep):
    x=np.linspace(math.log(qlo),math.log(qhi),n);q=np.exp(x);z=q*perp
    phase=1-j0(z);small=z<1e-3;zz=z[small];phase[small]=zz**2/4-zz**4/64+zz**6/2304
    F=3*spherical_jn(1,q*R)/(q*R)
    I=float(simpson(q*q*phase*F*F/(q*q+m*m)**2,x=x))
    # Positive omitted-tail ceilings: |F|<=1; |F|<=6/(qR)^2 for qR>=1.
    low=perp**2*qlo**4/(16*m**4);high=min(12/(R**4*qhi**6),9*perp**2/(4*R**4*qhi**4))
    return I,low+high
I,tail=integrate(120001);I2,_=integrate(240001)
speed=776.;v=speed/299792.458;flux=.3/1000*speed*1e5;t=d['hold_time_s']
pref=flux*t*(4*math.pi*alpha*B/v)**2/(2*math.pi)*1e-8
D=pref*(I+tail)
rows=[]
for plate in p['rows']:
    f0=plate['required_confinement_threshold_Hz']
    for cap in [1000.,10000.,100000.,1000000.]:
        strength=(cap/f0)**2
        rows.append({'density_kg_m3_benchmark':plate['density_kg_m3_benchmark'],'thickness_um_assumed':plate['plate_thickness_um_assumed'],'allowed_scalar_curvature_frequency_Hz_assumed':cap,'alpha_ceiling_from_linear_plate_force':alpha*strength,'conditional_vacuum_D_upper_at_force_ceiling':D*strength**2})
errs=[]
for z in [.1,1.,10.]:
    angular=quad(lambda a:1-math.cos(z*math.cos(a)),0,2*math.pi,epsabs=1e-12)[0]/(2*math.pi)
    errs.append(abs(angular/(1-j0(z))-1))
checks={'momentum_grid_refinement':abs(I2/I-1)<1e-7,'omitted_tails_small':tail/I<1e-7,'exact_azimuthal_branch_factor':max(errs)<1e-10,'zero_separation_zero':sum(integrate(1001,0))==0.}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out={'checks':checks,'quadrature_relative_change':abs(I2/I-1),'momentum_integral_um_squared':I,'omitted_tail_upper_um_squared':tail,'D_finite_sphere_vacuum_quadratic_envelope':D,'alpha_reference':alpha,'speed_km_s':speed,'sphere_radius_um':R,'separation_um':sep,'rows':rows,'scope':'Homogeneous-vacuum finite-sphere static Yukawa eikonal model, mono-speed transverse incidence, 1-cos phase <= phase^2/2. Includes finite radius/separation and all impact parameters in this model. Force translation uses separate weak-source plate approximation; no full chamber, halo, transport or accepted-shot prediction.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'thin_2900':[r for r in rows if r['density_kg_m3_benchmark']==2900 and r['thickness_um_assumed']==.1]},indent=2))

