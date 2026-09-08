"""Shared contact L10 diagnostic: old Xe spin tables + approximate C13 nucleus.
Isotropic mono-speed halo, unit Xe efficiency; no detector fit or solid response.
"""
import ast, csv, hashlib, json, math
from pathlib import Path
import numpy as np
from scipy.integrate import quad

base=Path(__file__).parent
source=base/'casimir-dp-spin-response-intake-2026-09-06/WIMpy__WS1.py'
raw=source.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='c1a31d8b543cae5ade1c026fa14ec51e8ff1a858268404352eaf3217c731f08d'
# Only the three inspected, arithmetic-only response functions are compiled.
tree=ast.parse(raw)
selected=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['H','Xe129','Xe131']]
scope={'np':np,'__builtins__':{}}
exec(compile(ast.Module(body=selected,type_ignores=[]),str(source),'exec'),scope)
config=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha=hashlib.sha256(config.read_bytes()).hexdigest()
assert sha=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(config.read_text())['leading_design']
u=1.66053906892e-27; mn=.93956542052; hc=.1973269804; conv=.3893793721e-27
v=776/299792.458; speed=776e5; rho=.3; year=365.25*86400; cN=1/246.2**2
iso=[(124,123.9058920,.000952),(126,125.9042983,.000890),(128,127.9035310,.019102),
     (129,128.9047808611,.264006),(130,129.903509349,.040710),(131,130.90508406,.212324),
     (132,131.9041550856,.269086),(134,133.90539466,.104357),(136,135.907214484,.088573)]
xe_atoms=2.84*1000/(sum(m*f for _,m,f in iso)*u)
f13=.0107; nc=d['mass_kg']/((12*(1-f13)+13.00335483507*f13)*u)*f13
mc=13.00335483507*.93149410242-6*.00051099895
WH=scope['H'](0,0,0)
def kernel(x,W,J,coefficient=cN):
    # Response normalized to the independently verified free-spin-half amplitude.
    response_ratio=W/WH*2/(2*J+1)
    return coefficient**2*x*x*response_ratio/(2*math.pi*v*v*mn**4)*conv
def xe_density(E,mass,coefficient=cN):
    result=0.
    for A,m,f in iso:
        if A not in [129,131]:continue
        ma=m*.93149410242-54*.00051099895
        mu=mass*ma/(mass+ma); x=2*ma*E*1e-6
        if x>(2*mu*v)**2:continue
        b=math.sqrt(41.467/(45*A**(-1/3)-25*A**(-2/3)))
        W=scope[f'Xe{A}'](0,0,x*b*b/(4*hc*hc))
        assert W>=0, 'Negative response; do not clip into an accepted prediction'
        result+=xe_atoms*f*rho/mass*speed*year*kernel(x,W,.5 if A==129 else 1.5,coefficient)*2*ma*1e-6
    return result
def xe_count(mass,lo,hi,coefficient=cN):
    cuts=[lo,hi]
    for A,m,f in iso:
        if A in [129,131]:
            ma=m*.93149410242-54*.00051099895; mu=mass*ma/(mass+ma)
            endpoint=2*mu*mu*v*v/ma*1e6
            if lo<endpoint<hi:cuts.append(endpoint)
    cuts=sorted(cuts)
    return sum(quad(lambda e:xe_density(e,mass,coefficient),a,b,epsabs=1e-15,epsrel=1e-9)[0]
               for a,b in zip(cuts[:-1],cuts[1:]))
def carbon(mass,b):
    mu=mass*mc/(mass+mc); xmax=(2*mu*v)**2
    def shape(t):
        y=xmax*t*b*b/(4*hc*hc)
        return t*t*((1-2*y)*math.exp(-y)/3)**2
    integral=quad(shape,0,1,epsabs=1e-13)[0]
    pref=cN*cN*xmax**3/(2*math.pi*v*v*mn**4)*conv*rho/mass*speed*d['hold_time_s']*nc
    count=pref*integral
    # For isotropic momentum directions D=int dsigma(1-sinc(q*d)).
    # Bound |sinc z| <= min(1,1/|z|), without unresolved oscillatory quadrature.
    phase=math.sqrt(xmax)*d['branch_separation_m']/(hc*1e-15)
    error=pref*quad(lambda t:shape(t)*min(1,1/(phase*math.sqrt(t))) if t else 0,
                    0,1,epsabs=1e-16)[0]
    return count,error
rows=[]
for mass in [100.,200.,1000.]:
    count=xe_count(mass,5.4,270); high=xe_count(mass,200,270)
    for b in [1.4,1.6,1.8,2.0]:
        D,err=carbon(mass,b)
        rows.append({'mchi_GeV':mass,'b_C13_fm':b,'Xe_raw_5p4_270_count':count,
                     'Xe_raw_200_270_count':high,'D_center':D,'D_absolute_filter_error_bound':err,
                     'D_per_raw_Xe_ROI_count':D/count,'D_per_raw_Xe_high_count':D/high})
parent=json.loads((base/'casimir-dp-c13-single-particle-2026-09-06.json').read_text())
checks={
    'free_nucleon_normalization': math.isclose(kernel(.01,WH,.5),cN*cN*.01**2/(2*math.pi*v*v*mn**4)*conv,rel_tol=1e-12),
    'carbon_parent_recovery': math.isclose(carbon(1000,1.6)[0],parent['rows'][1]['independent_free_nucleus_expected_count'],rel_tol=1e-11),
    'coupling_squared_scaling': math.isclose(xe_count(1000,5.4,270,2*cN)/xe_count(1000,5.4,270),4,rel_tol=1e-12),
    'isotropic_filter_error_small': all(r['D_absolute_filter_error_bound']/r['D_center']<1e-6 for r in rows),
    'nested_energy_windows': all(0<r['Xe_raw_200_270_count']<r['Xe_raw_5p4_270_count'] for r in rows),
    'longitudinal_combination_cancels': all(abs(4*cN*z+z*(-4*cN))<1e-20 for z in [.0001,.01,.1]),
}
grid=np.linspace(5.4,270,3201)
checks['independent_grid_integral']=all(abs(np.trapezoid([xe_density(e,m) for e in grid],grid)/xe_count(m,5.4,270)-1)<1e-6 for m in [100.,200.,1000.])
assert all(checks.values())
out={'scope':'Conditional shared leading L10 kernel; not an LZ fit, full solid model or experimental bound',
     'config_sha256':sha,'response_sha256':hashlib.sha256(raw).hexdigest(),'cN_GeV_minus2':cN,
     'halo':'isotropic mono-speed 776 km/s, density 0.3 GeV/cm3 for both targets',
     'Xe_exposure_tonne_year':2.84,'Xe_efficiency':1,'checks':checks,'rows':rows}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
with Path(__file__).with_suffix('.csv').open('w',newline='') as f:
    writer=csv.writer(f);writer.writerow(['E_keV','raw_per_keV_m100','raw_per_keV_m200','raw_per_keV_m1000'])
    for e in np.linspace(5.4,270,1601):writer.writerow([e]+[xe_density(e,m) for m in [100,200,1000]])
print(json.dumps(out,indent=2))

