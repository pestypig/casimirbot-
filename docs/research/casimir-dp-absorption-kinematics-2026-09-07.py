"""Rest-frame absorption kinematics only; no rate or detector fit."""
import json,math
from pathlib import Path
m=.247
rows=[]
for A,atomic,Z in [(12,12.,6),(13,13.00335483507,6),(128,127.9035310,54),(131,130.90508406,54),(136,135.907214484,54)]:
    M=atomic*.93149410242-Z*.00051099895
    T=m*m/(2*(M+m));q=m-T
    rows.append(dict(A=A,Z=Z,nuclear_mass_GeV=M,recoil_keV=T*1e6,
                     outgoing_massless_neutrino_GeV=q,
                     momentum_mass_shell_relative=(q*q/(T*(T+2*M))-1),
                     mass_for_248keV_GeV=.000248+math.sqrt(.000248**2+2*M*.000248)))
checks={'energy_conservation':all(math.isclose(r['outgoing_massless_neutrino_GeV']+r['recoil_keV']*1e-6,m,rel_tol=1e-14) for r in rows),
        'momentum_mass_shell':all(abs(r['momentum_mass_shell_relative'])<1e-12 for r in rows),
        'inverse_mass_solution':all(math.isclose(r['mass_for_248keV_GeV']**2/(2*(r['nuclear_mass_GeV']+r['mass_for_248keV_GeV'])),.000248,rel_tol=1e-12) for r in rows)}
assert all(checks.values())
out=dict(scope='Free stationary isolated nuclei, incident chi at rest, massless outgoing neutrino; coherent channel only, no rate/solid response',full_model_admitted=False,mchi_GeV=m,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
