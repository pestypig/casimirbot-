"""Weak-source finite-plate force identity at fixed leading scattering strength."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
base=Path(__file__).parent
src=base/'casimir-dp-portal-matched-density-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='2342070b54b1cce63ad4cda9947068d293fb32fd55c07132eaa257df1186d4b8'
assert hashlib.sha256((base/'casimir-dp-portal-force-tradeoff-2026-09-06.json').read_bytes()).hexdigest()=='a578be25fbfaffc74331e3b77247ea834d5f361159eed282653e32d906813b94'
p=json.loads(src.read_text());trade=json.loads((base/'casimir-dp-portal-force-tradeoff-2026-09-06.json').read_text());endpoint=trade['rows'][-1]
an=p['a_N_GeV_inverse'];C=endpoint['C_chiN_recovered'];y=abs(endpoint['y_chi']);b=endpoint['b_GeV'];v=246.2;mh=125.;mS=1000.;mn=.939
A=np.array([[mS*mS,b*v],[b*v,mh*mh+(b*v)**2/(mS*mS-mh*mh)]]);K=np.linalg.inv(A);Kss=float(K[0,0])
alpha=p['a_chi_GeV_inverse']*an/(4*math.pi) # phi_vac(original)=1 GeV
fixed=4*math.pi*alpha*C/(y*y*Kss)
hc=1.973269804e-16;hcev=1.973269804e-7;conv=hc**3/1.7826619216279e-27;c=299792458.
cfg=base.parent.parent/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design'];side=d['plate_size_m'];z=d['gap_m']/2;m=math.sqrt(2)*.001/hcev
# Q(z) = integral over square of z exp(-m r)(1+m r)/r^3 dA.
def Q(z,screening=m):
    return 8*quad(lambda th:math.exp(-screening*z)-z/math.sqrt(z*z+(side/(2*math.cos(th)))**2)*math.exp(-screening*math.sqrt(z*z+(side/(2*math.cos(th)))**2)),0,math.pi/4,epsabs=1e-12)[0]
rows=[]
for rho in [2900.,8600.]:
    for tum in [.1,1.,10.]:
        thickness=tum*1e-6;diff=Q(z)-Q(z+thickness)
        omega2=c*c*fixed*rho*conv/(mn*mn*2*math.pi*hc*hc)*diff
        rows.append({'density_kg_m3_benchmark':rho,'plate_thickness_um_assumed':tum,'Yukawa_geometric_difference':diff,'outward_curvature_s_inverse_squared':omega2,'required_confinement_threshold_Hz':math.sqrt(omega2)/(2*math.pi),'uncompensated_10percent_growth_s':math.acosh(1.1)/math.sqrt(omega2)})
family=[]
for factor in [1.,.1,.01]:
    a=an*factor;kappa=a*y/C;achi=kappa*y*Kss;phi2=4*math.pi*alpha/(a*achi)
    family.append({'aN_scale':factor,'aN':a,'kappa_GeV':kappa,'a_chi_GeV_inverse':achi,'phi_vacuum_squared_GeV2':phi2,'lambda_eff_at_mu_1meV':1e-24/phi2,'aN_squared_phi_squared':a*a*phi2})
solid=4*math.atan((side/2)**2/(z*math.sqrt(z*z+2*(side/2)**2)))
checks={'massless_square_solid_angle':math.isclose(Q(z,0),solid,rel_tol=1e-12),'matching_force_invariant':all(math.isclose(r['aN_squared_phi_squared'],fixed,rel_tol=1e-12) for r in family),'positive_plate_curvature':all(r['outward_curvature_s_inverse_squared']>0 for r in rows),'two_routes_to_invariant':math.isclose(fixed,an*an/(endpoint['lambda_effective_for_same_light_product']/1e-24),rel_tol=1e-12)}
assert all(checks.values())
out={'checks':checks,'aN_squared_phi_squared_invariant_GeV_inverse_squared':fixed,'alpha_vacuum_fixed':alpha,'CchiN_fixed':C,'rows':rows,'coupling_family':family,'scope':'Linear weak-source response of isolated square plates in vacuum, mu=.001eV. Heuristic Yukawa endpoint; not full nonlinear chamber+plate solution or general model bound. Same C and vacuum light product; plate thickness/density unverified.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))

