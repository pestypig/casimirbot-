"""Add shared radial/Higgs tree scalar channel; loop matching is explicitly open."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
from scipy.special import spherical_jn
base=Path(__file__).parent
path=base/'casimir-dp-axion-joint-spin-2026-09-07.py'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='e3f6de1e7741067f8b209f42de8b8825c394a7daf8dfd68ef6b0ed716363fe3c'
s={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),s)
p=s['p']; h=s['h']; ckm=s['ckm']; eta=s['eta']; mn=.939; mh=125.; mr=1000.; fn=.3
source=path.with_suffix('.json')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='3db8a560c17991f53fa80041c8d69a311912c589d8522abce7b30a0638d9abd6'
spin=json.loads(source.read_text())['rows']

def C(lam,mass):return lam*mass*fn*mn/(mh*mh*mr*mr)
def form(q,A):
    c=1.23*A**(1/3)-.6
    r=math.sqrt(c*c+7*math.pi**2*.52**2/3-5*.9**2)
    x=q*r/p['hc']
    return (3*spherical_jn(1,x)/x if x else 1)*math.exp(-.5*(q*.9/p['hc'])**2)
def xe(E,mass,lam,halo):
    total=0.
    for A,atomic,f in p['iso']:
        mA=atomic*.93149410242-54*.00051099895; mu=mass*mA/(mass+mA)
        q=math.sqrt(2*mA*E*1e-6)
        propagator=mh*mh*mr*mr/((mh*mh+q*q)*(mr*mr+q*q))
        total+=f*A*A*mA*1e-6*form(q,A)**2*propagator**2*eta(q/(2*mu)*ckm,*halo)
    return total*C(lam,mass)**2/(2*math.pi)*p['conv']*.3/mass*ckm**2*1e5*p['year']*p['xe_atoms']
def local_upper(mass,lam,halo):
    # F=1 and contact propagator upper bound for independent elastic nuclei.
    mean=quad(lambda v:v*h['pdf'](v,*halo),0,halo[1]+halo[2],points=[halo[1]-halo[2]],epsabs=1e-9)[0]*1e5
    total=0.
    for A,atomic,f in [(12,12.,1-p['f13']),(13,13.00335483507,p['f13'])]:
        mA=atomic*.93149410242-6*.00051099895; mu=mass*mA/(mass+mA)
        total+=p['nc']/p['f13']*f*A*A*mu*mu
    return 2*total*C(lam,mass)**2/math.pi*p['conv']*.3/mass*mean*p['d']['hold_time_s']
rows=[]
for old in spin:
    if old['B0_GeV']!=2.7 or old['b_C13_fm']!=1.7:continue
    mass=old['mchi_GeV']; halo=h['scenarios'][old['halo']]
    F=quad(lambda E:xe(E,mass,.1,halo),5.4,269.9,epsabs=1e-10)[0]
    H=quad(lambda E:xe(E,mass,.1,halo),200,269.9,epsabs=1e-12)[0]
    for lam in [0.,.01,.03,.07,.1]:
        scale=(lam/.1)**2
        D=local_upper(mass,lam,halo)
        rows.append(dict(halo=old['halo'],mchi_GeV=mass,lambda_PhiH=lam,C_SI_GeV_m2=C(lam,mass),Xe_scalar_full=F*scale,Xe_scalar_high=H*scale,Xe_tree_total_full=old['Xe_raw_full']+F*scale,Xe_tree_total_high=old['Xe_raw_high']+H*scale,D_scalar_free_nuclei_upper=D,D_tree_free_nuclei_upper=D+old['D_upper'],lambda_equal_full_Xe=.1*math.sqrt(old['Xe_raw_full']/F),lambda_equal_local_upper=.1*math.sqrt(old['D_upper']/local_upper(mass,.1,halo))))
# Scalar identity and O6 have zero interference after an unpolarized DM trace.
Sz=np.diag([1.,-1.])/2; op=np.kron(Sz,Sz); ident=np.eye(4)
interference=np.trace(ident@op).real
checks={'unpolarized_scalar_O6_interference_zero':interference==0,
        'zero_quartic_zero_tree_scalar':all(r['Xe_scalar_full']==r['D_scalar_free_nuclei_upper']==0 for r in rows if r['lambda_PhiH']==0),
        'nested_positive_scalar_windows':all(0<r['Xe_scalar_high']<r['Xe_scalar_full'] for r in rows if r['lambda_PhiH']>0),
        'quartic_squared_scaling':math.isclose(xe(20,400,.02,h['scenarios']['central'])/xe(20,400,.01,h['scenarios']['central']),4,rel_tol=1e-12)}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
Path(__file__).with_suffix('.json').write_text(json.dumps(dict(checks=checks,rows=rows,scope='Two tree channels only; approximate independent free nuclei local upper bound; scalar loops can interfere and remain uncomputed',full_model_admitted=False),indent=2)+'\n')
print(json.dumps({'checks':checks,'central_400':[r for r in rows if r['halo']=='central' and r['mchi_GeV']==400]},indent=2))
