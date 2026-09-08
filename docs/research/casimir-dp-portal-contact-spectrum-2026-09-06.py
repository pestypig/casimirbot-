"""Exploratory isoscalar heavy-contact Xe spectrum; no detector likelihood."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
from scipy.special import spherical_jn
base=Path(__file__).parent
parent=base/'casimir-dp-photon-shared-halo-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='23a3cdfd24c5dfe608558285176c9829ec1d0af66b70d451f676d8470cba2542'
mod={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
p=mod['p'];Moments=mod['Moments'];pdf=mod['pdf'];scenarios=mod['scenarios']
source=base/'casimir-dp-portal-higgs-decay-screen-2026-09-06.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='80b833d29116dbecfd6a8e436af383feb38c003d931349db6a9ca023792685fc'
matched=next(r for r in json.loads(source.read_text())['rows'] if r['b_GeV']==100 and r['SM_width_benchmark_GeV']==.0041)
C=matched['C_chiN_GeV_inverse_squared'];conv=.3893793721e-27
def form(E,A,ma):
    q=math.sqrt(2*ma*E*1e-6)
    c=1.23*A**(1/3)-.6
    r=math.sqrt(c*c+7*math.pi**2*.52**2/3-5*.9**2)
    x=q*r/p['hc']
    return (3*spherical_jn(1,x)/x if x else 1)*math.exp(-.5*(q*.9/p['hc'])**2)
def shape(E,mass,M,direct=False):
    out=0.
    for A,atomic,f in p['iso']:
        ma=atomic*.93149410242-54*.00051099895
        red=mass*ma/(mass+ma);vm=math.sqrt(2*ma*E*1e-6)/(2*red)
        if direct:
            cut=(M.h[1]-M.h[2])/299792.458
            eta=quad(lambda v:float(pdf(v,M.h))/v,vm,M.v[-1],points=[cut] if vm<cut<M.v[-1] else [],epsabs=1e-10)[0] if vm<M.v[-1] else 0.
        else:eta=float(M(vm)[0])
        out+=f*A*A*ma*1e-6*form(E,A,ma)**2*eta
    return out
rows=[]
U90=1887.0624687873465
for halo,h in scenarios.items():
    M=Moments(h)
    for mass in [100.,200.,1000.]:
        pref=.3/mass*299792.458*1e5*p['year']*p['xeatoms']*C*C/(2*math.pi)*conv
        full=pref*quad(lambda E:shape(E,mass,M),5.4,269.9,epsabs=1e-7,epsrel=1e-7)[0]
        high=pref*quad(lambda E:shape(E,mass,M),200.,270.,epsabs=1e-7,epsrel=1e-7)[0]
        red=mass*.939/(mass+.939)
        rows.append({'halo':halo,'mass_GeV':mass,'sigma_nucleon_cm2':red*red*C*C/math.pi*conv,'Xe_raw_5p4_269p9':full,'Xe_raw_200_270':high,'full_over_high':full/high,'C_conditional_upper_GeV_inverse_squared':abs(C)*math.sqrt(U90/(.5*full)),'raw_high_at_conditional_count_ceiling':U90*high/(.5*full),'raw_full_for_one_raw_high':full/high})
M=Moments(scenarios['central'])
errors=[abs(shape(E,m,M)/shape(E,m,M,True)-1) for E,m in [(10.,100.),(100.,200.),(248.,1000.)]]
# Independent free-nucleon total cross-section integration in recoil energy.
mass=1000.;mn=.939;v=.002;red=mass*mn/(mass+mn)
emax=2*red*red*v*v/mn
integrated=quad(lambda E:C*C*mn/(2*math.pi*v*v),0,emax,epsabs=1e-50)[0]
# Exact two-heavy-scalar off-diagonal propagator / q=0 contact amplitude.
# Eigenmasses already matched in authenticated parent packet.
q2max=2*max(a*.93149410242-54*.00051099895 for _,a,_ in p['iso'])*270e-6
ratio=125.**2*matched['heavy_eigenmass_GeV']**2/((125.**2+q2max)*(matched['heavy_eigenmass_GeV']**2+q2max))
checks={'free_nucleon_normalization':math.isclose(integrated,red*red*C*C/math.pi,rel_tol=1e-12),'direct_speed_fold':max(errors)<1e-6,'positive_windows':all(0<r['Xe_raw_200_270']<r['Xe_raw_5p4_269p9'] for r in rows),'heavy_propagator_rate_correction_below_1e_minus5':1-ratio**2<1e-5,'count_ceiling_inverts':all(math.isclose(.5*r['Xe_raw_5p4_269p9']*(r['C_conditional_upper_GeV_inverse_squared']/C)**2,U90,rel_tol=1e-12) for r in rows)}
checks={k:bool(v) for k,v in checks.items()}
assert all(checks.values())
out={'checks':checks,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'C_chiN_GeV_inverse_squared':C,'max_direct_fold_relative_error':max(errors),'max_heavy_propagator_relative_rate_reduction':1-ratio**2,'rows':rows,'scope':'Isoscalar scalar contact, Helm nuclear approximation, 2.84 tonne years, rho=.3 GeV/cm3. True recoil energy before efficiency/smearing. Conditional 50 percent acceptance floor with all 1831 events; not an LZ likelihood or full portal/solid prediction.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'central':[r for r in rows if r['halo']=='central']},indent=2))
