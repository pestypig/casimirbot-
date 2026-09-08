"""Same-parameter scalar elastic Xe companion; truth-level, no detector fit."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
b=Path(__file__).parent
p=b/'casimir-dp-exothermic-common-rate-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='88b9b551c88645ce49e1212751068d23ba25cf5d20ba43a351623947f0244567'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
p=b/'casimir-dp-dark-scalar-sphere-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='f09759040f9a9b2e3b87fef034cb7e7ccc292e9974561b9a79e1d0f1080740d3'
local=json.loads(p.read_text())
a=n['a'];h=n['h'];halo=n['halo'];ckm=n['ckm']
def spectrum(E,m,C):
    total=0.
    for A,atomic,f in a['iso']:
        mass=atomic*.93149410242-54*.00051099895;mu=m*mass/(m+mass)
        q=math.sqrt(2*mass*E*1e-6)
        total+=f*mass*A*A*n['n']['form'](q,A)**2*C(q)**2*h['eta'](q/(2*mu)*ckm,*halo)
    return total*1e-6/(2*math.pi)*a['conv']*.3/m*ckm**2*1e5*a['xe_atoms']*a['year']
bins=[(5.4,10.),(10.,30.),(30.,100.),(100.,200.),(200.,269.9)]
rows=[];errors=[]
for old in local['rows']:
    m=old['mchi_GeV'];ms=old['scalar_mass_GeV'];gap=.000248*(m+131.293*.93149410242)/m
    y=gap/1000.;gN0=.3*.939/246.2
    for label,theta in [('reference',local['reference_theta']),('formal_sphere_target',old['formal_theta_for_target'])]:
        if theta is None:continue
        def C(q):return y*gN0*math.sin(theta)*math.cos(theta)*(1/(q*q+ms*ms)-1/(q*q+125**2))
        values=[quad(lambda E:spectrum(E,m,C),lo,hi,epsabs=1e-38,epsrel=1e-8,limit=300)[0] for lo,hi in bins]
        rows.append(dict(mchi_GeV=m,scalar_mass_GeV=ms,angle_role=label,theta=theta,Xe_raw_bins=values,Xe_raw_window=sum(values),Xe_raw_high=values[-1],sphere_target_valid=False if label=='formal_sphere_target' else None))
    # Independent normalization recovery: inherited vector contact at zero release
    # equals leading scalar contact with the same physical NR coefficient.
    cp=math.sqrt(math.pi*1e-45/a['conv'])/(m*n['mp']/(m+n['mp']))
    direct=quad(lambda E:spectrum(E,m,lambda q:cp),5.4,269.9,epsabs=1e-12,epsrel=1e-8)[0]
    inherited=0.
    for A,atomic,f in a['iso']:
        mass=atomic*.93149410242-54*.00051099895
        inherited+=n['rate'](m,A,54,mass,0.,5.4e-6,269.9e-6)*f*a['xe_atoms']*a['year']
    errors.append(abs(direct/inherited-1))
assert max(errors)<1e-7
out=dict(scope='Leading nonrelativistic scalar elastic Xe, Helm isoscalar nucleon proxy, total halo density .3 GeV/cm3, 2.84 tonne-year exposure. No efficiency, resolution, backgrounds, fit or exclusion. Formal sphere-target angles retain invalid Born-sphere labels; elastic nuclei are a different calculation.',bins_keV=bins,rows=rows,checks={'contact_normalization_max_relative_error':max(errors),'nonnegative_bins':all(min(r['Xe_raw_bins'])>=0 for r in rows)},full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
