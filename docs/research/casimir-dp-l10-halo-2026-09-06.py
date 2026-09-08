"""Shared shifted-Maxwellian L10 yields; orientation-independent D<=2N only."""
import hashlib, json, math, csv
from pathlib import Path
import numpy as np
from scipy.integrate import quad

parent=Path(__file__).with_name('casimir-dp-l10-joint-kernel-2026-09-06.py')
raw=parent.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='7b0acb77a94dc27fa1d15267e4232d1e2af769b6b6e50c7df05d226c58c123a9'
# Load definitions before the parent replay/output section; never rewrite its artifacts.
p={'__file__':str(parent)}
exec(compile(raw.decode().split('\nrows=[]')[0],str(parent),'exec'),p)
ckm=299792.458
def norm(v0,vesc):
    z=vesc/v0
    return math.erf(z)-2*z*math.exp(-z*z)/math.sqrt(math.pi)
def pdf(v,v0,vesc,ve):
    if v<=0 or v>=vesc+ve:return 0.
    return v/(math.sqrt(math.pi)*v0*ve*norm(v0,vesc))*(math.exp(-((v-ve)/v0)**2)-math.exp(-(min(v+ve,vesc)/v0)**2))
def eta(vmin,v0,vesc,ve):
    x=vmin/v0;y=ve/v0;z=vesc/v0
    if x>=z+y:return 0.
    if x<z-y:
        value=math.erf(x+y)-math.erf(x-y)-4*y/math.sqrt(math.pi)*math.exp(-z*z)
    else:
        value=math.erf(z)-math.erf(x-y)-2/math.sqrt(math.pi)*(z-x+y)*math.exp(-z*z)
    return max(0,value/(2*ve*norm(v0,vesc)))
def xenon(E,mass,halo):
    result=0.
    for A,m,f in p['iso']:
        if A not in [129,131]:continue
        ma=m*.93149410242-54*.00051099895;mu=mass*ma/(mass+ma)
        x=2*ma*E*1e-6;vmin=math.sqrt(x)/(2*mu)*ckm
        b=math.sqrt(41.467/(45*A**(-1/3)-25*A**(-2/3)))
        W=p['scope'][f'Xe{A}'](0,0,x*b*b/(4*p['hc']**2))
        assert W>=0
        ds=p['kernel'](x,W,.5 if A==129 else 1.5)*p['v']**2
        result+=p['xe_atoms']*f*p['rho']/mass*ckm**2*1e5*p['year']*ds*2*ma*1e-6*eta(vmin,*halo)
    return result
def carbon_count(mass,b,halo):
    vmax=halo[1]+halo[2];mu=mass*p['mc']/(mass+p['mc']);xmax=(2*mu*vmax/ckm)**2
    def integrand(t):
        y=xmax*t*b*b/(4*p['hc']**2)
        return t*t*((1-2*y)*math.exp(-y)/3)**2*eta(vmax*math.sqrt(t),*halo)
    value=quad(integrand,0,1,epsabs=1e-14,epsrel=1e-9)[0]*xmax**3
    return value*p['cN']**2/(2*math.pi*p['mn']**4)*p['conv']*p['rho']/mass*ckm**2*1e5*p['nc']*p['d']['hold_time_s']
scenarios={'central':(238.,544.,250.2),'v0_220':(220.,544.,250.2),
           'vesc_528':(238.,528.,250.2),'vesc_560':(238.,560.,250.2),
           'summer_speed':(238.,544.,265.1),'winter_speed':(238.,544.,235.3)}
checks={
    'speed_pdf_normalized': all(abs(quad(lambda v:pdf(v,*h),0,h[1]+h[2],points=[h[1]-h[2]])[0]-1)<1e-10 for h in scenarios.values()),
    'eta_direct_speed_integral': all(abs(eta(vm,*h)-quad(lambda v:pdf(v,*h)/v,vm,h[1]+h[2],epsabs=1e-12)[0])<1e-10 for h in scenarios.values() for vm in [1,200,600]),
    'eta_above_support_zero': all(eta(h[1]+h[2]+1,*h)==0 for h in scenarios.values()),
}
rows=[]
for name,h in scenarios.items():
    for mass in [100.,200.,1000.]:
        total=quad(lambda E:xenon(E,mass,h),5.4,270,epsabs=1e-10,epsrel=1e-8)[0]
        high=quad(lambda E:xenon(E,mass,h),200,270,epsabs=1e-10,epsrel=1e-8)[0]
        for b in [1.4,1.6,1.8,2.0]:
            count=carbon_count(mass,b,h)
            rows.append({'halo':name,'mchi_GeV':mass,'b_C13_fm':b,'Xe_raw_ROI':total,
                         'Xe_raw_high':high,'C13_independent_count':count,'D_upper_any_orientation':2*count,
                         'D_upper_per_raw_Xe_ROI':2*count/total,'D_upper_per_raw_Xe_high':2*count/high})
# Independent speed-fold of the preceding mono-speed carbon implementation.
oldv,oldspeed=p['v'],p['speed']
def fold(v):
    p['v']=v/ckm;p['speed']=v*1e5
    return p['carbon'](1000.,1.6)[0]*pdf(v,*scenarios['central'])
direct=quad(lambda v:fold(v)*1e30,1e-6,794.2,epsabs=1e-10,epsrel=1e-9)[0]*1e-30
p['v'],p['speed']=oldv,oldspeed
checks['carbon_two_integration_orders']=math.isclose(direct,carbon_count(1000,1.6,scenarios['central']),rel_tol=1e-7)
def fold_xe(v):
    p['v']=v/ckm;p['speed']=v*1e5
    return p['xe_density'](248.,1000.)*pdf(v,*scenarios['central'])
thresholds=[544.-250.2]
for A,m,f in p['iso']:
    if A in [129,131]:
        ma=m*.93149410242-54*.00051099895
        thresholds.append(math.sqrt(2*ma*248e-6)/(2*1000*ma/(1000+ma))*ckm)
direct_xe=quad(fold_xe,1e-6,794.2,points=thresholds,epsabs=1e-12,epsrel=1e-10,limit=200)[0]
p['v'],p['speed']=oldv,oldspeed
checks['xenon_direct_speed_fold']=math.isclose(direct_xe,xenon(248.,1000.,scenarios['central']),rel_tol=1e-6)
checks['positive_nested_windows']=all(0<r['Xe_raw_high']<r['Xe_raw_ROI'] for r in rows)
assert all(checks.values())
out={'scope':'Leading contact L10 with inherited approximate nuclear inputs; not a likelihood or full solid prediction',
     'parent_sha256':hashlib.sha256(raw).hexdigest(),'config_sha256':p['sha'],
     'halo_tuples_km_s_v0_vesc_ve':scenarios,'checks':checks,'rows':rows,
     'coherence_note':'Shifted halo is anisotropic. Only D<=2*count asserted; isotropic sinc estimate not reused.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
with Path(__file__).with_suffix('.csv').open('w',newline='') as f:
    w=csv.writer(f);w.writerow(['E_keV','central_raw_m100','central_raw_m200','central_raw_m1000'])
    for E in np.linspace(5.4,270,1601):w.writerow([E]+[xenon(E,m,scenarios['central']) for m in [100,200,1000]])
print(json.dumps({'checks':checks,'central_b1p6':[r for r in rows if r['halo']=='central' and r['b_C13_fm']==1.6],
                 'range_D_upper_per_raw_Xe_ROI':[min(r['D_upper_per_raw_Xe_ROI'] for r in rows),max(r['D_upper_per_raw_Xe_ROI'] for r in rows)]},indent=2))
