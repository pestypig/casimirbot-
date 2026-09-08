"""Leading heavy-nucleus absorption normalization and shared target screen."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.special import spherical_jn
base=Path(__file__).parent
parent=base/'casimir-dp-axion-assembled-subsets-2026-09-07.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='d437f10cac13f73de009c96557d2628a43e4335e03915be2faffca2f030930ad'
a={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),a)
p=a['p'];m=.247;rho=.3;lam=11500.;ccm=29979245800.
sigma_nc=m*m/(4*math.pi*lam**4)*p['conv']
n=rho/m;hold=p['d']['hold_time_s']

# Independent explicit Dirac trace for the leading temporal vector current.
I=np.eye(2);O=np.zeros((2,2));pauli=[np.array([[0,1],[1,0]]),np.array([[0,-1j],[1j,0]]),np.diag([1,-1])]
g0=np.block([[I,O],[O,-I]])
g=[g0]+[np.block([[O,s],[-s,O]]) for s in pauli]
g5=1j*g[0]@g[1]@g[2]@g[3];PR=(np.eye(4)+g5)/2;PL=np.eye(4)-PR
q=m
L00=np.trace((q*g[0]-q*g[3])@g[0]@PR@(m*g[0]+m*np.eye(4))@PL@g[0])/2
Mcheck=1e8
amp2=4*Mcheck*Mcheck*float(L00.real)/lam**4
# Integrated two-body phase space q/(4 pi sqrt(s)), divided by incoming 4mM.
sv_trace=amp2*q/(16*math.pi*m*Mcheck*(Mcheck+m))

def form(A,q,model):
    if model=='point':return 1.
    if model=='KN':
        x=q*1.23*A**(1/3)/p['hc']
        return 3*spherical_jn(1,x)/x/(1+(.7*q/p['hc'])**2)
    c=1.23*A**(1/3)-.60;diff=.52;skin=.9
    radius=math.sqrt(c*c+7*math.pi**2*diff**2/3-5*skin**2)
    x=q*radius/p['hc']
    return 3*spherical_jn(1,x)/x*math.exp(-.5*(q*skin/p['hc'])**2)

rows=[]
for model in ['Helm','KN','point']:
    xe=0.;local=0.;isotopes=[]
    for A,atomic,f in p['iso']:
        M=atomic*.93149410242-54*.00051099895;T=m*m/(2*(M+m));q=m-T
        rate=n*ccm*sigma_nc*A*A*form(A,q,model)**2
        value=rate*f*p['xe_atoms']*p['year'];xe+=value
        isotopes.append(dict(A=A,recoil_keV=T*1e6,raw_events=value))
    for A,atomic,f in [(12,12.,1-p['f13']),(13,13.00335483507,p['f13'])]:
        M=atomic*.93149410242-6*.00051099895;q=m-m*m/(2*(M+m))
        local+=n*ccm*sigma_nc*A*A*form(A,q,model)**2*f*p['nc']/p['f13']*hold
    rows.append(dict(form_prescription=model,Xe_raw_all_lines_2p84ty=xe,
                     local_expected_absorptions_hold=local,
                     local_independent_encounter_D_le_2N=2*local,
                     isotopes=isotopes))
checks={'temporal_spin_trace':math.isclose(float(L00.real),m*m,rel_tol=1e-12),
        'heavy_limit_phase_space':math.isclose(sv_trace,m*m/(4*math.pi*lam**4),rel_tol=1e-8),
        'speed_cancellation':all(math.isclose((sigma_nc/v)*(ccm*v),sigma_nc*ccm,rel_tol=1e-12) for v in [1e-5,1e-3,.003]),
        'exclusive_form_bounds':all(r['local_expected_absorptions_hold']<=rows[-1]['local_expected_absorptions_hold'] and r['Xe_raw_all_lines_2p84ty']<=rows[-1]['Xe_raw_all_lines_2p84ty'] for r in rows)}
assert all(checks.values())
out=dict(scope='Vector temporal-current leading heavy-target rate, exact line kinematics inserted; selected elastic nuclear forms only, no incoherent nuclear/solid channels or detector fit',
         full_model_admitted=False,checks=checks,mchi_GeV=m,Lambda_GeV=lam,rho_GeV_cm3=rho,
         sigma_NC_cm2=sigma_nc,sigma_vphysical_cm3_s=ccm*sigma_nc,
         neglected_recoil_amplitude_scale_m_over_carbon=.247/(12*.93149410242),rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'rows':[{k:v for k,v in r.items() if k!='isotopes'} for r in rows]},indent=2))
