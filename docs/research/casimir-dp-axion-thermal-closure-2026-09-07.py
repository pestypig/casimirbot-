"""Equilibrium energy-release extension of the conditional scalar density bound."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
from scipy.special import erfcx
base=Path(__file__).parent
path=base/'casimir-dp-axion-direction-envelope-2026-09-07.py'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='e7b9101ba44a1c8fed63b8773fb164211c696e0fba48916e07219b3fea1aab40'
s={'__file__':str(path)}
exec(compile(path.read_text().split('\nhalos=[]')[0],str(path),'exec'),s)
path=path.with_suffix('.json')
assert hashlib.sha256(path.read_bytes()).hexdigest()=='49f16c79002da10295e075a1cf2e5dbb44804bed02644c95275b2897a6604cf9'
prior=json.loads(path.read_text()); m=400.; ckm=299792.458; T=4*8.617333262e-14
rows=[]; errors=[]
for rec in prior['halos']:
    halo=s['a']['h']['scenarios'][rec['halo']]; vmax=halo[1]+halo[2]; q0=2*m*vmax/ckm
    eta0=quad(lambda v:4*math.pi*v*s['envelope'](v,*halo),0,vmax)[0]
    tail=2*m*T+q0*math.sqrt(math.pi*m*T/2)*erfcx(q0/math.sqrt(8*m*T))
    # Independent integral after s=q-q0=(2mT/q0)z avoids under-resolved narrow tail.
    width=2*m*T/q0
    numeric=quad(lambda z:2*(q0+width*z)*width*math.exp(-z-width*width*z*z/(2*m*T)),0,100,epsabs=1e-20)[0]
    errors.append(abs(tail/numeric-1))
    factor=ckm*ckm*eta0*(q0*q0+tail)/(4*m*m*rec['flux_majorant_km_s'])
    for old in prior['rows']:
        if old['halo']!=rec['halo']:continue
        rows.append(dict(halo=rec['halo'],lambda_PhiH=old['lambda_PhiH'],D_nonnegative_upper=old['D_any_orientation_upper'],D_thermal_total_upper=old['D_any_orientation_upper']*(1+factor),negative_bound_over_nonnegative_bound=factor,thermal_tail_over_q0_squared=tail/(q0*q0)))
# Finite Gibbs transition pair independently checks detailed balance.
energies=[0.,.2,1.]; beta=2.; Z=sum(math.exp(-beta*e) for e in energies)
db=max(abs((math.exp(-beta*energies[j])/Z)/(math.exp(-beta*energies[i])/Z)-math.exp(-beta*(energies[j]-energies[i]))) for i in range(3) for j in range(i+1,3))
checks={'thermal_tail_independent_integral':max(errors)<1e-10,'Gibbs_pair_detailed_balance':db<1e-14,'thermal_bound_contains_nonnegative':all(r['D_thermal_total_upper']>=r['D_nonnegative_upper'] for r in rows),'tail_positive':all(r['thermal_tail_over_q0_squared']>0 for r in rows)}
assert all(checks.values())
checks={k:bool(v) for k,v in checks.items()}
out=dict(scope='Any orientation, canonical equilibrium at 4K, Born constant scalar density envelope; not full UV or driven-apparatus bound',full_model_admitted=False,kBT_GeV=T,checks=checks,max_tail_relative_error=max(errors),rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'central_lambda03':next(r for r in rows if r['halo']=='central' and r['lambda_PhiH']==.03)},indent=2))
