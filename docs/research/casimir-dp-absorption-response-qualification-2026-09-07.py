"""Simulation-statistics requirements at the conditional acceptance ceiling; no simulated events."""
import hashlib,json,math
from pathlib import Path
from scipy.stats import beta,binom
base=Path(__file__).parent
parent=base/'casimir-dp-absorption-neutron-shift-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='304d4f90c3c697c423adb81dd797845d96db580d634628dc34f641ae1ce1de75'
prior=json.loads(parent.read_text())
critical=next(r['acceptance_at_raw_count_upper_mean'] for r in prior['rows'] if r['removal_shift_MeV']==2.76)
alpha=.05
def lower(k,n):return 0. if k==0 else float(beta.ppf(alpha,k,n-k+1))
rows=[]
for n in [10000,100000,1000000]:
    lo=0;hi=n
    while lo<hi:
        k=(lo+hi)//2
        if lower(k,n)>critical:hi=k
        else:lo=k+1
    rows.append(dict(unweighted_trials=n,min_accepted_for_lower_bound_above_ceiling=lo,lower_bound=lower(lo,n),previous_lower_bound=lower(lo-1,n)))
zero_n=math.floor(math.log(alpha)/math.log1p(-critical))+1
checks=dict(threshold_bracketing=all(r['previous_lower_bound']<=critical<r['lower_bound'] for r in rows),binomial_tail=all(math.isclose(float(binom.sf(r['min_accepted_for_lower_bound_above_ceiling']-1,r['unweighted_trials'],r['lower_bound'])),alpha,rel_tol=1e-7) for r in rows),zero_trial_minimality=(1-alpha**(1/zero_n)<critical<=1-alpha**(1/(zero_n-1))))
assert all(checks.values())
out=dict(scope='Exact one-sided 95% binomial simulation-precision planning only. Assumes iid unweighted events drawn from the actual signal distribution and complete selection. No transport was run; no physical acceptance bound exists.',checks=checks,critical_acceptance=critical,rows=rows,minimum_trials_if_zero_pass_for_upper_bound_below_ceiling=zero_n,exclusion_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
