"""Natural-xenon finite-speed sign comparison at two fixed speeds."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-finite-speed-xe131-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='e9d2dcfcc01a2ad090edc01c86656950caec3a49a5ef98ce97f32762bfad595c'
t={'__file__':str(p)};exec(p.read_text().split('\nrows=[]')[0],t)
q=base/'casimir-dp-darkelf-xenon-match-2026-09-07.py'
assert hashlib.sha256(q.read_bytes()).hexdigest()=='6eaf46b926f7c93e75b6a5b4751be6995f7fc7076899b82fde11fddaf3ee1c23'
x={'__file__':str(q)};exec(q.read_text().split('# Analytic integrated')[0],x)
ht=t['n'];alpha=ht['alpha'];rows=[];bornchecks=[]
branch=json.loads((base/'casimir-dp-coupled-attenuation-branches-2026-09-07.json').read_text())
scale=3.9*branch['rows'][1]['cross_section_multiplier']
for A,M,f in x['iso']:
 ma=x['mass'](M);mu=100*ma/(100+ma)
 Rfm=math.sqrt((1.23*A**(1/3)-.6)**2+7*math.pi**2*.52**2/3-5*.9**2)
 ht.update(A=A,mA=ma,mu=mu,R=Rfm*.01/.1973269804,lam=2*mu*54*alpha/.01)
 t['pot'],_,_=ht['build'](24001)
 for speed in [650,776]:
  x['v']=speed/299792.458
  for sign in [-1,1]:
   r=t['rates'](speed,sign*ht['lam'],.0005,36,40)
   r.update(A=A,atomic_mass_u=M,nuclear_mass_GeV=ma,number_fraction=f,sign=sign)
   # Independent prior recoil-variable Born expression, same coupling normalization.
   for name,lo,hi in [('low',5.4,10),('high',200,269.9)]:
    integral=quad(lambda E:x['ds'](E,A,ma),lo,min(hi,x['emax'](ma)),epsabs=1e-60,epsrel=1e-9)[0]
    expected=integral*scale*.01**2/.3893793721e-27
    err=abs(r['bands'][name]['born']/expected-1)
    assert err<1e-6
    bornchecks.append(dict(A=A,speed=speed,sign=sign,band=name,relative_error=err))
   rows.append(r)
  print(json.dumps(dict(completed_A=A,speed_kms=speed)),flush=True)
mixtures=[]
for speed in [650,776]:
 for sign in [-1,1]:
  selected=[r for r in rows if r['speed_kms']==speed and r['sign']==sign]
  bands={}
  for name in ['low','high']:
   sums={key:sum(r['number_fraction']*r['bands'][name][key] for r in selected) for key in ['exact','born']}
   sums['ratio']=sums['exact']/sums['born'];bands[name]=sums
  total={key:sum(r['number_fraction']*r['total'][key] for r in selected) for key in ['exact','born']}
  total['ratio']=total['exact']/total['born']
  mixtures.append(dict(speed_kms=speed,sign=sign,bands=bands,total=total,low_to_high=bands['low']['exact']/bands['high']['exact']))
out=dict(status='natural_isotope_two_speed_kernel_not_transport_prediction',rows=rows,mixtures=mixtures,born_normalization_checks=bornchecks,
 source_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest(),q.name:hashlib.sha256(q.read_bytes()).hexdigest()},
 checks=['source hashes','inherited charge normalization and form-factor checks','inherited angular integral versus phase sum','independent Born recoil-variable normalization'],
 limitations=['two speeds only','no physical charge-profile uncertainty','independent full solver check previously limited to Xe131 at 650 km/s','not a transported or accepted spectrum','same coupling product does not supply captured population or local sensitivity'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(mixtures,indent=2))
