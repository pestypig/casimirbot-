"""Fixed-gu kaon/mass threshold tradeoff; scheme-specific, no naturalness bound."""
import hashlib,json,math
from pathlib import Path
import mpmath as mp
base=Path(__file__).parent
src=base/'casimir-dp-axion-epsilon-kaon-conversion-2026-09-07.py'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='bd235a57712bffa9209ccde48bcd08c3364183575fc5439fbc56c29c553d12b8'
ns={'__file__':str(src)}
exec(compile(src.read_text().split('\nrows=[]')[0],str(src),'exec'),ns)
p=base/'casimir-dp-axion-potential-running-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7995565bb8e05e03982625fd31cfa5205d2107fbfed5be652356e36469c00f8d'
old=json.loads(p.read_text())['rows'][1]['thresholds']['delta_mA2']
M=2000.;v=246.2;ma=1.
D=lambda y:(y*v)**2/(2*M*M+(y*v)**2)
gu=.0032*math.sqrt(D(.2))
def row(y):
    yr=gu/math.sqrt(D(y));t=M*M+(y*v)**2/2
    leading=3*yr*yr*M*M/(4*math.pi**2)
    exact=leading*(1-math.log(t/M**2))
    e=ns['prediction'](y)
    return dict(yL=y,yR=yr,epsilon_NP=e,leading_potential_mass_threshold_GeV2=leading,broken_background_mass_curvature_GeV2=exact,threshold_over_reference_ma2=exact/ma**2,reference_ma2_over_threshold=ma**2/exact,epsilon_times_threshold_GeV2=e*exact)
rows=[row(y) for y in [.025,.05,.075,.09916784176599759,.10639429909400437,.2]]
# Independent high-precision differentiation of the two eigenvalue CW potential.
mp.mp.dps=65
test=rows[3];b=mp.mpf(str(test['yL']))*mp.mpf(str(v))/mp.sqrt(2);yr=mp.mpf(str(test['yR']))
def potential(a):
    c=yr*a;tr=M*M+b*b+c*c;det=b*b*c*c
    high=(tr+mp.sqrt(tr*tr-4*det))/2;low=det/high
    F=lambda t:mp.mpf(0) if t==0 else t*t*(mp.log(t/(M*M))-mp.mpf('1.5'))
    return -3*(F(high)+F(low))/(16*mp.pi**2)
h=mp.mpf('1e-8');finite=float(2*(potential(h)-potential(0))/(h*h))
checks=dict(reference_leading_threshold_recovered=math.isclose(row(.2)['leading_potential_mass_threshold_GeV2'],old,rel_tol=1e-13),fixed_gu=all(math.isclose(r['yR']*math.sqrt(D(r['yL'])),gu,rel_tol=1e-13) for r in rows),CW_second_derivative=math.isclose(finite,test['broken_background_mass_curvature_GeV2'],rel_tol=1e-12),opposing_monotonic_trends=all(rows[i]['epsilon_NP']<rows[i+1]['epsilon_NP'] and rows[i]['broken_background_mass_curvature_GeV2']>rows[i+1]['broken_background_mass_curvature_GeV2'] for i in range(len(rows)-1)))
assert all(checks.values())
out=dict(scope='One-loop yu=0 potential curvature at mu=M, fixed tree gu and M. Not a pole-mass correction, full tuning measure, or exclusion.',exact_gu=gu,reference_ma_GeV=ma,rows=rows,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
