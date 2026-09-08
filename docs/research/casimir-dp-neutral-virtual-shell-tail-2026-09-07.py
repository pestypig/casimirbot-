import math,json,itertools
from collections import Counter
from pathlib import Path
from scipy.integrate import quad
from scipy.special import erfc
lattice=.357;s=.1/math.sqrt(6);J=(2-math.sqrt(2))/math.sqrt(math.pi)
basis=[(0,0,0),(0,2,2),(2,0,2),(2,2,0),(1,1,1),(1,3,3),(3,1,3),(3,3,1)]
shells=Counter()
for cell in itertools.product(range(-4,5),repeat=3):
 for site in basis:
  coords=[4*c+b for c,b in zip(cell,site)];n=sum(c*c for c in coords)
  if n and lattice*math.sqrt(n)/4<1: shells[n]+=1
assert [shells[n] for n in sorted(shells)[:4]]==[4,12,12,6]
rows=[]
for n,count in sorted(shells.items()):
 d=lattice*math.sqrt(n)/4;k=d/s
 def fun(r):
  inner=quad(lambda z:erfc(z/2),abs(r-k),r+k,epsabs=1e-15)[0]
  return erfc(r/2)*inner
 overlap=quad(fun,0,k+20,points=[k/2,k],epsabs=1e-14)[0]/(4*k*J)
 rows.append(dict(distance_nm=d,neighbors=count,overlap=overlap))
# Packing bound on all sites beyond cutoff. C(d)/C(0)<=sqrt(pi)/(2J)*exp(-d^2/(16s^2)).
dmin=lattice*math.sqrt(3)/4;h=.05
term=lambda r:math.sqrt(math.pi)/(2*J)*(1+2*(r+h)/dmin)**3*math.exp(-r*r/(16*s*s))
ratio=term(1+h)/term(1)
assert ratio<1
bound=term(1)/(1-ratio) # successive ratios decrease by log-concavity
out=dict(status='bulk_rigid_gaussian_shell_sum_with_analytic_outer_bound',
 amplitude_multiplier=1+sum(r['neighbors']*r['overlap'] for r in rows),
 outside_1nm_amplitude_bound=bound,number_sites=sum(shells.values()),rows=rows,
 limitations=['toy positive potentials and bulk lattice only','quadrature error separate from analytic outer bound',
 'no finite-q crystal response or common xenon normalization'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print({k:v for k,v in out.items() if k!='rows'})
