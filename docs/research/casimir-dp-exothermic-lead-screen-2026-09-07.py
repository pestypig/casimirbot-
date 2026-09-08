"""NR two-target down-scattering kinematics; no fitted rate or population."""
import json,math
from pathlib import Path
xe=131.293*.93149410242;carbon=12*.93149410242-6*.00051099895
speed=776/299792.458;peak=.000248
rows=[]
for m in [10.,15.,40.,100.]:
    mux=m*xe/(m+xe);splitting=peak*xe/mux
    targets=[]
    for name,A in [('xenon_mean',xe),('carbon12',carbon)]:
        mu=m*A/(m+A);e0=mu*splitting/A
        root=math.sqrt(speed*speed+2*splitting/mu)
        lo=mu*mu/(2*A)*(root-speed)**2;hi=mu*mu/(2*A)*(root+speed)**2
        vmin=lambda E:abs(A*E/mu-splitting)/math.sqrt(2*A*E)
        assert abs(vmin(e0))<1e-14
        assert abs(vmin(lo)/speed-1)<1e-12 and abs(vmin(hi)/speed-1)<1e-12
        targets.append(dict(target=name,E0_keV=e0*1e6,Emin_keV=lo*1e6,Emax_keV=hi*1e6))
    rows.append(dict(mchi_GeV=m,delta_GeV=-splitting,targets=targets))
out=dict(source='https://arxiv.org/html/2609.04673v1',scope='Leading nonrelativistic free-target kinematics, diagnostic xenon peak fixed at248keV; no population, mediator, cross section or detector likelihood specified.',vmax_km_s=776,rows=rows,checks=dict(zero_speed_peak=True,endpoints_reproduce_vmax=True),common_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
