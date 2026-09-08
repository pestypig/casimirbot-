"""No-replenishment population and cross-section feedback at fixed coupling ratio."""
import hashlib,json,math
from pathlib import Path
from scipy.special import lambertw
from scipy.integrate import solve_ivp
p=Path(__file__).with_name('casimir-dp-exothermic-mediator-survival-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='dc6db34d9ac7cc2fee7da2c4bb3f82872ef48f7c7d35a2dd26b6774132f14ede'
d=json.loads(p.read_text());t=d['age_diagnostic_s'];rows=[]
for r in d['rows']:
    if not r['electron_pair_open']:continue
    tau0=r['tau_scale_s']
    for initial in [1.,.5]:
        critical=math.sqrt(initial*tau0/(math.e*t))
        cases=[]
        for rsqrtF in [1e-5,3e-5,1e-4]:
            b=t*rsqrtF**2/tau0;maximum=initial/(math.e*b);solutions=[]
            if b/initial<1/math.e:
                for branch in [0,-1]:
                    x=float((-lambertw(-b/initial,branch)/b).real)
                    present=initial*math.exp(-b*x)
                    assert abs(x*present-1)<1e-12
                    # Integrate population in dimensionless elapsed time independently.
                    ode=solve_ivp(lambda u,y:-b*x*y,[0,1],[initial],rtol=1e-10,atol=1e-13)
                    assert ode.success and abs(ode.y[0,-1]/present-1)<1e-8
                    solutions.append(dict(sigma_over_reference=x,present_fraction=present,lifetime_over_elapsed=1/(b*x)))
            cases.append(dict(abs_Ce_over_Cb_times_sqrtF=rsqrtF,max_present_strength_over_reference=maximum,solutions=solutions))
        rows.append(dict(mchi_GeV=r['mchi_GeV'],initial_excited_fraction=initial,critical_abs_Ce_over_Cb_times_sqrtF=critical,cases=cases))
out=dict(scope='Fixed electron/baryon coefficient ratio, constant lifetime, no replenishment, no extra decay channels, initial fraction<=1; approximate published electron-pair lifetime scale. Reference present sigma*f=1e-45cm2 is a chosen benchmark, not a fitted signal.',elapsed_s=t,rows=rows,checks=dict(Lambert_roots=True,population_ODE=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
