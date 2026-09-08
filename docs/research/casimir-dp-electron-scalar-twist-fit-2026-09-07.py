"""Conditional forward scalar/spin-2 extraction; not complete EFT matching."""
from pathlib import Path
import json,math,hashlib
base=Path(__file__).resolve().parent
p=base/'casimir-dp-electron-forward-motion-2026-09-07.json';raw=p.read_bytes();r=json.loads(raw)['rows']
m=.00051099895;F0=r[0]['normalized_forward_trace_GeV_minus2'];rows=[]
candidate=json.loads((base/'casimir-dp-virtual-300mev-candidate-2026-09-07.json').read_text())['candidate']
factor=(4*math.pi*candidate['effective_alpha'])**2
for row in r[1:]:
 pe=row['electron_momentum_GeV'];E=math.hypot(m,pe);F=row['normalized_forward_trace_GeV_minus2']
 c2=(E*F-m*F0)/(2*pe**2);c0=F0/(2*m)-.75*c2
 assert abs(2*m*(c0+.75*c2)/F0-1)<1e-12
 rows.append(dict(momentum_GeV=pe,c0_without_couplings_GeV_minus3=c0,c2_without_couplings_GeV_minus3=c2,c0_conditional_GeV_minus3=factor*c0,c2_conditional_GeV_minus3=factor*c2))
out=dict(status='conditional_two_operator_forward_fit',motion_input_sha256=hashlib.sha256(raw).hexdigest(),rows=rows,
limitations=['two-operator ansatz does not exclude higher-derivative operators','on-shell forward only; no bound-state or nonforward matching','spin-dependent operator remains separate','candidate diagram completion remains conditional'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
