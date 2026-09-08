"""B-L high-q nuclear shape and normalization; no shared-model admission."""
import json,math,hashlib
from pathlib import Path
import numpy as np
from scipy.linalg import eigh
p=Path(__file__).with_name('casimir-dp-two-mediator-shape-2026-09-07.py')
s=p.read_text().split('\nrows=[]')[0]
old="w=n['ds'](E,A,ma)*(q2+n['med']**2)**2"
assert s.count(old)==1
s=s.replace(old,"w=n['ds'](E,A,ma)*(A/54)**2*(q2+n['med']**2)**2")
n={'__file__':str(p)};exec(compile(s,str(p),'exec'),n)
xe=n['n'];alpha_ref=math.sqrt(3.008770724735438e-35/.3893793721e-27*.01**4/(16*math.pi*xe['muP']**2))
rows=[]
for mass in [1e-11,1e-9,1e-6]:
 L=n['matrix'](5.4,200,[mass,1]);H=n['matrix'](200,269.9,[mass,1]);scale=np.trace(H)
 val,g=eigh(L/scale,H/scale);c=g[:,0]/g[0,0]
 ratio=float(c@L@c/(c@H@c));assert math.isclose(ratio,val[0],rel_tol=1e-8)
 assert np.linalg.eigvalsh((L-ratio*H)/scale).min()>-1e-7
 count=.003*xe['targets']*xe['year']*xe['speed_cm']*float(c@H@c)
 strength=1/count;products=alpha_ref*np.sqrt(strength)*c
 rows.append(dict(masses_GeV=[mass,1.],relative_products=c.tolist(),effective_alpha_products=products.tolist(),
  raw_low_high_minimum=ratio,normalization_strength=strength))
out=dict(status='BL_nuclear_shape_diagnostic_not_UV_complete_or_allowed',rows=rows,
 nuclear_amplitude='A F_Helm(q) sum_i alpha_i/(q^2+m_i^2)',
 neutral_atom_amplitude='[A F_nuclear(q)-Z F_electron(q)] sum_i alpha_i/(q^2+m_i^2)',
 assumptions=['high-q nuclear impulse treatment with common Helm proton/neutron profile','one raw unattenuated 200-269.9 keV event at fixed fast source','real signed products optimized for minimum raw 5.4-200/high ratio'],
 limitations=['full B-L neutral atom has A-Z low-q charge, but nucleus alone has A, not A-Z',
 'individual dark/SM couplings, anomalies, mediator mixing and external bounds unresolved',
 'no macroscopic Born validity, finite-size coherence, transport or detector likelihood',
 'neutral electrical cancellation bounds do not transfer unchanged to this new operator'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(rows,indent=2))
