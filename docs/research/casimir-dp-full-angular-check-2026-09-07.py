"""Full adaptive phase sum at 650 km/s compared with Numerov recoil bands."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from numpy.polynomial.legendre import leggauss,legvander
p=Path(__file__).with_name('casimir-dp-phase-independent-check-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='882c37c0d1aefea7ba7d706920b8b4c444b0a2fa7871e1ab2c428903ca6c4cd2'
n={'__file__':str(p)};exec(p.read_text(encoding='utf-8-sig').split('\nrows=[]')[0],n)
speed=650.;k=n['mu']*(speed/299792.458)/.01
prior=json.loads(p.with_name('casimir-dp-finite-speed-xe131-2026-09-07.json').read_text())
emax=2*n['mu']**2*(speed/299792.458)**2/n['n']['n']['mA']*1e6

def integrate(d,lo,hi,N=480):
 nodes,weights=leggauss(N);c=lo+(nodes+1)*(hi-lo)/2
 ell=np.arange(len(d));amp=legvander(c,len(d)-1)@((2*ell+1)*np.exp(1j*d)*np.sin(d)/k)
 return float(np.pi*(hi-lo)*(weights@abs(amp)**2))
rows=[]
for sign in [-1,1]:
 d=[]
 for l in range(203):
  d.append(n['adaptive'](k,sign*n['lam'],l,1e-11))
  if l%40==0:print(json.dumps(dict(sign=sign,completed_l=l)),flush=True)
 d=np.array(d)
 sums=[]
 for last in [142,172,202]:
  phase=d[:last+1];total=integrate(phase,-1,1)
  analytic=4*np.pi/k**2*np.sum((2*np.arange(len(phase))+1)*np.sin(phase)**2)
  assert abs(total/analytic-1)<1e-7
  low=integrate(phase,1-2*10/emax,1-2*5.4/emax)
  high=integrate(phase,1-2*min(269.9,emax)/emax,1-2*200/emax)
  sums.append(dict(lmax=last,total=total,low=low,high=high))
 ref=next(r['fine'] for r in prior['rows'] if r['fine']['speed_kms']==650 and np.sign(r['fine']['g'])==sign)
 discrepancy={key:sums[-1][key]/(ref['total']['exact'] if key=='total' else ref['bands'][key]['exact'])-1 for key in ['total','low','high']}
 assert max(abs(v) for v in discrepancy.values())<.005
 assert abs(sums[-1]['high']/sums[-2]['high']-1)<.001
 high240=integrate(d,1-2*min(269.9,emax)/emax,1-2*200/emax,240)
 assert abs(high240/sums[-1]['high']-1)<1e-7
 rows.append(dict(sign=sign,phases=d.tolist(),partial_sums=sums,relative_difference_from_numerov=discrepancy))
 print(json.dumps(dict(sign=sign,comparison=discrepancy)),flush=True)
out=dict(status='independent_full_angular_check_at_one_speed',speed_kms=speed,rows=rows,
 checks=['source hash','full adaptive versus Numerov band comparison below 0.5 percent','partial-wave cutoff high-band stability below 0.1 percent','angular quadrature refinement','angular integral versus phase total'],
 limitations=['one isotope and speed','shared potential and matching formulas','no physical input uncertainty or detector response','not transport reweighting or an allowed model'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
