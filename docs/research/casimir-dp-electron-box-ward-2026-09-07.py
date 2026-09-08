"""Electron-line Ward identities and conditional threshold SI coefficient."""
from pathlib import Path
import json,hashlib,math
import numpy as np
base=Path(__file__).resolve().parent
src=base/'casimir-dp-electron-box-spin-trace-2026-09-07.py'
ns={'__file__':str(src)}
exec(src.read_text().split('errors=[]')[0],ns)
gamma=ns['gamma'];metric=ns['metric'];slash=ns['slash'];m=ns['m'];one=np.eye(4);p=np.array([m,0,0,0])
rng=np.random.default_rng(281);errors=[];controls=[]
for _ in range(24):
 l=rng.normal(size=4);l[0]=.2*np.linalg.norm(l[1:])
 def propagator(k):return (slash(k)+m*one)/(np.dot(metric*k,k)-m*m)
 sp=propagator(p+l);sm=propagator(p-l)
 A=np.array([[gamma[i]@sp@gamma[j] for j in range(4)] for i in range(4)])
 B=np.array([[gamma[j]@sm@gamma[i] for j in range(4)] for i in range(4)])
 for axis in [0,1]:
  terms=np.tensordot(metric*l,A+B,axes=(0,axis))[:,:2,:2]
  wrong=np.tensordot(metric*l,A-B,axes=(0,axis))[:,:2,:2]
  errors.append(float(np.max(np.abs(terms))));controls.append(float(np.max(np.abs(wrong))))
assert max(errors)<1e-10 and max(controls)>.1
data=(base/'casimir-dp-electron-box-spin-trace-2026-09-07.json').read_bytes()
rows=json.loads(data)['rows'];summed=sum(r['normalized_trace_integral_GeV_minus2'] for r in rows)
alpha=ns['c']['effective_alpha'];W=(4*math.pi*alpha)**2*summed
out=dict(status='electron_line_transversality_and_conditional_forward_SI_coefficient',trace_json_sha256=hashlib.sha256(data).hexdigest(),max_Ward_absolute_residual=max(errors),wrong_relative_sign_control_max=max(controls),conditional_W_magnitude_GeV_minus2=abs(W),trace_sum_GeV_minus2=summed,
limitations=['on-shell forward free electron with vector coupling only','not a complete Majorana operator derivation','no material or finite-momentum validation','overall sign convention not fixed by cross-section limit'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
