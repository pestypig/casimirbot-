"""Toy characteristic functions at fixed mean hit count; no dark-matter flux fit."""
import json
import math
from pathlib import Path

def loss(x):
    return x*x/6-x**4/120+x**6/5040 if abs(x)<.01 else 1-math.sin(x)/x

rows=[]
for x in [1e-4,.01,.1,1.]:
    for N in [1,10,10000]:
        single=loss(x)
        independent=-math.expm1(N*math.log1p(-single))/N
        aligned=loss(N*x)/N
        assert independent<=single*(1+1e-12)
        if N==1: assert math.isclose(aligned,single,rel_tol=1e-12)
        rows.append(dict(x_qsep_over_hbar=x,hits_per_burst=N,
            D_per_mean_hit_unclustered=single,
            D_per_mean_hit_independent_burst=independent,
            D_per_mean_hit_aligned_burst=aligned,
            aligned_over_unclustered=aligned/single,
            COM_impulse_variance_ratio_aligned_to_independent=N))
out=dict(status='toy statistics only; no predicted hit rate, scattering kernel or allowed point',rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(rows[2],indent=2))
