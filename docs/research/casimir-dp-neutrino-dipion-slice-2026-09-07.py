"""LO chiral low-dipion-mass partial width; not a rigorous hadronic bound."""
import json,math
from pathlib import Path
from scipy.integrate import quad
mpi=.13957039;B0=mpi*mpi/(.00216+.00467);hc=1.973269804e-16
def density(s,m,med,ychi,yq):
    beta=math.sqrt(max(0.,1-4*mpi*mpi/s))
    return 3*ychi*ychi*yq*yq*B0*B0/(256*math.pi**3*m**3)*(m*m-s)**2*beta/(med*med-s)**2
def cascade(s,m,med,ychi,yq):
    beta=math.sqrt(max(0.,1-4*mpi*mpi/s))
    g=2*B0*yq
    gamma1=ychi*ychi*m/(32*math.pi)*(1-s/(m*m))**2
    gamma2=3*g*g/(32*math.pi*math.sqrt(s))*beta
    return gamma1*math.sqrt(s)*gamma2/(math.pi*(med*med-s)**2)
rows=[]
for m,med in [(1.,1.),(1.,10.),(2.,10.)]:
    y=.02*med
    for upper in [.35,.45,.5]:
        w=quad(lambda s:density(s,m,med,y,y),4*mpi*mpi,upper*upper,epsabs=1e-22,epsrel=1e-10)[0]
        # Independent integration variable w=sqrt(s).
        other=quad(lambda x:2*x*cascade(x*x,m,med,y,y),2*mpi,upper,epsabs=1e-22,epsrel=1e-10)[0]
        rows.append(dict(mchi_GeV=m,mediator_GeV=med,dipion_upper_GeV=upper,partial_width_LO_GeV=w,proper_length_from_slice_m=hc/w,lab_length_E10GeV_from_slice_m=hc/w*math.sqrt((10-.000248)**2-m*m)/m,relative_integral_difference=other/w-1))
checks={'phase_space_factorization':all(abs(r['relative_integral_difference'])<1e-9 for r in rows),'positive_slice':all(r['partial_width_LO_GeV']>0 for r in rows),'same_product_repartition':math.isclose(density(.1,1.,10.,.1,.4),density(.1,1.,10.,.2,.2),rel_tol=1e-12),'chiral_mass_identity':math.isclose(B0*(.00216+.00467),mpi*mpi,rel_tol=1e-14)}
assert all(checks.values())
out=dict(scope='LO isospin-symmetric pion slice only, below 0.35/0.45/0.5GeV; no error-qualified hadronic lower bound or acceptance',full_model_admitted=False,B0_GeV=B0,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'narrow_slice':[r for r in rows if r['dipion_upper_GeV']==.35]},indent=2))
