"""Published baryonic electron-coupling benchmark versus depletion condition."""
import hashlib,json,math
from fractions import Fraction as Q
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-exothermic-mediator-survival-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='dc6db34d9ac7cc2fee7da2c4bb3f82872ef48f7c7d35a2dd26b6774132f14ede'
d=json.loads(p.read_text());alpha=1/137.035999084;r=alpha/(4*math.pi)
rows=[]
for w in d['rows']:
    if not w['electron_pair_open']:continue
    critical2=w['tau_scale_s']/(math.e*d['age_diagnostic_s'])
    rows.append(dict(mchi_GeV=w['mchi_GeV'],maximum_phase_space_factor_for_reference_strength=critical2/r**2,benchmark_r_over_critical_r= r/math.sqrt(critical2)))
# Charge traces alone are not finite threshold matching or hadronic polarization.
charges=[Q(2,3),Q(-1,3),Q(-1,3),Q(2,3),Q(-1,3),Q(2,3)]
traces={str(n):str(sum(3*Q(1,3)*q for q in charges[:n])) for n in [3,4,5,6]}
assert traces=={'3':'0','4':'2/3','5':'1/3','6':'1'}
out=dict(source='https://arxiv.org/html/1801.04847v2 Table1',scope='Comparison with a published illustrative electron coupling; not a calculation of UV kinetic mixing or decay phase space.',r_electron_over_baryon=r,rows=rows,quark_photon_baryon_charge_traces=traces,checks=dict(exact_charge_traces=True),mixing_predicted=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
