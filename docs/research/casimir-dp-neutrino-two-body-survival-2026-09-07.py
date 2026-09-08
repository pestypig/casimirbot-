"""Open chi -> nu phi partial width and conditional flight-distance screen."""
import json,math
from pathlib import Path
import numpy as np
hc=1.973269804e-16 # GeV m
def width(m,med,y):return y*y*m/(32*math.pi)*(1-med*med/(m*m))**2 if m>med else 0.
rows=[]
for m in [1.,2.]:
    for med in [.1,1.,10.]:
        y=.02*med; w=width(m,med,y)
        if not w:
            rows.append(dict(mchi_GeV=m,mediator_GeV=med,two_body_open=False,stability='undetermined: off-shell and other channels not computed'))
            continue
        for E in [10.,100.,1e4]:
            bg=math.sqrt((E-.000248)**2-m*m)/m
            length=bg*hc/w
            # Keep production product fixed, limit the quark Yukawa as a diagnostic.
            product=(.02*med)**2; min_y=product/math.sqrt(4*math.pi)
            longest=bg*hc/width(m,med,min_y)
            needed_y=math.sqrt(32*math.pi*bg*hc/(m*(1-med*med/(m*m))**2*.1))
            rows.append(dict(mchi_GeV=m,mediator_GeV=med,two_body_open=True,incident_GeV=E,ychi=y,width_GeV=w,proper_length_m=hc/w,lab_length_m=length,log_escape_probability_10cm=-.1/length,longest_lab_length_with_yq_below_sqrt4pi_m=longest,ychi_for_10cm_mean_flight=needed_y,yq_required_at_fixed_product=product/needed_y))
# Independent gamma-matrix trace of the spin-averaged two-body amplitude.
I=np.eye(2);Z=np.zeros((2,2));pauli=[np.array([[0,1],[1,0]]),np.array([[0,-1j],[1j,0]]),np.diag([1,-1])]
gam=[np.block([[I,Z],[Z,-I]])]+[np.block([[Z,s],[-s,Z]]) for s in pauli]
g5=1j*gam[0]@gam[1]@gam[2]@gam[3]; PL=(np.eye(4)-g5)/2; PR=(np.eye(4)+g5)/2
def slash(p):return p[0]*gam[0]-sum(p[i+1]*gam[i+1] for i in range(3))
m=2.; med=1.; y=.02; k=(m*m-med*med)/(2*m)
amp=y*y/2*np.trace((slash([m,0,0,0])+m*np.eye(4))@PL@slash([k,0,0,k])@PR).real
trace_width=k*amp/(8*math.pi*m*m)
checks={'Dirac_trace_width':math.isclose(trace_width,width(m,med,y),rel_tol=1e-12),'threshold_closes':width(1.,1.,.02)==0,'partial_width_quadratic':math.isclose(width(2.,1.,.04)/width(2.,1.,.02),4,rel_tol=1e-12),'flight_repartition_preserves_product':all(math.isclose(r['ychi_for_10cm_mean_flight']*r['yq_required_at_fixed_product'],(.02*r['mediator_GeV'])**2,rel_tol=1e-12) for r in rows if r['two_body_open'])}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='Two-body partial width only, Dirac per-flavor; 10cm hypothetical path, no detector acceptance or phi-decay calculation',full_model_admitted=False,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'m2_med1':[r for r in rows if r['mchi_GeV']==2 and r['mediator_GeV']==1]},indent=2))
