"""Conditional epsilon_K conversion; dated inputs, no likelihood or exclusion."""
import hashlib,json,math
from pathlib import Path
from scipy.optimize import brentq
base=Path(__file__).parent
p=base/'casimir-dp-axion-kaon-box-screen-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='4cdfac9bf93c6c57aa10634b6187abd6e84571d0d8c71e5f00f3e28a4d303af2'
parent=json.loads(p.read_text())
src=base/'casimir-dp-axion-kaon-box-screen-2026-09-07.py'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='1aefbe35e2c30b93b7be365c5c48289bd375509cb8c2910aeab9a2889d9c3899'
ns={'__file__':str(src)}
exec(compile(src.read_text().split('\nrows=[];gim=[];expansion=[]')[0],str(src),'exec'),ns)
GF=1.1663787e-5;MW=80.379;mK=.497611;fK=.1557;BK=.7625;kappa=.92;dm=3.484e-15
pref=GF**2*MW**2*mK*fK**2*BK*kappa/(12*math.sqrt(2)*math.pi**2*dm)
experimental=.002228;dated_scale=.000248
def prediction(y):
    m=ns['m'];S=ns['S'];lam=ns['lam']
    b=y*246.2/math.sqrt(2);D=b*b/(2000**2+b*b)
    xT=(2000**2+b*b)/MW**2
    im=m.im(2*D*lam[0]*(m.mpf('.496')*lam[1]*S(ns['xc'],xT)+m.mpf('.5765')*lam[2]*S(ns['xt'],xT)))
    return pref*float(im)
rows=[]
for r in parent['rows']:
    e=pref*r['Im_new_with_paper_QCD_approximation']
    rows.append(dict(yL=r['yL'],epsilon_NP_magnitude=abs(e),fraction_of_measured_magnitude=abs(e)/experimental,ratio_to_dated_diagnostic_scale=abs(e)/dated_scale))
root=brentq(lambda y:prediction(y)-dated_scale,.01,.2,xtol=1e-14)
D=lambda y:(y*246.2)**2/(2*2000**2+(y*246.2)**2)
gu=.0032*math.sqrt(D(.2));yr=gu/math.sqrt(D(root))
checks=dict(archived_rows_reproduced=all(math.isclose(prediction(r['yL']),r['epsilon_NP_magnitude'],rel_tol=1e-12) for r in rows),zero_mixing_zero_effect=prediction(0)==0,diagnostic_root_reproduced=math.isclose(prediction(root),dated_scale,rel_tol=1e-10),fixed_low_energy_coupling=math.isclose(yr*math.sqrt(D(root)),gu,rel_tol=1e-14))
assert all(checks.values())
out=dict(scope='Aligned up-singlet diagnostic with fixed CKM and approximate eta factors. No global fit, complete uncertainty, or exclusion.',inputs=dict(GF_GeV_minus2=GF,MW_GeV=MW,mK_GeV=mK,fK_reference_GeV=fK,BhatK_reference=BK,kappa_epsilon=kappa,delta_mK_GeV=dm),dimensionless_prefactor=pref,experimental_epsilon_magnitude=experimental,rows=rows,dated_diagnostic_scale=dated_scale,conditional_root=dict(yL=root,yR_at_fixed_gu=yr,first_row_deficit=D(root),A_mass_loop_relative_to_reference=(yr/.0032)**2),checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
