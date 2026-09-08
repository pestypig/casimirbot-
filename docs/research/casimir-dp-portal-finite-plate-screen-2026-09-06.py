"""Finite square-prism maximum-principle screen, not full apparatus solution."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
base=Path(__file__).parent
src=base/'casimir-dp-portal-matched-density-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='2342070b54b1cce63ad4cda9947068d293fb32fd55c07132eaa257df1186d4b8'
p=json.loads(src.read_text());an=p['a_N_GeV_inverse'];mn=.939;hc=1.973269804e-16
cfg=base.parent.parent/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design'];L=d['plate_size_m'];gap=d['gap_m'];convert=hc**3/1.7826619216279e-27
# Integral from zero to R of r asinh(z/r) dr, including the z=0 limit.
def J(z,R):
    if z==0:return 0.
    return .5*(R*R*math.asinh(z/R)+z*(math.sqrt(R*R+z*z)-z))
def external(side,thick,z):
    return 8*quad(lambda a:J(z+thick,side/(2*math.cos(a)))-J(z,side/(2*math.cos(a))),0,math.pi/4,epsabs=1e-22)[0]
def center(side,thick):
    return 16*quad(lambda a:J(thick/2,side/(2*math.cos(a))),0,math.pi/4,epsabs=1e-22)[0]
# Independent Cartesian quadrature, z integral performed analytically.
def cartesian(side,thick,z):
    x,w=np.polynomial.legendre.leggauss(100);x=(x+1)*side/4;w=w*side/4
    r=np.sqrt(x[:,None]**2+x[None,:]**2)
    return float(4*np.sum(w[:,None]*w[None,:]*(np.arcsinh((z+thick)/r)-np.arcsinh(z/r))))
rows=[]
for rho in [2900.,8600.]:
    factor=an*rho*convert/mn/(4*math.pi*hc*hc)
    for tum in [.1,1.,10.,80.]:
        thick=tum*1e-6
        U=factor*external(L,thick,gap);Utwo=2*factor*external(L,thick,gap/2)
        rows.append({'density_kg_m3_benchmark':rho,'thickness_um_assumed':tum,'one_plate_deficit_upper_10um':U,'one_plate_field_fraction_lower_10um':max(0.,1-U),'two_plate_midgap_deficit_upper':Utwo,'two_plate_midgap_field_fraction_lower':max(0.,1-Utwo),'one_plate_global_deficit_upper':factor*center(L,thick)})
err=abs(external(L,1e-5,gap)/cartesian(L,1e-5,gap)-1)
checks={'independent_cartesian_integral':err<1e-8,'quadratic_length_scaling':math.isclose(external(2*L,2e-5,2*gap),4*external(L,1e-5,gap),rel_tol=1e-12),'external_below_global':all(0<r['one_plate_deficit_upper_10um']<r['one_plate_global_deficit_upper'] for r in rows),'two_plate_bound_positive':all(0<r['two_plate_midgap_field_fraction_lower']<1 for r in rows)}
assert all(checks.values())
out={'checks':checks,'cartesian_relative_error':err,'side_m':L,'gap_m':gap,'rows':rows,'scope':'Positive static scalar branch u->1 at infinity, matched nucleon-density approximation, isolated square prisms. Maximum-principle deficit ceiling, not a fitted solution. Thickness/densities illustrative; mounts, chamber, other sources and fluctuating propagator absent.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
