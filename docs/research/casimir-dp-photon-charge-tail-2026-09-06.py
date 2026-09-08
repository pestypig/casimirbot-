"""All-q envelope for the specified smooth rigid neutral charge density only."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
from scipy.special import spherical_jn
base=Path(__file__).parent
parent=base/'casimir-dp-photon-neutral-screen-2026-09-06.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='fc43a596785f55f99e939df3a454f5fbf6261a09b28160c52730ae872b2f071a'
data=json.loads(parent.read_text())
cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(cfg.read_bytes()).hexdigest()==data['config_sha256']
d=json.loads(cfg.read_text())['leading_design']
R=d['radius_m'];u=1.66053906892e-27;hc=.1973269804;v=776/299792.458
N=d['mass_kg']/(12.011*u);year=365.25*86400
iso=[(124,123.9058920,.000952),(126,125.9042983,.000890),(128,127.9035310,.019102),
     (129,128.9047808611,.264006),(130,129.903509349,.040710),(131,130.90508406,.212324),
     (132,131.9041550856,.269086),(134,133.90539466,.104357),(136,135.907214484,.088573)]
xeatoms=2.84*1000/(sum(m*f for _,m,f in iso)*u)
def shape(E,mass,A,m):
    ma=m*.93149410242-54*.00051099895;mu=mass*ma/(mass+ma)
    if E*1e-6>2*mu*mu*v*v/ma:return 0.
    q=math.sqrt(2*ma*E*1e-6)
    c=1.23*A**(1/3)-.60;r=math.sqrt(c*c+7*math.pi**2*.52**2/3-5*.9**2)
    F=3*spherical_jn(1,q*r/hc)/(q*r/hc)*math.exp(-.5*(q*.9/hc)**2)
    recoil=1-E*1e-6/(2*ma*v*v)-E*1e-6/(mass*v*v)
    assert recoil>=0
    return 54**2*F*F*recoil/E # dE/E, E measured consistently in keV
def xe_kernel(mass,lo,hi):
    return sum(f*quad(lambda E:shape(E,mass,A,m),lo,hi,epsabs=1e-11,epsrel=1e-9)[0] for A,m,f in iso)
rows=[];tail_checks=[]
for r in data['rows']:
    if r['qR_cut']!=80:continue
    eps=r['assumed_electron_rms_nm']*1e-9/R;X=80.;xs=math.sqrt(6)/eps
    # F^2<=36/x^4, screening^2<=min(eps^4*x^4/36,1), coherence<=2.
    tail=eps**4*(4*math.log(xs/X)+1)
    # Independent log-variable quadrature over the piecewise analytic envelope.
    numerical=quad(lambda t:4*eps**4,math.log(X),math.log(xs),epsabs=1e-30)[0]+36/xs**4
    tail_checks.append(math.isclose(numerical,tail,rel_tol=1e-12))
    upper=r['neutral_integral']+tail
    for mass in [100.,200.,1000.]:
        for lo,hi in [(5.4,270.),(200.,270.)]:
            xe=xe_kernel(mass,lo,hi)
            ratio=d['hold_time_s']*N*N*36*upper/(year*xeatoms*xe)
            rows.append({'electron_rms_nm_assumed':r['assumed_electron_rms_nm'],'mchi_GeV':mass,
                         'Xe_window_keV':[lo,hi],'partial_integral':r['neutral_integral'],
                         'tail_upper':tail,'full_rigid_integral_upper':upper,'Xe_charge_shape_integral':xe,
                         'D_rigid_charge_upper_per_raw_Xe_charge_count':ratio})
checks={'tail_integral_two_forms':all(tail_checks),
        'tail_positive':all(r['tail_upper']>0 for r in rows),
        'full_upper_exceeds_partial':all(r['full_rigid_integral_upper']>r['partial_integral'] for r in rows),
        'positive_xenon_denominator':all(r['Xe_charge_shape_integral']>0 for r in rows)}
assert all(checks.values())
out={'config_sha256':data['config_sha256'],'checks':checks,'rows':rows,
     'scope':'Born smooth rigid charge-density model with Gaussian atomic electrons, isotropic mono-speed 776 km/s; Xe Helm charge term only; no full-material or experimental bound.',
     'ratio_cancels':['alpha','magnetic_moment_squared','common_flux'],
     'missing':['discrete atomic/crystal response','magnetic channel','electronic excitations','surface charge','Born/transport admission','detector likelihood']}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'rows_a0p1_m1000':[r for r in rows if r['electron_rms_nm_assumed']==.1 and r['mchi_GeV']==1000],
                 'full_window_ratio_range':[min(r['D_rigid_charge_upper_per_raw_Xe_charge_count'] for r in rows if r['Xe_window_keV'][0]==5.4),max(r['D_rigid_charge_upper_per_raw_Xe_charge_count'] for r in rows if r['Xe_window_keV'][0]==5.4)]},indent=2))
