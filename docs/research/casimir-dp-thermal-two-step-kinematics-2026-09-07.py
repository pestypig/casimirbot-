"""Thermal-tail and two-elastic-collision endpoints; no source flux."""
import json
import math
from pathlib import Path
kb=8.617333262145e-5
ER=248000.
thermal=[dict(T_K=T,minimum_Boltzmann_exponent=ER/(kb*T)) for T in [300.,5000.]]
mXe=122.
rows=[]
def transfer(a,b):return 4*a*b/(a+b)**2
for name,mb,E_MeV in [('proton',.938272,1.1),('alpha',3.727379,2.2)]:
    optimum=math.sqrt(mb*mXe)
    fraction=transfer(mb,optimum)*transfer(optimum,mXe)
    for m in [1,10,20,75,100,1000]:
        assert transfer(mb,m)*transfer(m,mXe)<=fraction*(1+1e-12)
    rows.append(dict(projectile=name,assumed_kinetic_energy_MeV=E_MeV,
        optimum_DM_mass_GeV=optimum,max_two_step_transfer_fraction=fraction,
        max_Xe_recoil_keV=E_MeV*1000*fraction,
        minimum_projectile_energy_MeV_for_248keV=.248/fraction))
out=dict(status='ideal nonrelativistic endpoints; no operation, alignment, transport or rate claim',
    thermal=thermal,two_step=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
