"""Ordinary-MC coupling scan with explicit rare-tail resolution limits."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.stats import beta
base=Path(__file__).parent
p=base/'casimir-dp-slab-transport-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='dcb25aeacd1d563858dfa057b5eb70185c1f92a79d49f00acb82a49bf7635113'
def safe_quantile(values,q):
    return np.quantile(values,q) if len(values) else np.array([])
ns={'__file__':str(p.resolve()),'safe_quantile':safe_quantile}
# Reuse physics definitions only. Empty-exit quantiles become empty arrays;
# this in-memory adaptation does not change any sampling or transition law.
exec(p.read_text().split('# Thin-slab')[0].replace('np.quantile(','safe_quantile('),ns)
rows=[]
for i,factor in enumerate([.5,1,2,3,4,6,8]):
    N=30000;r=ns['run'](N,3000+i,ns['a']*factor)
    k=round(r['forward_above_650_fraction']*N)
    lo=0. if k==0 else float(beta.ppf(.025,k,N-k+1))
    hi=1. if k==N else float(beta.ppf(.975,k+1,N-k))
    K=ns['branch']['unattenuated_reference_count']*ns['a']*factor*ns['window_fraction']
    pgoal=1/K
    rows.append(dict(relative_to_prior_strong_root=factor,seed=3000+i,N=N,
        capable_exit_count=r['status_counts'][1],above_650_exit_count=k,
        above_650_fraction=k/N,binomial_95_interval=[lo,hi],
        subset_coefficient_lower_estimate=K*k/N,
        subset_coefficient_sampling_interval=[K*lo,K*hi],
        fraction_for_subset_coefficient_one=pgoal,
        all_zero_trials_needed_for_one_sided_95_upper_below_that_fraction=math.ceil(math.log(.05)/math.log1p(-pgoal)),
        conclusion='resolved_large_raw_subset' if lo>pgoal else 'unresolved_rare_tail_not_zero'))
out=dict(status='conditional_transport_scan_not_normalized_model',
    transport_script_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),rows=rows,
    limits=['intervals quantify Monte Carlo sampling only','subset coefficient is not accepted event count',
    'no-survivor sample is not zero flux','no external constraints or captured distribution'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
