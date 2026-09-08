"""Conditional compact-impact-support coherence ceiling; not a universal force bound."""
import hashlib,json,math
from pathlib import Path
from scipy.optimize import brentq
from scipy.integrate import quad
cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha=hashlib.sha256(cfg.read_bytes()).hexdigest()
assert sha=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design']
R=d['radius_m'];sep=d['branch_separation_m'];hold=d['hold_time_s'];D=.029511464722144533
def union(B,s):
    if s>=2*B:return 2*math.pi*B*B
    overlap=2*B*B*math.acos(s/(2*B))-.5*s*math.sqrt(4*B*B-s*s)
    return 2*math.pi*B*B-overlap
rows=[]
for speed in [776.,809.1]:
    for mass in [100.,200.,1000.]:
        flux=.3/mass*speed*1e5
        ceiling=2*flux*hold*union(R,sep)*1e4
        required=brentq(lambda B:2*flux*hold*union(B,sep)*1e4-D,1e-10,.01,xtol=1e-16)
        rows.append({'mass_GeV':mass,'speed_km_s':speed,'flux_cm2_s':flux,'D_compact_support_upper':ceiling,'comparator_over_ceiling':D/ceiling,'minimum_effective_support_radius_m':required,'support_radius_over_sphere_radius':required/R,'required_flux_enhancement_at_fixed_R':D/ceiling,'kR':mass*1e9*(speed/299792.458)*R/1.973269804e-7})
kin=[]
for speed in [776.,809.1]:
    M=122.;v=speed/299792.458;E=248e-6
    reduced=math.sqrt(M*E/(2*v*v))
    mmin=reduced*M/(M-reduced)
    flux=.3/mmin*speed*1e5
    kin.append({'speed_km_s':speed,'Xe_mass_GeV_assumed':M,'recoil_keV':248,'minimum_elastic_DM_mass_GeV':mmin,'compact_ceiling_at_minimum_mass':2*flux*hold*union(R,sep)*1e4,'mass_ceiling_for_DP_comparator_GeV':2*.3*speed*1e5*hold*union(R,sep)*1e4/D})
# Independent planar union integration, dimensionless radius one.
s=sep/R
numeric=quad(lambda x:2*max(math.sqrt(max(0,1-x*x)),math.sqrt(max(0,1-(x-s)**2))),-1,1+s,points=[s-1,s/2,1],epsabs=1e-10)[0]
checks={'union_area_independent_quadrature':math.isclose(numeric,union(1,s),rel_tol=1e-9),'coincident_and_disjoint_limits':math.isclose(union(1,0),math.pi) and math.isclose(union(1,2),2*math.pi),'required_support_recovers_comparator':all(math.isclose(2*r['flux_cm2_s']*hold*union(r['minimum_effective_support_radius_m'],sep)*1e4,D,rel_tol=1e-8) for r in rows),'elastic_threshold_recovery':all(math.isclose(2*(r['minimum_elastic_DM_mass_GeV']*122/(r['minimum_elastic_DM_mass_GeV']+122))**2*(r['speed_km_s']/299792.458)**2/122,248e-6,rel_tol=1e-12) for r in kin)}
assert all(checks.values())
out={'checks':checks,'config_sha256':sha,'DP_comparator_exponent':D,'rows':rows,'elastic_kinematics':kin,'scope':'Independent dilute particle flux; normalized branch-conditioned environmental output; exactly unchanged output outside union of impact disks of radius B. Max transverse separation and mono-speed or speed-ceiling flux. No general hard cutoff follows from mediator mass. No collective field, resonant long-range or enhanced local density exclusion.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
