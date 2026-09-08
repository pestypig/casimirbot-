"""Ground-state one-phonon sum in a conditional droplet model, not inclusive DM."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad
from scipy.special import spherical_jn

source=Path('docs/research/casimir-dp-dark-composite-force-rate-2026-09-07.py')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='439bcd9441c8064486d1ef43a640c8bce0e4508a7335b1dd0255488500d0548e'
s={}
exec(compile(source.read_text(encoding='utf-8').split('\nrows = []')[0],str(source),'exec'),s)
n=s['n']; R=s['rd']; M=s['mass']; N=s['N']
mu=n['mu']; v=n['v']; mA=n['mxe']
rhoD=3*M/(4*math.pi*R**3)
force_rows=json.loads(s['force'].read_text())['rows']
rows=[]
for gap2_keV in [28.,100.,248.]:
    gap2=gap2_keV*1e-6
    modes=[]
    for ell in range(2,100):
        gap=gap2*math.sqrt(ell*(ell+2)*(ell-1)/8)
        if gap>=mu*v*v/2: break
        epsilon=1/math.sqrt(2*(rhoD*R**5/ell)*gap)
        root=math.sqrt(1-2*gap/(mu*v*v))
        elo=mu*mu*v*v/(2*mA)*(1-root)**2
        ehi=mu*mu*v*v/(2*mA)*(1+root)**2
        assert abs((mA*elo/mu+gap)/math.sqrt(2*mA*elo)/v-1)<1e-10
        modes.append((ell,gap,epsilon,elo,ehi))
    for fr in force_rows:
        med=fr['mediator_eV']*1e-9
        gn=fr['maximum_product_at_alpha_DM_one']*math.sqrt(4*math.pi)
        gd=N**(-1/3)  # marginal screening-scale diagnostic, not an allowed point
        alpha=N*gd*gn/(4*math.pi)
        def count(mode,lo,hi):
            ell,gap,eps,elo,ehi=mode
            lo=max(lo,elo); hi=min(hi,ehi)
            if hi<=lo:return 0.
            val=quad(lambda E:n['dsigma_dE'](E,med)*9/(4*math.pi)*(2*ell+1)*eps**2
                *spherical_jn(ell,math.sqrt(2*mA*E)*R)**2,
                lo,hi,epsabs=0,epsrel=1e-9,limit=500)[0]
            return val*n['GeV2_cm2']*n['flux']*n['Nxe']*n['year']*alpha**2
        mode_rows=[dict(ell=t[0],gap_keV=t[1]*1e6,epsilon=t[2],
            epsilon_qR_at_window_top=t[2]*math.sqrt(2*mA*269.9e-6)*R,
            angular_scale_over_constituent_scale=t[0]/N**(1/3),
            raw_full=count(t,5.4e-6,269.9e-6),raw_high=count(t,200e-6,269.9e-6)) for t in modes]
        efull=s['xenon'](med,5.4e-6,269.9e-6)*alpha**2
        ehigh=s['xenon'](med,200e-6,269.9e-6)*alpha**2
        total=sum(t['raw_full'] for t in mode_rows); high=sum(t['raw_high'] for t in mode_rows)
        rows.append(dict(gap2_keV=gap2_keV,mediator_eV=fr['mediator_eV'],modes=mode_rows,
            one_phonon_raw_full=total,one_phonon_raw_high=high,
            elastic_raw_full=efull,elastic_raw_high=ehigh,
            one_phonon_over_elastic_full=total/efull,
            one_phonon_over_elastic_high=high/ehigh))
out=dict(status='conditional one-phonon Born sum; neither inclusive rate nor accepted events',
    initial_state='ground state',speed_kms=n['v_kms'],mass_GeV=M,N=N,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
for r in rows:print({k:v for k,v in r.items() if k!='modes'})
