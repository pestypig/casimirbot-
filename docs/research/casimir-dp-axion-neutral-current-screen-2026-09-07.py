"""Correlated tree neutral-current shifts; separate dated data/theory screens."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent
parent=base/'casimir-dp-axion-weak-mixing-screen-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='d959c811f354b948477e437f1d207884dd134e0d6463bfda519f021543a05b77'
source=json.loads(parent.read_text())
datasets={
 'proton_PVES_2018':dict(Z=1,N=0,measurement=.0719,error=.0045,SM=.0708,SM_error=.0003,source='https://arxiv.org/pdf/1905.08283'),
 'Cs_values_reported_2602p22466v1':dict(Z=55,N=78,measurement=-72.41,error=.42,SM=-73.26,SM_error=.01,source='https://arxiv.org/html/2602.22466v1')}
rows=[];errs=[]
for point in source['rows']:
    D=point['deficit'];dc1u=D/2;dc1d=0.
    dp=-2*(2*dc1u+dc1d);dn=-2*(dc1u+2*dc1d)
    for label,data in datasets.items():
        Z,N=data['Z'],data['N']
        shift=-2*((2*Z+N)*dc1u+(Z+2*N)*dc1d)
        errs.append(abs(shift-Z*dp-N*dn))
        pred=data['SM']+shift;sig=math.hypot(data['error'],data['SM_error'])
        row=dict(yL=point['yL'],dataset=label,delta_C1u=dc1u,delta_weak_charge=shift,
            conditional_prediction=pred,gaussian_pull=(pred-data['measurement'])/sig,
            absolute_signal_over_quoted_measurement_error=abs(shift)/data['error'])
        if Z==55:
            alternative=data['SM']*(1-.008)+shift
            row['alternative_proposed_SM_shift']=data['SM']*(-.008)
            row['alternative_central_value_only']=alternative
            row['alternative_pull_using_original_error_for_sensitivity_only']=(alternative-data['measurement'])/sig
        rows.append(row)
checks=dict(proton_neutron_assembly=max(errs)<1e-14,
    fixed_sign_for_positive_mixing=all(r['delta_weak_charge']<0 for r in rows),
    Cs_to_proton_shift_ratio=all(abs(rows[i+1]['delta_weak_charge']/rows[i]['delta_weak_charge']-94)<1e-12 for i in range(0,len(rows),2)))
assert all(checks.values())
out=dict(scope='Leading tree aligned-up-singlet delta C1u=D/2, delta C1d=0. No RG, oblique, vertex, hadronic or atomic re-extraction. Separate Gaussian diagnostics; no combined fit.',checks=checks,datasets=datasets,rows=rows,
    alternative_theory_correction_independently_validated=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
