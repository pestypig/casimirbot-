"""Literal source Helm response versus archived alternatives; no detector fit."""
import hashlib,json,math
from pathlib import Path
from scipy.special import spherical_jn,ndtr
from scipy.integrate import quad
base=Path(__file__).parent
parent=base/'casimir-dp-absorption-rate-2026-09-07.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='20b3adc518206caa51f964310d629a8654bf351e98e1d3cc3976406414c320fb'
a={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),a)
p=a['p']

def form(A,q,model):
    if model!='source_Helm':return a['form'](A,q,model)
    x=q*1.14*A**(1/3)/p['hc']
    return (1. if x==0 else 3*spherical_jn(1,x)/x)*math.exp(-.5*(q*.9/p['hc'])**2)

def calc(m,model):
    sigma=m*m/(4*math.pi*11500.**4)*p['conv']
    common=.3/m*a['ccm']*sigma
    xe=[];local=0.
    for A,atomic,f in p['iso']:
        M=atomic*.93149410242-54*.00051099895
        T=m*m/(2*(M+m));q=m-T;enh=A*A*form(A,q,model)**2
        events=common*enh*f*p['xe_atoms']*p['year']
        roi=ndtr((280.5-T*1e6)/23)-ndtr((215.5-T*1e6)/23)
        xe.append(dict(A=A,T_keV=T*1e6,q_GeV=q,enhancement=enh,raw=events,gaussian_ROI=events*roi))
    for A,atomic,f in [(12,12.,1-p['f13']),(13,13.00335483507,p['f13'])]:
        M=atomic*.93149410242-6*.00051099895
        q=m-m*m/(2*(M+m))
        local+=common*A*A*form(A,q,model)**2*f*p['nc']/p['f13']*p['d']['hold_time_s']
    return dict(m_GeV=m,form=model,Xe_raw=sum(r['raw'] for r in xe),local_D_le_2N=2*local,
                diagnostic_2p8ty_50pct_gaussian_ROI=sum(r['gaussian_ROI'] for r in xe)*.5*2.8/2.84,isotopes=xe)

rows=[calc(m,model) for m in [.247,.2475] for model in ['source_Helm','Helm','KN']]
# Independent real-space transform of a uniform ball, multiplied by Gaussian skin.
errors=[]
for A in [12,13,128,131,136]:
    for q in [.01,.247,.3]:
        radius=1.14*A**(1/3);k=q/p['hc']
        numeric=3/radius**3*quad(lambda r:r*r*(1 if r==0 else math.sin(k*r)/(k*r)),0,radius,epsabs=1e-12)[0]*math.exp(-.5*(k*.9)**2)
        errors.append(abs(numeric-form(A,q,'source_Helm')))
old=json.loads((base/'casimir-dp-absorption-rate-2026-09-07.json').read_text())
checks=dict(real_space_transform=max(errors)<1e-12,zero_momentum=form(131,0,'source_Helm')==1.,
            archived_rates_preserved=all(math.isclose(next(r for r in rows if r['m_GeV']==.247 and r['form']==oldr['form_prescription'])['Xe_raw'],oldr['Xe_raw_all_lines_2p84ty'],rel_tol=1e-12) for oldr in old['rows'] if oldr['form_prescription']!='point'),
            gaussian_acceptance=all(0<=r['diagnostic_2p8ty_50pct_gaussian_ROI']<=r['Xe_raw'] for r in rows))
checks={k:bool(v) for k,v in checks.items()}
assert all(checks.values())
out=dict(scope='Exact source Helm prescription, exact rest-frame line kinematics and inherited leading heavy-nucleus rate. Gaussian and constant efficiency are illustrative only. No new exclusion.',checks=checks,max_transform_absolute_error=max(errors),rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(checks=checks,rows=[{k:v for k,v in r.items() if k!='isotopes'} for r in rows],Xe131_source=next(x for x in rows[0]['isotopes'] if x['A']==131)),indent=2))
