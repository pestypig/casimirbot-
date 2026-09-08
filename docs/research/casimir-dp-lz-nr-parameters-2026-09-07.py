"""Transcription of LZ Table S5 and equation 5; not a detector simulation."""
import json,math
from pathlib import Path
params=dict(alpha=11.2,beta=1.1,gamma=.052,delta=-.0533,epsilon=10.8,
 zeta=.53,eta=1.4,theta=.31,iota=2.5,p=.50,f1=1.39,f2=1.74,
 a=.0230,b=.0289,E0_keV=74.7)
def exponent(E):
    return .5 if E<=params['E0_keV'] else .5+params['a']*math.log1p(params['b']*(E-params['E0_keV']))
assert exponent(0)==exponent(74.7)==.5
assert abs(exponent(74.7+1e-8)-.5)<1e-10
grid=[10,74.7,100,150,200,220,248,269.9]
values=[dict(E_keV=E,p=exponent(E)) for E in grid]
assert all(values[i]['p']<=values[i+1]['p'] for i in range(len(values)-1))
out=dict(status='published_parameter_transcription_only',source='https://arxiv.org/html/2609.02823v1',
 source_location='Supplement section .4, equation 5 and Table S5',NEST_version='2.4.5',
 analysis_parameters=params,energy_exponent=values,
 caveats=['not electron/photon yields by itself','not an energy resolution kernel',
 'no parameter covariance supplied by this transcription','no accepted counts'],
 retrieval=dict(hepdata_record=182472,json_request_status='HTTP 403 on 2026-09-07',
   parameters_available_in_paper=True,hepdata_tables_downloaded=False))
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
