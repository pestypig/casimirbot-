"""Diagnostic offset fit; never modifies the source enhancement table."""
import hashlib,json
from pathlib import Path
import numpy as np
b=Path(__file__).parent
p=b/'casimir-dp-radiative-enhancement-source-2026-09-07.txt'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='883a02811f5b436d6bfb3ebcc2da1ad5344f4b1842806ff5559beb9875f4557c'
x,y=np.loadtxt(p,delimiter=',',skiprows=1).T
c=[1,335/714,128941/839664,44787/1026256,1249649333/108064756800,36494147/12382420050,867635449/1614300688000]
def series(m):return sum(v*(x/m)**(2*k) for k,v in enumerate(c))
ratio=series(.51099895)/y
factor=float(ratio[:3].mean());held=(x<.4)&(np.arange(len(x))>=3)
res=float(max(abs(ratio[held]/factor-1)))
assert held.sum()==8
out=dict(status='Exploratory diagnostic, not a justified table correction',source='https://arxiv.org/src/1705.00619',fit_points=3,heldout_points=int(held.sum()),series_over_table_constant=factor,heldout_max_fractional_residual=res,electron_mass_rounding_max_shape_change=float(max(abs(series(.511)[x<.4]/series(.51099895)[x<.4]-1))),alpha_137_vs_137035999_width_fractional_change=(137.035999084/137)**4-1,table_rescaled=False,normalization_origin_resolved=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
