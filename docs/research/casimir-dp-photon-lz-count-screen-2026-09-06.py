"""Conditional all-count Poisson screen; not the LZ likelihood or a confidence band on material physics."""
import hashlib,json,math
from pathlib import Path
from scipy.stats import chi2,poisson
from scipy.integrate import quad
base=Path(__file__).parent
parent=base/'casimir-dp-photon-shared-halo-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='23a3cdfd24c5dfe608558285176c9829ec1d0af66b70d451f676d8470cba2542'
scope={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),scope)
old=json.loads(parent.with_suffix('.json').read_text())
observed={'science':1710,'prompt_veto':66,'delayed_veto':55}
N=sum(observed.values());U=float(chi2.ppf(.9,2*(N+1))/2)
rows=[]
for r in old['rows']:
    M=scope['Moments'](scope['scenarios'][r['halo']]);mass=r['mass_GeV']
    shape=lambda E:scope['xe_shape'](E,mass,M)
    # Exact source efficiency crossing 269.9, not rounded 270.
    fraction=quad(shape,5.4,269.9,epsabs=1e-12)[0]/quad(shape,5.4,270,epsabs=1e-12)[0]
    raw=r['Xe_raw_full']*fraction
    for floor in [.4,.5]:
        scale=U/(floor*raw)
        rows.append({'halo':r['halo'],'mass_GeV':mass,'assumed_efficiency_floor':floor,'raw_Xe_5p4_to_269p9':raw,'mu_GeV_inverse_upper':1e-6*math.sqrt(scale),'raw_Xe_200_to_270_upper':r['Xe_raw_high']*scale,'D_density_grid_upper_at_count_ceiling':r['D_density_grid_upper']*scale,'D_spin_bubble_grid_upper_at_count_ceiling':r['D_spin_bubble_grid_upper']*scale})
checks={'Poisson_inversion':math.isclose(poisson.cdf(N,U),.1,rel_tol=1e-10),'all_sample_count_sum':N==1831,'coupling_recovers_upper_count':all(math.isclose((r['mu_GeV_inverse_upper']/1e-6)**2*r['assumed_efficiency_floor']*r['raw_Xe_5p4_to_269p9'],U,rel_tol=1e-12) for r in rows),'lower_floor_weakens_bound':all(a['mu_GeV_inverse_upper']>b['mu_GeV_inverse_upper'] for a,b in zip(rows[::2],rows[1::2]))}
assert all(checks.values())
out={'checks':checks,'observed_disjoint_counts':observed,'one_sided_total_mean_90_upper':U,'rows':rows,'source':'https://arxiv.org/html/2609.02823v1 Tables I, S1, S2 and Fig S2','scope':'Count-only conservative screen conditional on spectrum, exposure, Poisson counts, nonnegative background and pointwise acceptance floor applying to sample union. Floor .5 nominal motivated by source crossings; .4 arbitrary stress test, neither a profiled efficiency uncertainty. No high reconstructed-energy bin or official likelihood reproduced.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'total_mean_upper':U,'central':[r for r in rows if r['halo']=='central' and r['assumed_efficiency_floor']==.5]},indent=2))
