"""Covered raw Xe ionization counts from fixed two-mediator products."""
import hashlib,json,math,sys
from pathlib import Path
from io import StringIO
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.integrate import simpson
p=Path(sys.argv[1])/'tables/K_Xe_hf_v_6_hp_orth_mat.txt'
b=p.read_bytes().replace(b'\r',b'')
assert hashlib.sha256(b).hexdigest()=='bcdc6de584619d833cb5e1645f7a8f81d8aa8128098935a97b0dd7f902d1c031'
E,q,K=[np.loadtxt(StringIO(x)) for x in b.decode().strip().split('\n\n')[1:]]
EH=27.2114; E=E*EH;q=q*3728.94
# Linear K in logarithmic coordinates preserves zeros without log(0).
interp=RegularGridInterpolator((np.log(E),np.log(q)),K,bounds_error=True)
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
v=776/299792.458;m=1e11;hc=1.973269804e-5
# Same exposure, approximate natural Xe molar mass; no detector acceptance.
targets=2840/(131.293*1.66053906892e-27)
flux_exposure=.003*776e5*365*86400*targets
pref=8*math.pi/(v*v*EH)*hc*hc*flux_exposure
rows=[]
for row in json.loads(p.read_text())['rows']:
 masses=np.array(row['masses_GeV'])*1e9;c=np.array(row['effective_alpha_products'])
 def count(lo,hi,n):
  es=np.geomspace(max(lo,E[0]),min(hi,E[-1]),n+1)
  qlo=np.maximum(q[0],2*es/(v+np.sqrt(v*v-2*es/m)))
  qhi=np.minimum(q[-1],m*(v+np.sqrt(v*v-2*es/m)))
  z=np.linspace(0,1,n+1)
  logs=np.log(qlo)[:,None]+np.log(qhi/qlo)[:,None]*z
  qs=np.exp(logs);qs=np.clip(qs,q[0],q[-1])
  pts=np.stack([np.broadcast_to(np.log(es)[:,None],qs.shape),np.log(qs)],axis=-1)
  ks=interp(pts);amp=np.sum(c/(qs[...,None]**2+masses**2),axis=-1)
  inner=simpson(qs**2*amp**2*ks,x=z,axis=1)*np.log(qhi/qlo)
  return pref*simpson(es*inner,x=np.log(es))
 bands=[]
 for lo,hi in [(E[0],E[-1]),(100,1000),(1000,E[-1])]:
  vals=[count(lo,hi,n) for n in [256,512,1024]]
  drift=abs(vals[-1]/vals[-2]-1)
  assert drift<.01
  bands.append(dict(energy_eV=[lo,hi],raw_counts=vals[-1],refinement_relative=drift))
 rows.append(dict(masses_GeV=row['masses_GeV'],bands=bands))
out=dict(status='covered_atomic_raw_counts_not_LZ_accepted_prediction',rows=rows,
 formula='d sigma/dE = 8 pi hbarc^2/(v^2 EH) integral q dq [sum alpha_i/(q^2+m_i^2)]^2 K(E,q)',
 exposure_kg_year=2840,xe_atomic_mass_u=131.293,
 assumptions=['fixed unattenuated mono-speed source shared with nuclear normalization','atomic vector density response; L=6 source truncation','linear K interpolation on log axes'],
 limitations=['not a complete energy/momentum integral','no transport, liquid response correction, or LZ detector folding','refinement measures quadrature only, not atomic or interpolation uncertainty','no allowed parameter point or exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
