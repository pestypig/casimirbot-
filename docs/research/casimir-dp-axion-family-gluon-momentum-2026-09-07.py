"""Momentum dependence of selected gluon insertions only; other channels frozen."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
from functools import lru_cache
p=Path(__file__).with_name('casimir-dp-axion-family-target-response-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='d37df76000f503566910eb780359d6d2d6e738ff56cbebc87ae6546cfe24098b'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nold=forecast(')[0],str(p),'exec'),n)
a=n['a'];s=n['s'];base=n['n'];ct=n['ct'];halo=a['h']['scenarios']['central']
@lru_cache(maxsize=12000)
def integral(q):
    def integrand(x):
        A=x*x*s['mx']**2+(1-x)*s['ma']**2;B=(1-x)**2*q*q
        u=1/A if B==0 else 4*math.atanh(math.sqrt(B/(4*A+B)))/math.sqrt(B*(4*A+B))
        return x*(1-x)*u
    return quad(integrand,0,1,epsabs=1e-14,epsrel=1e-10)[0]
errors=[abs(integral(q)/s['I'](q)-1) for q in [0,.05,.246,.27]]
assert max(errors)<1e-8
def extra(r,q):
    cg=-r['Kaa_GeV_minus2']*s['g']**2*s['mx']*integral(q)/(8*math.pi**2)
    return -cg*base['trace']+s['tree'](q)*(-base['v']*r['Kh_GeV_minus1']*base['trace']/base['mn'])/.3
def correction(E,r):
    total=0.
    for A,atomic,f in a['p']['iso']:
        mass=atomic*.93149410242-54*.00051099895;mu=400*mass/(400+mass);q=math.sqrt(2*mass*E*1e-6)
        # Linear interference delta is evaluated directly, avoiding total-rate cancellation.
        dw=2*(A*ct)*A*(extra(r,q)-extra(r,0))
        total+=f*mass*1e-6*a['t']['form'](q,A)**2*dw*a['t']['eta'](q/(2*mu)*a['t']['ckm'],*halo)
    return total/(2*math.pi)*a['p']['conv']*.3/400*a['t']['ckm']**2*1e5*a['p']['year']*a['p']['xe_atoms']
rows=[]
for r in n['family']:
    old=n['forecast'](r)
    delta=quad(lambda E:correction(E,r),5.4,269.9,epsabs=1e-15)[0]
    split=sum(quad(lambda E:correction(E,r),lo,hi,epsabs=1e-15)[0] for lo,hi in [(5.4,100),(100,200),(200,269.9)])
    assert abs(delta-split)<1e-14
    high=quad(lambda E:correction(E,r),200,269.9,epsabs=1e-16)[0]
    rows.append(dict(yL=r['yL'],Xe_contact=old['Xe_raw_full'],Xe_selected_q_dependent=old['Xe_raw_full']+delta,delta_Xe=delta,relative_total_shift=delta/old['Xe_raw_full'],delta_high=high))
out=dict(scope='Only aa-gluon triangle and Higgs-gluon propagators acquire q dependence. Other scalar/box channels retain their contact approximations; raw counts, no fit or full momentum-dependent amplitude.',integral_reduction_max_relative_error=max(errors),rows=rows,checks=dict(analytic_u_integral_vs_double_quad=True,split_energy_integral=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
