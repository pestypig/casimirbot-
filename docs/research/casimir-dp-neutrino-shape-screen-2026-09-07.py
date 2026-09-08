"""Coupling-independent raw spectral-ratio test, not a detector exclusion."""
import hashlib,json,math
from pathlib import Path
path=Path(__file__).with_name('casimir-dp-neutrino-joint-2026-09-07.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()=='6aba082f04ff4f616161e109df1c642e087656fc61ded72a3f9768d4ef5ecdf3'
s={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),s)
rows=[]
for m in [.7,1.,1.5,2.,3.]:
    for med in [.1,1.,10.]:
        low=s['xe'](5.4,202,m,med)
        high=s['xe'](202,296,m,med)
        ratio=low/high
        rows.append(dict(mchi_GeV=m,mediator_GeV=med,raw_low=low,raw_high=high,low_over_high=ratio,passes_source_equation_raw_surrogate=bool(ratio<.1713),passes_source_caption_raw_surrogate=bool(ratio<1.713)))
old_kernel=s['kernel'];caprows=[]
for cap in [5.,10.,20.,100.,1e4]:
    def capped(E,cap=cap):
        return s['weighted'].integrate(math.log(max(E,.01)),math.log(cap)) if E<cap else 0.
    s['kernel']=capped
    low=s['xe'](5.4,202,2.,1.,n=384); high=s['xe'](202,296,2.,1.,n=384)
    caprows.append(dict(incident_cap_GeV=cap,raw_low=low,raw_high=high,low_over_high=low/high if high else None))
s['kernel']=old_kernel
reference=next(r for r in rows if r['mchi_GeV']==2 and r['mediator_GeV']==1)
refined=s['xe'](5.4,202,2.,1.,n=192)/s['xe'](202,296,2.,1.,n=192)
checks={'full_flux_ratio_refinement':abs(refined/reference['low_over_high']-1)<1e-4,'full_cap_matches_original':abs(caprows[-1]['low_over_high']/reference['low_over_high']-1)<1e-4,'positive_full_flux_windows':all(r['raw_low']>0 and r['raw_high']>0 for r in rows),'nested_cap_counts':all(caprows[i]['raw_low']<=caprows[i+1]['raw_low'] and caprows[i]['raw_high']<=caprows[i+1]['raw_high'] for i in range(len(caprows)-1))}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values()),checks
out=dict(scope='Raw true-energy ratio screen under explicit flavor-inclusive model; source cuts are not likelihoods',full_model_admitted=False,checks=checks,min_ratio=min(r['low_over_high'] for r in rows),max_ratio=max(r['low_over_high'] for r in rows),rows=rows,artificial_incident_cap_diagnostic=caprows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='rows'},indent=2))
