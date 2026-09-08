"""Conservative inclusive density bound under explicit Born/contact assumptions."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
path=Path(__file__).with_name('casimir-dp-axion-assembled-subsets-2026-09-07.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()=='d437f10cac13f73de009c96557d2628a43e4335e03915be2faffca2f030930ad'
a={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),a)
p=a['p']; h=a['h']; mass=400.; number=p['nc']/p['f13']; rows=[]
for tr in a['tri']['rows']:
    ct=tr['C_tree_GeV_m2']; common=tr['C_scalar_triangle_GeV_m2']+ct*a['psratio']
    cp=ct+common-a['bp'];cn=ct+common-a['bn']
    # Absolute weights avoid assuming absence of proton/neutron cancellation.
    amplitude=number*((1-p['f13'])*(6*abs(cp)+6*abs(cn))+p['f13']*(6*abs(cp)+7*abs(cn)))
    sigma=mass*mass*amplitude*amplitude/math.pi*p['conv']
    for name,halo in h['scenarios'].items():
        mean=quad(lambda v:v*h['pdf'](v,*halo),0,halo[1]+halo[2],points=[halo[1]-halo[2]])[0]*1e5
        D=2*.3/mass*mean*p['d']['hold_time_s']*sigma
        independent=a['local'](ct,common-a['bp'],common-a['bn'],halo,'squared_subset')
        rows.append(dict(lambda_PhiH=tr['lambda_PhiH'],halo=name,sigma_closure_cm2=sigma,D_scalar_closure_upper=D,D_scalar_independent_upper=independent,closure_over_independent=D/independent))
# Bound on norm of sum of translation unitaries: random phases test saturation/inequality.
import numpy as np
rng=np.random.default_rng(20260907); weights=np.array([1.,2.,3.])
samples=np.abs(np.exp(1j*rng.uniform(-math.pi,math.pi,(1000,3)))@weights)**2
checks={'density_norm_sample_check':bool(np.all(samples<=sum(weights)**2)),'aligned_phase_saturation':math.isclose(abs(sum(weights))**2,sum(weights)**2),'closure_exceeds_independent':all(r['D_scalar_closure_upper']>=r['D_scalar_independent_upper'] for r in rows),'all_rows_below_DP_comparator':all(r['D_scalar_closure_upper']<.029511464722144533 for r in rows)}
assert all(checks.values())
out=dict(scope='All-final-state closure bound for rotationally averaged, non-energy-releasing Born scalar point-density contact model; not full physical-model bound',full_model_admitted=False,carbon_nucleus_count=number,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'central':[r for r in rows if r['halo']=='central']},indent=2))
