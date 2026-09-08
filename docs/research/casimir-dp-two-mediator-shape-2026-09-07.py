"""Optimistic two-propagator Born spectral screen, not a completed model."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
from scipy.linalg import eigh
p=Path(__file__).with_name('casimir-dp-darkelf-xenon-match-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='6eaf46b926f7c93e75b6a5b4751be6995f7fc7076899b82fde11fddaf3ee1c23'
n={'__file__':str(p)};exec(p.read_text().split('# Analytic integrated')[0],n)
def matrix(lo,hi,masses):
 out=np.zeros((2,2))
 for A,M,f in n['iso']:
  ma=n['mass'](M);upper=min(hi,n['emax'](ma))
  if upper<=lo:continue
  for i in range(2):
   for j in range(i,2):
    def integrand(E):
     q2=2*ma*E*1e-6
     w=n['ds'](E,A,ma)*(q2+n['med']**2)**2
     return w/((q2+masses[i]**2)*(q2+masses[j]**2))
    out[i,j]+=f*quad(integrand,lo,upper,epsabs=1e-65,epsrel=1e-9)[0]
 out[1,0]=out[0,1]
 return out
rows=[]
for m1 in [1e-6,1e-4,.01]:
 for m2 in [.03,.1,1.]:
  L=matrix(5.4,200,[m1,m2]);H=matrix(200,269.9,[m1,m2]);scale=np.trace(H)
  vals,vecs=eigh(L/scale,H/scale);g=vecs[:,0];g/=g[0]
  ratio=float(g@L@g/(g@H@g));assert math.isclose(ratio,vals[0],rel_tol=1e-8)
  # Global variational minimum in the two-dimensional real-amplitude span.
  assert np.min(np.linalg.eigvalsh((L-ratio*H)/scale))>-1e-7
  qzero2=-(g[0]*m2*m2+g[1]*m1*m1)/(g.sum())
  rows.append(dict(masses_GeV=[m1,m2],relative_products=g.tolist(),minimum_low_high_ratio=ratio,
   pure_mediator_ratios=[float(L[i,i]/H[i,i]) for i in range(2)],
   amplitude_node_q_GeV=math.sqrt(qzero2) if qzero2>0 else None,
   matrices_normalized_to_high_trace=dict(low=(L/scale).tolist(),high=(H/scale).tolist())))
print(json.dumps([{k:v for k,v in r.items() if k!='matrices_normalized_to_high_trace'} for r in rows],indent=2))
out=dict(status='optimistic_two_mediator_Born_shape_screen_not_shared_prediction',speed_kms=776,low_keV=[5.4,200],high_keV=[200,269.9],rows=rows,
 amplitude='Z*[c1/(q^2+m1^2)+c2/(q^2+m2^2)]*F_Helm(q)',
 checks=['source hash','generalized-eigenvalue recovery','positive-semidefinite residual within tolerance'],
 limitations=['real coefficient products freely optimized; no UV or external constraints','Born validity not established at any physical normalization','no detector or overburden convolution','no diamond neutral/solid response or measurable coherence claim','finite mass grid, not all mediator masses'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
