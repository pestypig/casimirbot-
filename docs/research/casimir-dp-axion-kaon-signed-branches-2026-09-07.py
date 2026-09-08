"""Dated fixed-input sensitivity; neither a CKM refit nor a confidence region."""
import hashlib,json,math
from pathlib import Path
from scipy.optimize import brentq
p=Path(__file__).with_name('casimir-dp-axion-epsilon-kaon-conversion-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='bd235a57712bffa9209ccde48bcd08c3364183575fc5439fbc56c29c553d12b8'
ns={'__file__':str(p)}
exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),ns)
E=ns['prediction'];sm=.00216;obs=.002228
width=1.96*math.hypot(.00018,.000011)
# |sm-E| in [obs-width,obs+width], keeping both signs.
intervals=[(0.,sm-obs+width),(sm+obs-width,sm+obs+width)]
D=lambda y:(y*246.2)**2/(2*2000**2+(y*246.2)**2)
gu=.0032*math.sqrt(D(.2))
inverse=lambda e:0. if e==0 else brentq(lambda y:E(y)-e,0.,1.,xtol=1e-14)
rows=[]
for label,(lo,hi) in zip(['same_sign','reversed_sign'],intervals):
    yl,yh=inverse(lo),inverse(hi)
    rows.append(dict(branch=label,new_amplitude_interval=[lo,hi],yL_interval=[yl,yh],deficit_interval=[D(yl),D(yh)],lower_yL_endpoint_at_fixed_gu_exists=yl!=0))
ref=[]
for y in [.09916784176599759,.2,inverse(sm+obs)]:
    yr=gu/math.sqrt(D(y));e=E(y)
    ref.append(dict(yL=y,yR=yr,new_amplitude=e,signed_total_reference=sm-e,magnitude_total_reference=abs(sm-e),required_SM_same_sign=obs+e,required_SM_reversed_sign=e-obs,first_row_pull=((1-D(y))-.9984)/.0007,mass_loop_ratio=(yr/.0032)**2))
checks=dict(endpoints_reproduce_magnitude_band=all(abs(abs(sm-E(y))-(obs-width))<1e-12 or abs(abs(sm-E(y))-(obs+width))<1e-12 for r in rows for y in r['yL_interval'] if y!=0),reflection_center_reproduces_measurement=math.isclose(ref[-1]['magnitude_total_reference'],obs,rel_tol=1e-12),zero_is_not_fixed_gu_member=gu>0)
assert all(checks.values())
out=dict(scope='Algebraic sensitivity with dated external SM magnitude, independent Gaussian width used illustratively, no joint likelihood or physical phase test.',reference_SM=sm,measurement=obs,illustrative_width=width,branches=rows,reference_rows=ref,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
