"""Known heavy-contact component: stationary-nucleus column and stopping screen."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent;src=base/'casimir-dp-portal-contact-spectrum-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='71e7107657b52802e43b2c57439725c2b625a913ac11f4aaf426485fc940a799'
p=json.loads(src.read_text());C=p['C_chiN_GeV_inverse_squared'];conv=.3893793721e-27;ug=1.66053906892e-24
rows=[]
for old in [r for r in p['rows'] if r['halo']=='central']:
    mass=old['mass_GeV']
    for A in [12,28,56,93,131]:
        ma=A*.93149410242;red=mass*ma/(mass+ma)
        for label,coeff in [('matched',C),('conditional_Xe_count_ceiling',old['C_conditional_upper_GeV_inverse_squared'])]:
            sigma=coeff**2*A*A*red*red/math.pi*conv
            frac=2*red*red/(ma*mass)
            for column in [.29,7e9]:
                tau=column/(A*ug)*sigma
                rows.append({'mass_GeV':mass,'A_benchmark':A,'coefficient_case':label,'column_g_cm2_assumed':column,'point_nucleus_cross_section_cm2':sigma,'single_scatter_probability_upper':-math.expm1(-tau),'optical_depth_upper':tau,'mean_fractional_energy_loss_per_collision_point_model':frac,'leading_mean_fractional_stopping_upper':tau*frac})
checks={'all_columns_optically_thin':max(r['optical_depth_upper'] for r in rows)<1e-3,'energy_transfer_bound':all(0<r['mean_fractional_energy_loss_per_collision_point_model']<=.5 for r in rows),'Poisson_below_optical_depth':all(r['single_scatter_probability_upper']<=r['optical_depth_upper'] for r in rows)}
assert all(checks.values())
out={'checks':checks,'rows':rows,'scope':'Heavy isoscalar contact component only, independent stationary nuclei, A*u mass approximation, F=1 upper elastic estimate. Illustrative columns/compositions, no authenticated overburden. Excludes light scalar, electrons, collective response and full portal opacity.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'mass_1000_A56':[r for r in rows if r['mass_GeV']==1000 and r['A_benchmark']==56],'largest_optical_depth':max(rows,key=lambda r:r['optical_depth_upper'])},indent=2))
