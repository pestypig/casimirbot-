from pathlib import Path
import math,json,hashlib
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(p.read_text())['leading_design'];R=c['radius_m']*100;rho=.3;vt=776e5*c['hold_time_s'];target=.029511464722144533
rows=[]
for M in [100.,1e5,1e8]:
 flux_hold=rho/M*vt;bound=4*math.pi*flux_hold*R*R;required=math.sqrt(target/(4*math.pi*flux_hold))/100
 assert abs(4*math.pi*flux_hold*(required*100)**2/target-1)<1e-14
 rows.append(dict(dark_mass_GeV=M,D_bound_if_support_radius_equals_sphere=bound,necessary_support_radius_m_for_comparator=required))
out=dict(status='compact_support_eikonal_arrival_bound_not_universal_force_bound',config_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),rows=rows,assumptions=['straight-line elastic eikonal scattering','Poisson incident objects at rho=0.3 GeV/cm3 and speed=776 km/s','impact phase vanishes outside radius b_max','no unbounded force tail or enhanced local population'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
