"""Rigid isospin-shift diagnostic and conditional raw-count acceptance ceiling."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.stats import gamma,poisson
base=Path(__file__).parent
parent=base/'casimir-dp-absorption-spectral-convolution-2026-09-07.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='0f74b819ff4e2b96b9b2e810d8da5fa552fdb7ce885e6b36ba00b29f9010daf7'
a={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),a)
p=a['p'];rem=a['rem'];w=a['w'];integrate=a['integrate']
sigma0=.247**2/(4*math.pi*11500.**4)*.3893793721e-27
primary_norm=9.09e39*6*(.3/.247)*29979245800.*sigma0
upper=float(gamma.ppf(.9,19)) # one-sided classical Poisson upper mean for n=18
edges=np.arange(0,305,5)/1000
rows=[]
for shift in [0.,2.76,5.]:
    shifted=rem+shift/1000
    rate=float(w@integrate(p,shifted))
    bins=[float(w@integrate(p,shifted,low=lo,high=hi)) for lo,hi in zip(edges[:-1],edges[1:])]
    raw=primary_norm*rate
    rows.append(dict(removal_shift_MeV=shift,rate_over_sigma0=rate,mean_T_MeV=float(1000*(w@integrate(p,shifted,moment=1))/rate),conditional_KL_primary=raw,acceptance_at_raw_count_upper_mean=upper/raw,spectrum_bins_over_sigma0=bins))
previous=json.loads(parent.with_suffix('.json').read_text())
reference=next(r['rate_over_sigma0'] for r in previous['rows'] if r['spectator_recoil'] and r['hard_pauli'])
checks=dict(zero_shift_matches=math.isclose(rows[0]['rate_over_sigma0'],reference,rel_tol=1e-12),
            shifted_spectrum_partition=all(math.isclose(sum(r['spectrum_bins_over_sigma0']),r['rate_over_sigma0'],rel_tol=1e-10) for r in rows),
            poisson_inversion=math.isclose(float(poisson.cdf(18,upper)),.1,rel_tol=1e-11),
            acceptance_identity=all(math.isclose(r['conditional_KL_primary']*r['acceptance_at_raw_count_upper_mean'],upper,rel_tol=1e-12) for r in rows))
assert all(checks.values())
out=dict(scope='Rigid shifts are diagnostic assumptions, not a neutron spectral measurement. M remains 939 MeV to isolate energy-shift effects. KL normalization is imported from absorption paper; response and exposure accounting remain conditional.',checks=checks,raw_candidates=18,poisson_90pct_upper_mean=upper,bin_edges_MeV=(edges*1000).tolist(),rows=rows,exclusion_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(checks=checks,upper=upper,rows=[{k:v for k,v in r.items() if k!='spectrum_bins_over_sigma0'} for r in rows]),indent=2))
