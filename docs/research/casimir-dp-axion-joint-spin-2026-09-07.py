"""Shared axion tree spin channel: approximate nuclei, raw Xe and C13 D<=2N."""
import ast, hashlib, json, math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
base=Path(__file__).parent

def definitions(name,sha,marker):
    path=base/name; raw=path.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==sha
    ns={'__file__':str(path)}
    exec(compile(raw.decode().split(marker)[0],str(path),'exec'),ns)
    return ns
h=definitions('casimir-dp-l10-halo-2026-09-06.py','bc09a637a22c4bbc1cb7ec0acbe6c884b6021851e4dc451347c19e1c369788a3','\nchecks={')
a=definitions('casimir-dp-axion-longitudinal-matching-2026-09-07.py','63eda9fe43f1835decfec9c72544b0d48a64dc57307eebdf33460e8a21da6430','\n# Independent Cartesian')
p=h['p']; eta=h['eta']; ckm=h['ckm']
source=base/'casimir-dp-spin-response-intake-2026-09-06/WIMpy__WS2.py'
raw=source.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='bcb52680c7dcf397a9bbe2b8577b1cd5d3121f766b36eb9b6c7a250ce5afa086'
tree=ast.parse(raw); selected=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['H','Xe129','Xe131']]
w={'np':np,'__builtins__':{}}
exec(compile(ast.Module(body=selected,type_ignores=[]),str(source),'exec'),w)
WH=w['H'](0,0,0)

def ds_weight(q,mass,B0,A=None,b=1.7,scale=1.):
    dp,dn=a['matching'](q,B0)*a['gchi']*a['gu']*scale/(a['ma']**2+q*q)
    if A is None:
        response=dn*dn*a['kL'](q,b)**2
    else:
        osc=math.sqrt(41.467/(45*A**(-1/3)-25*A**(-2/3)))
        y=(q*osc/(2*a['hc']))**2
        d0,d1=(dp+dn)/2,(dp-dn)/2
        fn=w[f'Xe{A}']
        W=d0*d0*fn(0,0,y)+2*d0*d1*fn(0,1,y)+d1*d1*fn(1,1,y)
        assert W>=0, 'Negative contracted response'
        response=W/WH*2/(2*(.5 if A==129 else 1.5)+1)
    return q**4*response/(64*math.pi*mass**2*a['mn']**2)*p['conv']

def xenon(E,mass,B0,halo,scale=1.):
    total=0.
    for A,atomic,f in p['iso']:
        if A not in [129,131]:continue
        ma=atomic*.93149410242-54*.00051099895; mu=mass*ma/(mass+ma)
        q=math.sqrt(2*ma*E*1e-6)
        total+=f*ds_weight(q,mass,B0,A,scale=scale)*2*ma*1e-6*eta(q/(2*mu)*ckm,*halo)
    return total*p['xe_atoms']*.3/mass*ckm**2*1e5*p['year']

def carbon(mass,B0,b,halo):
    mu=mass*p['mc']/(mass+p['mc']); vmax=halo[1]+halo[2]
    xmax=(2*mu*vmax/ckm)**2
    # Scale tiny integrands for meaningful numerical quadrature tolerances.
    integral=quad(lambda t:ds_weight(math.sqrt(xmax*t),mass,B0,b=b)*eta(vmax*math.sqrt(t),*halo)*1e50,0,1,epsabs=1e-10,epsrel=1e-9)[0]*1e-50*xmax
    return integral*p['nc']*.3/mass*ckm**2*1e5*p['d']['hold_time_s']

rows=[]
for name,halo in h['scenarios'].items():
    for mass in [400.,1000.]:
        for B0 in [2.7,3.0]:
            full=quad(lambda E:xenon(E,mass,B0,halo),5.4,269.9,epsabs=1e-12,epsrel=1e-8)[0]
            high=quad(lambda E:xenon(E,mass,B0,halo),200,269.9,epsabs=1e-12,epsrel=1e-8)[0]
            for b in [1.4,1.7,2.0]:
                N=carbon(mass,B0,b,halo)
                rows.append(dict(halo=name,mchi_GeV=mass,B0_GeV=B0,b_C13_fm=b,Xe_raw_full=full,Xe_raw_high=high,C13_expected_count=N,D_upper=2*N,D_upper_per_Xe_full=2*N/full))
# Independent speed-first integration of local scattering.
halo=h['scenarios']['central']; mass=400.; mu=mass*p['mc']/(mass+p['mc'])
def speed_integrand(v):
    xmax=(2*mu*v/ckm)**2
    cross=quad(lambda t:ds_weight(math.sqrt(xmax*t),mass,2.7,b=1.7)*1e50,0,1,epsabs=1e-10)[0]*1e-50*xmax/(v/ckm)**2
    return cross*h['pdf'](v,*halo)*v*1e5*1e40
Ndirect=quad(speed_integrand,1e-8,halo[1]+halo[2],points=[halo[1]-halo[2]],epsabs=1e-8,epsrel=1e-8)[0]*1e-40*p['nc']*.3/mass*p['d']['hold_time_s']
# H is a proton: contracting d0,d1 must recover dp^2 for arbitrary dn.
proton_errors=[]
for dp,dn in [(1.,0.),(0.,1.),(2.,-3.)]:
    d0,d1=(dp+dn)/2,(dp-dn)/2
    contraction=sum(di*dj*w['H'](i,j,0) for i,di in enumerate([d0,d1]) for j,dj in enumerate([d0,d1]))/WH
    proton_errors.append(abs(contraction-dp*dp))
checks={'proton_isospin_anchor':max(proton_errors)<1e-12,
        'local_two_integration_orders':math.isclose(Ndirect,carbon(400,2.7,1.7,halo),rel_tol=1e-7),
        'coupling_squared_scaling':math.isclose(xenon(248,400,2.7,halo,2)/xenon(248,400,2.7,halo),4,rel_tol=1e-12),
        'positive_nested_windows':all(0<r['Xe_raw_high']<r['Xe_raw_full'] for r in rows)}
checks={k:bool(v) for k,v in checks.items()}; assert all(checks.values()),checks
out=dict(scope='Tree O6 only; LO pole matching, old Xe tables, approximate independent free C13 nuclei; not full material or detector likelihood',checks=checks,config_sha256=p['sha'],response_sha256=hashlib.sha256(raw).hexdigest(),halo=h['scenarios'],rows=rows,local_direct_relative_error=Ndirect/carbon(400,2.7,1.7,halo)-1,joint_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'central':[r for r in rows if r['halo']=='central' and r['b_C13_fm']==1.7]},indent=2))
