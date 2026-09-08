import math,json
from pathlib import Path
from scipy.integrate import quad
lam=197.3269804
rho=[19.3,7.19,3.98];fractions=[118/197,28/52,52/102]
w=[-math.expm1(-250/lam),math.exp(-250/lam)-math.exp(-260/lam),math.exp(-260/lam)]
kt=sum(x*y for x,y in zip(w,rho))
ktq=sum(x*y*z for x,y,z in zip(w,rho,fractions))
# Independent depth integration of the projected layered kernel.
edges=[0,250,260,math.inf]
num=sum(quad(lambda z: rr*ff*math.exp(-z/lam)/lam,lo,hi)[0]
 for rr,ff,lo,hi in zip(rho,fractions,edges[:-1],edges[1:]))
assert math.isclose(num,ktq,rel_tol=1e-10)
source=(19.3*fractions[0]-2.33*.5)/(19.3-2.33)
C=ktq/kt*source
# Broad trial composition box, not a measured uncertainty interval.
Clo=.45*(19.3*.45-2.33*.65)/(19.3-2.33)
Chi=.65*(19.3*.65-2.33*.45)/(19.3-2.33)
assert Clo<C<Chi
G=6.70883e-39;mu=.93149410242;floor=3.0244159337343772e-12
rows=[]
for label,c in [('nominal',C),('broad_lower',Clo),('broad_upper',Chi)]:
 g=math.sqrt(4*math.pi*G*mu**2*1e11/c)
 rows.append(dict(label=label,charge_factor=c,g_SM_ceiling=g,floor_over_ceiling=floor/g))
out=dict(status='layered_composition_check_with_visual_force_envelope',rows=rows,
 weights=w,probe_fraction=ktq/kt,source_difference_fraction=source,
 assumptions=['nominal bulk densities g/cm3, dominant-isotope approximations',
 'published exponential layer kernel; no exact finite-sphere correction',
 'visual Yukawa ceiling 1e11 unchanged; no new likelihood fit'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
