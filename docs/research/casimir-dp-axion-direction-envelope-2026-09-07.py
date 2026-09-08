"""Positive isotropic majorant of the shifted halo removes target averaging."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
path=base/'casimir-dp-axion-scalar-closure-bound-2026-09-07.json'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='c9d447bce8f917862716ff8b32bc7d5bf9d1977ad6ddefdc29a0276475e57b7c'
old=json.loads(path.read_text())
path=base/'casimir-dp-axion-assembled-subsets-2026-09-07.py'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='d437f10cac13f73de009c96557d2628a43e4335e03915be2faffca2f030930ad'
a={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),a)
def norm(v0,vesc):
    z=vesc/v0
    return (math.erf(z)-2*z*math.exp(-z*z)/math.sqrt(math.pi))*math.pi**1.5*v0**3
def envelope(v,v0,vesc,ve):
    return math.exp(-(v-ve)**2/v0**2)/norm(v0,vesc) if abs(v-ve)<=vesc else 0.
def directional(v,c,v0,vesc,ve):
    u2=v*v+ve*ve+2*v*ve*c
    return math.exp(-u2/v0**2)/norm(v0,vesc) if u2<=vesc*vesc else 0.
halos=[]; error=0.; dominates=True
for name,halo in a['h']['scenarios'].items():
    v0,vesc,ve=halo
    M=quad(lambda v:4*math.pi*v**3*envelope(v,*halo),0,vesc+ve,epsabs=1e-9)[0]
    mean=quad(lambda v:v*a['h']['pdf'](v,*halo),0,vesc+ve,points=[vesc-ve])[0]
    number=quad(lambda v:4*math.pi*v*v*envelope(v,*halo),0,vesc+ve)[0]
    halos.append(dict(halo=name,flux_majorant_km_s=M,mean_speed_km_s=mean,flux_factor=M/mean,envelope_integral=number))
    for v in [1.,100.,300.,600.,vesc+ve-1]:
        cut=min(1.,(vesc*vesc-v*v-ve*ve)/(2*v*ve))
        actual=2*math.pi*v*v*quad(lambda c:directional(v,c,*halo),-1,cut,epsabs=1e-13)[0] if cut>-1 else 0.
        error=max(error,abs(actual-a['h']['pdf'](v,*halo)))
        for c in [-1.,-.5,0.,.5,1.]:
            dominates=dominates and directional(v,c,*halo)<=envelope(v,*halo)*(1+1e-12)
rows=[]
for r in old['rows']:
    factor=next(x['flux_factor'] for x in halos if x['halo']==r['halo'])
    rows.append(dict(lambda_PhiH=r['lambda_PhiH'],halo=r['halo'],D_any_orientation_upper=r['D_scalar_closure_upper']*factor,flux_factor=factor))
checks={'directional_integral_recovers_speed_pdf':error<1e-10,'pointwise_majorant_samples':bool(dominates),'majorant_not_renormalized':all(r['envelope_integral']>=1 for r in halos),'zero_wind_limit':math.isclose(quad(lambda v:4*math.pi*v*v*envelope(v,238.,544.,0.),0,544.)[0],1.,rel_tol=1e-12)}
assert all(checks.values())
out=dict(scope='Any fixed crystal orientation, shifted truncated Maxwellian; retains Born/contact and nonnegative target energy assumptions',full_model_admitted=False,checks=checks,max_speed_pdf_absolute_error=error,halos=halos,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'central_lambda03':next(r for r in rows if r['halo']=='central' and r['lambda_PhiH']==.03)},indent=2))
