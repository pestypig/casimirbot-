"""Spin-two threshold map and test of compatibility of rounded high-scale inputs."""
import json,math
from pathlib import Path
import numpy as np
from scipy.linalg import expm
MZ=91.1876;alphaZ=.1181;mb=4.18
nf=5;beta=11-2*nf/3
P=np.zeros((6,6))
for i in range(5):P[i,i]=-16/9;P[i,5]=1/3;P[5,i]=16/9
P[5,5]=-5/3
alphaB=alphaZ/(1+alphaZ*beta/(2*math.pi)*math.log(mb/MZ))
t=2/beta*math.log(alphaZ/alphaB)
source=np.array([.254,.146,.052,.038,.024,.486]);atB=expm(t*P)@source
# At mu=mQ, the leading logarithmic spin-two heavy-to-gluon matching vanishes.
# M maps high Wilson vectors (u,d,s,c,b,g) to low vectors (u,d,s,c,g).
M=np.zeros((5,6));M[:4,:4]=np.eye(4);M[4,5]=1

def match_moments(high,tolerance=1e-8):
    low=np.r_[high[:4],high[5]]
    if np.max(abs(M.T@low-high))>tolerance:
        raise ValueError('MOMENTS_INCOMPATIBLE_WITH_LO_THRESHOLD')
    return low
rejected=False
try:match_moments(atB)
except ValueError:rejected=True
# Synthetic compatible input tests the matching map, not a substitute PDF set.
low=np.array([.30,.16,.05,.02,.47]);high=M.T@low
c=np.array([1.,-.2,.3,.1,.8,-.4]);clow=M@c
accepted=match_moments(high)
checks={'rounded_source_rejected_at_LO_threshold':rejected,
        'compatible_input_round_trip':np.max(abs(accepted-low))<1e-14,
        'threshold_amplitude_invariant':abs(c@high-clow@low)<1e-14,
        'threshold_momentum_conservation':abs(sum(high)-sum(low))<1e-14}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='Leading spin-two threshold exactly at mb; source rounded PDF/LO running compatibility audit, not a global PDF assessment',checks=checks,mb_GeV=mb,alpha_s_mb_LO=alphaB,moments_at_mb_from_rounded_source=atB.tolist(),heavy_moment_residual=float(atB[4]),M=M.tolist(),replacement_PDF_constructed=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
