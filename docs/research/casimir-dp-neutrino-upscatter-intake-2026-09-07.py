"""Exact two-body threshold screen for a newly identified incident-neutrino lead."""
import json,math
from pathlib import Path
def emin(T,M,m):
    q=math.sqrt(T*T+2*M*T)
    return (m*m+2*M*T)/(2*(q-T))
def recoil_bounds(E,M,m):
    s=M*M+2*M*E
    lam=(s-(M+m)**2)*(s-(M-m)**2)
    if lam<0:return None
    center=2*M*E*E-m*m*(E+M)
    width=E*math.sqrt(lam)
    denominator=2*M*(2*E+M)
    # Rationalize the lower root to avoid cancellation at high incident energy.
    low=m**4/(2*(center+width))
    return low,(center+width)/denominator
targets={'Xe131':130.90508406*.93149410242-54*.00051099895,'C12':12*.93149410242-6*.00051099895,'C13':13.00335483507*.93149410242-6*.00051099895}
rows=[];err=[]
for name,M in targets.items():
    for m in [1.,2.]:
        E=emin(248e-6,M,m)
        lo,hi=recoil_bounds(E,M,m)
        err.append(min(abs(lo/248e-6-1),abs(hi/248e-6-1)))
        for incident in [5.,10.,100.,1000.]:
            bounds=recoil_bounds(incident,M,m)
            rows.append(dict(target=name,mchi_GeV=m,production_threshold_GeV=m+m*m/(2*M),incident_for_248keV_GeV=E,E_nu_GeV=incident,recoil_min_keV=bounds[0]*1e6,recoil_max_keV=bounds[1]*1e6))
checks={'fixed_recoil_inverse_matches_endpoint':max(err)<1e-10,'elastic_limit':math.isclose(recoil_bounds(5.,targets['Xe131'],0.)[1],2*25/(targets['Xe131']+10),rel_tol=1e-14),'asymptotic_low_recoil_tail':all(r['recoil_min_keV']<1 for r in rows if r['E_nu_GeV']==1000),'production_threshold_below_fixed_recoil':all(r['production_threshold_GeV']<=r['incident_for_248keV_GeV'] for r in rows)}
assert all(checks.values())
out=dict(scope='Free-nucleus exact kinematics only; no neutrino flux, detector fit, local decoherence rate or new-particle stability assumption',full_model_admitted=False,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'E10_rows':[r for r in rows if r['E_nu_GeV']==10]},indent=2))
