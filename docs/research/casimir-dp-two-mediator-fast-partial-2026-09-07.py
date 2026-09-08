"""Same partial diamond channel with the fixed fast population instead of capture."""
import json,hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.py')
s=p.read_text()
old='for T in [300.,5000.]:'
assert old in s
s=s.replace(old,'for T in [776.]:')
s=s.replace('v0=np.sqrt(2*8.617333262145e-5*T/x.mX)','v0=T/299792.458')
s=s.replace('x.etav=lambda v:2/(np.sqrt(np.pi)*v0)*np.exp(-(v/v0)**2)',
            'x.etav=lambda v:np.where(np.asarray(v)<=v0,1/v0,0.)')
s=s.split("out=dict(status=",1)[0]
ns={'__file__':str(p),'__name__':'fast_partial'}
exec(compile(s,str(p),'exec'),ns)
rows=[]
for r in ns['rows']:
 t=r['thermal'][0];D=t['partial_D_per_cm3']
 rows.append(dict(masses_GeV=r['masses_GeV'],speed_km_s=776,
  rate_grids=t['grid_rates'],partial_D_per_cm3=D,
  partial_D_at_fixed_density=.003*D,
  density_for_frozen_comparator_cm3=t['density_for_DP_comparator_cm3']))
out=dict(status='fast_population_partial_channel_not_total_coherence',
 baseline_script_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),rows=rows,
 assumptions=['isotropic mono-speed particles at 776 km/s and 0.003/cm3',
 'same fixed nuclear-normalized products','q >= qBZ to 100 keV, omega 0.18-0.6 eV, multiphonon n>=2',
 'event count proxy for resolved-branch loss in the covered channel'],
 limitations=['no low-q coherent elastic, one-phonon or other omitted channel',
 'not a total upper bound, supplied captured population or complete branch-history prediction',
 'no demonstrated measurability or boundary dependence'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
