"""Conditional electron-coupling survival requirement using published lifetime scale."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-exothermic-common-rate-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='891d68ea311d5221a501c07bccefbb11dbcb4ce0e12e5208be158b4774307513'
data=json.loads(p.read_text());age=4.35e17;me=.00051099895;rows=[]
for r in data['rows']:
    gap=abs(r['delta_GeV']);opened=gap>2*me
    # Eq5 of2609.04673: approximate electron-vector lifetime; generalized by Ce/Cb.
    tau0=4e9*(r['sigma_p_reference_cm2']/1e-45)**-1*(gap/.002)**-5
    rows.append(dict(mchi_GeV=r['mchi_GeV'],gap_MeV=gap*1e3,electron_pair_open=opened,
        tau_scale_s=tau0 if opened else None,
        max_abs_Ce_over_Cb_times_sqrt_phase_space_for_tau_ge_age=math.sqrt(tau0/age) if opened else None,
        gchi_gB_for_MV100GeV=r['C_nucleon_GeV_minus2']*100**2))
assert [r['electron_pair_open'] for r in rows]==[True,True,False,False]
for r in rows[:2]:assert math.isclose(r['tau_scale_s']/r['max_abs_Ce_over_Cb_times_sqrt_phase_space_for_tau_ge_age']**2,age,rel_tol=1e-14)
out=dict(scope='Approximate heavy-vector electron-pair lifetime scale, phase-space factor left explicit; no mixing boundary or lifetime prediction assigned.',source='https://arxiv.org/html/2609.04673v1 equation5',age_diagnostic_s=age,rows=rows,checks=dict(thresholds=True,lifetime_inequality_inversion=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
