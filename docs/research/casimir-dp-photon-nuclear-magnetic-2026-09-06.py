"""Charge plus nuclear magnetic components at one common DM magnetic moment."""
import hashlib,json,math,csv
from pathlib import Path
import numpy as np
from scipy.integrate import quad
from scipy.special import spherical_jn
base=Path(__file__).parent
parent=base/'casimir-dp-photon-charge-tail-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='50587429875f189c69f249728c55d3c1a2fb8fc702af5e397ef8d4812c1cbdaa'
p={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),p)
moments={129:(.5,-.7779607),131:(1.5,.6918451)} # nuclear magnetons, ground states
mp=.93827208816;muC=.70241
tail=json.loads(parent.with_suffix('.json').read_text())
def magnetic(E,mass,A,m):
    if A not in moments:return 0.
    ma=m*.93149410242-54*.00051099895;reduced=mass*ma/(mass+ma)
    if E*1e-6>2*reduced**2*p['v']**2/ma:return 0.
    spin,moment=moments[A];q=math.sqrt(2*ma*E*1e-6)
    c=1.23*A**(1/3)-.6;r=math.sqrt(c*c+7*math.pi**2*.52**2/3-5*.9**2)
    # Explicit phenomenological assumption G_M=G_E=Helm.
    F=3*spherical_jn(1,q*r/p['hc'])/(q*r/p['hc'])*math.exp(-.5*(q*.9/p['hc'])**2)
    return (spin+1)/(3*spin)*moment**2*ma/(mp**2*p['v']**2)*F*F*1e-6
def xe_mag(mass,lo,hi):
    return sum(f*quad(lambda E:magnetic(E,mass,A,m),lo,hi,epsabs=1e-11)[0] for A,m,f in p['iso'])
def carbon_kernel(mass,b):
    mc=13.00335483507*.93149410242-6*.00051099895;reduced=mass*mc/(mass+mc)
    xmax=(2*reduced*p['v'])**2
    # Moment fixes q=0; normalized single-particle shape is an assumption.
    shape=lambda t:((1-2*(xmax*t*b*b/(4*p['hc']**2)))*math.exp(-xmax*t*b*b/(4*p['hc']**2)))**2
    return muC**2/(2*mp**2*p['v']**2)*xmax*quad(shape,0,1,epsabs=1e-12)[0]
nc=p['d']['mass_kg']/((12*(1-.0107)+13.00335483507*.0107)*p['u'])*.0107
rows=[]
for mass in [100.,200.,1000.]:
    full=p['xe_kernel'](mass,5.4,270)+xe_mag(mass,5.4,270)
    high=p['xe_kernel'](mass,200,270)+xe_mag(mass,200,270)
    for b in [1.4,1.6,1.8,2.0]:
        for lo,hi in [(5.4,270.),(200.,270.)]:
            charge=p['xe_kernel'](mass,lo,hi);mag=xe_mag(mass,lo,hi)
            rigid=next(r for r in tail['rows'] if r['mchi_GeV']==mass and r['electron_rms_nm_assumed']==.1 and r['Xe_window_keV']==[lo,hi])
            mag_ratio=2*p['d']['hold_time_s']*nc*carbon_kernel(mass,b)/(p['year']*p['xeatoms']*(charge+mag))
            charge_ratio=rigid['D_rigid_charge_upper_per_raw_Xe_charge_count']*charge/(charge+mag)
            rows.append({'mass_GeV':mass,'b_C13_fm':b,'window_keV':[lo,hi],'Xe_charge_kernel':charge,
                         'Xe_magnetic_kernel':mag,'Xe_full_to_high_ratio':full/high,
                         'D_nuclear_magnetic_upper_per_raw_Xe_count':mag_ratio,
                         'D_rigid_charge_upper_per_raw_Xe_count':charge_ratio,
                         'D_two_components_upper_per_raw_Xe_count':mag_ratio+charge_ratio})
# Equation 3 and equation 4 normalization, spin-half target and DM.
alpha=1/137.035999084;e=math.sqrt(4*math.pi*alpha);muDM=1e-6;muN=muC*e/(2*mp)
via_moments=muDM**2*muN**2/(2*math.pi*p['v']**2)
via_muN_units=alpha*muDM**2*muC**2/(2*mp**2*p['v']**2)
checks={'eq3_eq4_normalization':math.isclose(via_moments,via_muN_units,rel_tol=1e-12),
        'carbon_point_limit':math.isclose(carbon_kernel(1000,0),muC**2/(2*mp**2*p['v']**2)*(2*(1000*(13.00335483507*.93149410242-6*.00051099895)/(1000+13.00335483507*.93149410242-6*.00051099895))*p['v'])**2,rel_tol=1e-12),
        'positive_components':all(r['Xe_charge_kernel']>0 and r['Xe_magnetic_kernel']>0 for r in rows),
        'more_full_than_high':all(r['Xe_full_to_high_ratio']>1 for r in rows)}
assert all(checks.values())
out={'config_sha256':p['data']['config_sha256'],'moments_muN':moments,'C13_moment_muN':muC,
     'checks':checks,'rows':rows,'scope':'Two specified channels only, Born, mono-speed 776 km/s, Xe unit efficiency, GM=Helm; not full electromagnetic or experimental bound.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
with Path(__file__).with_suffix('.csv').open('w',newline='') as f:
    w=csv.writer(f);w.writerow(['E_keV','charge_shape_m1000','magnetic_shape_m1000'])
    for E in np.linspace(5.4,270,1601):
        w.writerow([E,sum(fr*p['shape'](E,1000,A,m) for A,m,fr in p['iso']),sum(fr*magnetic(E,1000,A,m) for A,m,fr in p['iso'])])
print(json.dumps({'checks':checks,'rows_b1p6':[r for r in rows if r['b_C13_fm']==1.6]},indent=2))
