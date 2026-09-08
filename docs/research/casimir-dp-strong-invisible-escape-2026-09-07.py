"""Defined light-Dirac invisible decay variant; conditional NA64 yield screen."""
import hashlib,json,math,os,subprocess
from pathlib import Path
import numpy as np
base=Path(__file__).parent;ext=Path(os.environ['TEMP'])/'casimir-darkcast-intake'
assert subprocess.check_output(['git','-C',str(ext),'rev-parse','HEAD'],text=True).strip()=='5a2a53a8984827be06e2939e6c3705f79d180048'
p=ext/'darkcast/limits/NA64_NA642019imj.lmt';table=np.loadtxt(p)
mass=.01
loglimit=float(np.exp(np.interp(np.log(mass),np.log(table[:,0]),np.log(table[:,1]))))
linlimit=float(np.interp(mass,table[:,0],table[:,1]));limit=max(loglimit,linlimit)
parent=base/'casimir-dp-strong-transport-visible-screen-2026-09-07.json'
product=json.loads(parent.read_text())['rows'][1]['effective_alpha_product'];em=1/137.035999084
light=.001;electron=.00051099895
def phase(m):
    r=(m/mass)**2
    return (1+2*r)*math.sqrt(1-4*r)
epsmin=product/math.sqrt(em*.1);epsmax=.01
rows=[]
for eps in [epsmin,.001,.01]:
    ad=product**2/(em*eps**2)
    inv=ad*mass/3*phase(light);vis=em*eps**2*mass/3*phase(electron)
    br=inv/(inv+vis)
    rows.append(dict(epsilon=eps,alpha_D=ad,invisible_branching=br,width_over_mass=(inv+vis)/mass,
        yield_ratio_to_tabulated_limit=eps**2*br/(limit**2*.99)))
# epsilon^2 BR = x k/(k+x^2); derivative positive for x^2<k.
k=product**2*phase(light)/(em**2*phase(electron))
assert epsmax**4<k
assert min(r['yield_ratio_to_tabulated_limit'] for r in rows)>1
out=dict(status='conditional_invisible_variant_yield_screen',mediator_GeV=mass,added_Dirac_mass_GeV=light,
    charge='same unit dark charge as heavy species',epsilon_domain=[epsmin,epsmax],alpha_D_max=.1,
    tabulated_limit_epsilon=limit,table_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
    parent_sha256=hashlib.sha256(parent.read_bytes()).hexdigest(),rows=rows,
    primary='https://arxiv.org/abs/1906.00176',
    assumptions=['Prompt invisible Dirac pair production with escape and unchanged missing-energy efficiency',
      'Narrow-width production approximation; maximum width/mass about .0333',
      'Only added Dirac pair and electron pair decay channels'],
    limitations=['No full detector efficiency or finite-width recast','alpha_D>.1 not screened here',
      'No light-species cosmology, abundance or local coherence calculated','Not every possible invisible or semivisible completion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(limit=limit,rows=rows),indent=2))
