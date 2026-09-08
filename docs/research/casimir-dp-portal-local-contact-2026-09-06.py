"""Same-coupling local contact screens: explicitly distinct response assumptions."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad,simpson
from scipy.special import spherical_jn
base=Path(__file__).parent
parent=base/'casimir-dp-photon-shared-halo-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='23a3cdfd24c5dfe608558285176c9829ec1d0af66b70d451f676d8470cba2542'
mod={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
source=base/'casimir-dp-portal-contact-spectrum-2026-09-06.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='71e7107657b52802e43b2c57439725c2b625a913ac11f4aaf426485fc940a799'
xe=json.loads(source.read_text());C=xe['C_chiN_GeV_inverse_squared']
config=base.parent.parent/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(config.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
cfg=json.loads(config.read_text());d=cfg['leading_design'];Ddp=cfg['frozen_diosi']['gaussian_exponent_at_hold']
u=1.66053906892e-27;hc=1.973269804e-16;conv=.3893793721e-27;c=29979245800.
# C12 approximation; this is not an as-built isotope inventory.
NC=d['mass_kg']/(12*u);B=12*NC;R=d['radius_m']/hc;t=d['hold_time_s'];mC=12*.93149410242-6*.00051099895
rows=[]
for old in xe['rows']:
    mass=old['mass_GeV'];h=mod['scenarios'][old['halo']];M=mod['Moments'](h)
    v=M.v;f=mod['pdf'](v,h);mean=float(simpson(v*f,x=v));eta0=float(M(0)[0])
    exposure=.3/mass*c*t*conv
    red=mass*mC/(mass+mC)
    # Stationary independent C12, F=1 overestimates its elastic nuclear channel.
    Nfree=exposure*mean*NC*C*C*12**2*red*red/math.pi
    # Rigid uniform sphere, integrate q^2 F_sphere^2 to infinity as a rate bound.
    Nrigid=exposure*C*C*B*B/(4*math.pi)*9/(2*R*R)*eta0
    # Positive one-body density static closure, omega>=0, q<=Qcap.
    cap=.01 # GeV; 10 MeV momentum-limited envelope, not full portal response.
    qlim=np.minimum(2*mass*v,cap)
    integrand=np.divide(f*qlim**2,v,out=np.zeros_like(v),where=v>0)
    Ncap=exposure*C*C*B*B/(4*math.pi)*float(simpson(integrand,x=v))
    # Formal extension of that density model to its full DM kinematic range.
    Nformal=exposure*C*C*B*B*mass*mass/math.pi*mean
    scale=(old['C_conditional_upper_GeV_inverse_squared']/C)**2
    row={'halo':old['halo'],'mass_GeV':mass,'D_free_C12_channel_upper':2*Nfree,'D_rigid_uniform_sphere_upper':2*Nrigid,'D_positive_density_q_under_10MeV_upper':2*Ncap,'D_formal_all_q_density_envelope':2*Nformal,'count_ceiling_coupling_squared_scale':scale}
    for key in list(row):
        if key.startswith('D_'):row[key+'_at_Xe_count_ceiling']=row[key]*scale
    row['DP_over_formal_envelope_at_ceiling']=Ddp/(2*Nformal*scale)
    rows.append(row)
# Independent quadrature of the uniform-sphere integral: tail is positive O(1/X^2).
X=2000.
val=sum(quad(lambda x:9*spherical_jn(1,x)**2/x,a,min(a+math.pi,X),epsabs=1e-11)[0] for a in np.arange(0,X,math.pi))
checks={'sphere_integral_9_over_4':abs(val/(9/4)-1)<1e-6,'all_positive_and_cap_below_formal':all(0<r['D_positive_density_q_under_10MeV_upper']<r['D_formal_all_q_density_envelope'] for r in rows),'free_and_rigid_below_formal':all(max(r['D_free_C12_channel_upper'],r['D_rigid_uniform_sphere_upper'])<r['D_formal_all_q_density_envelope'] for r in rows),'C_squared_scaling':all(math.isclose(r['D_free_C12_channel_upper_at_Xe_count_ceiling']/r['D_free_C12_channel_upper'],r['count_ceiling_coupling_squared_scale'],rel_tol=1e-12) for r in rows)}
assert all(checks.values())
out={'checks':checks,'C_chiN_GeV_inverse_squared':C,'C12_atoms':NC,'effective_nucleon_number':B,'frozen_DP_exponent':Ddp,'sphere_integral_numeric':val,'rows':rows,'scope':'Born scalar nuclear-density component only. D<=2N is an unconditional collisional envelope, not postselected visibility. Free C12 and rigid continuum are different approximations and are not added. Positive-density closure assumes nonnegative energy transfer; 10MeV cutoff is explicit. All-q extension is diagnostic, not QCD/thermal/electron/full-portal bound.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'central_1TeV':next(r for r in rows if r['halo']=='central' and r['mass_GeV']==1000)},indent=2))
