"""Screening scales of the declared even-coupling scalar extension; no rate fit."""
import hashlib,json,math
from pathlib import Path
cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha=hashlib.sha256(cfg.read_bytes()).hexdigest()
assert sha=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design'];hc=1.973269804e-7;c=299792458.;eVjoule=1.602176634e-19
rhoC=d['mass_kg']/(4*math.pi*d['radius_m']**3/3)
convert=c*c/eVjoule*hc**3
rhoCnat=rhoC*convert;Rnat=d['radius_m']/hc
Mscale=math.sqrt(rhoCnat)*Rnat
rows=[]
for rhoXe in [2700.,2900.,3100.]:
    for mu in [.001,.01,.1,1.]:
        xe=math.sqrt(rhoXe*convert)/mu
        rows.append({'Xe_density_kg_m3_assumed':rhoXe,'mu_eV':mu,'M_weak_sphere_min_GeV':Mscale/math.sqrt(.1)/1e9,'M_Xe_restoration_max_GeV':xe/1e9,'M_Xe_density_twice_critical_max_GeV':xe/math.sqrt(2)/1e9,'robust_scale_window_exists':Mscale/math.sqrt(.1)<xe/math.sqrt(2)})
# Illustrative point, not fitted/admitted. Interior curvature and massless-exterior sphere approximation.
mu=.01;M=30e9;rhoXe=2900*convert
xs=math.sqrt(rhoCnat)/M*Rnat
mXe=math.sqrt(rhoXe/M**2-mu**2)
point={'mu_eV':mu,'M_GeV':M/1e9,'sphere_density_size_parameter':xs*xs,'sphere_center_field_ratio_linear_massless_exterior':1/math.cosh(xs),'Xe_bulk_density_over_critical':rhoXe/(mu*M)**2,'Xe_restored_linear_decay_length_m':hc/mXe,'mu_R_dimensionless':mu*Rnat,'sphere_density_term_over_mu_squared':rhoCnat/(mu*M)**2}
checks={'sphere_density_recovers_frozen_mass':math.isclose(rhoC*4*math.pi*d['radius_m']**3/3,d['mass_kg'],rel_tol=1e-12),'conversion_via_particle_mass_units':math.isclose(convert,hc**3/1.7826619216279e-36,rel_tol=1e-9),'illustrative_point_satisfies_declared_scale_criteria':point['sphere_density_size_parameter']<=.1 and point['Xe_bulk_density_over_critical']>=2,'sphere_linear_approximation_hierarchies':point['mu_R_dimensionless']<.02 and point['sphere_density_term_over_mu_squared']>100}
assert all(checks.values())
out={'checks':checks,'config_sha256':sha,'frozen_sphere_density_kg_m3':rhoC,'sphere_M_scale_GeV':Mscale/1e9,'rows':rows,'illustrative_point':point,'scope':'Density benchmarks and scale criteria, not exclusions. Neglect halo/gas background term only conditionally; finite wall/target solution and two-scalar channel unresolved. Linear vertex vanishes at exact phi_bar=0, not all scattering.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
