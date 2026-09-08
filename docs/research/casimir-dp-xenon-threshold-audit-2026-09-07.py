"""Sensitivity audit of the existing covered integral; same source and products."""
import json
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-xenon-electron-covered-2026-09-07.py')
source=p.read_text()
source=source.split("Path(__file__).with_suffix('.json').write_text",1)[0]
source=source.replace('[(E[0],E[-1]),(100,1000),(1000,E[-1])]','[(E[0],E[-1]),(40,700),(186,1000)]')
results=[]
for label,cut in [('original',0),('cut_12p1_eV',12.1),('cut_first_nonzero_node',12.2271976878)]:
 s=source.replace('ks=interp(pts);amp=',f'ks=interp(pts);ks[es < {cut}]=0; amp=')
 scope={'__file__':str(p),'__name__':'threshold_audit'}
 exec(compile(s,str(p),'exec'),scope)
 results.append(dict(model=label,rows=scope['out']['rows']))
out=dict(status='threshold_cut_sensitivity_not_liquid_model',results=results,
 limitations=['total K is not shell resolved; cuts audit only first ionization onset',
 'same integral implementation, not an independent solver',
 '40-700 eV is an energy band diagnostic, not detector acceptance',
 'no liquid correction, multipole convergence or complete excluded-region calculation'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
for result in results:
 print(result['model'],[[b['raw_counts'] for b in r['bands']] for r in result['rows']])
