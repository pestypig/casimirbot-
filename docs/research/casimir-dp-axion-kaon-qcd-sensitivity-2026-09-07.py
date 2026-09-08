"""Resolve QCD coefficient dependence; borrowed errors are not heavy-scale errors."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-epsilon-kaon-conversion-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='bd235a57712bffa9209ccde48bcd08c3364183575fc5439fbc56c29c553d12b8'
n={'__file__':str(p)}
exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
z=n['ns'];m=z['m'];S=z['S'];lam=z['lam'];P=n['pref']
rows=[]
for y in [.05,.09916784176599759,.2]:
    b=y*246.2/math.sqrt(2);D=b*b/(2000**2+b*b);xT=(2000**2+b*b)/80.379**2
    ac=P*float(m.im(2*D*lam[0]*lam[1]*S(z['xc'],xT)))
    at=P*float(m.im(2*D*lam[0]*lam[2]*S(z['xt'],xT)))
    central=.496*ac+.5765*at
    # Bounds on variance for arbitrary correlation of the two borrowed errors.
    uc=abs(ac)*.04;ut=abs(at)*.0065
    rows.append(dict(yL=y,epsilon_coefficient_eta_cT=ac,epsilon_coefficient_eta_tT=at,charm_term=.496*ac,top_term=.5765*at,central=central,charm_over_top=.496*ac/(.5765*at),borrowed_error_relative_min=abs(ut-uc)/central,borrowed_error_relative_max=(ut+uc)/central,eta_tT_for_zero_at_fixed_eta_cT=-.496*ac/at,eta_tT_for_dated_same_sign_endpoint=(.0002854581638610149-.496*ac)/at))
checks=dict(central_reproduces_archive=all(math.isclose(r['central'],n['prediction'](r['yL']),rel_tol=1e-12) for r in rows),cancellation_reconstructed=all(abs(r['epsilon_coefficient_eta_cT']*.496+r['epsilon_coefficient_eta_tT']*r['eta_tT_for_zero_at_fixed_eta_cT'])<1e-16 for r in rows),endpoint_reconstructed=all(math.isclose(r['epsilon_coefficient_eta_cT']*.496+r['epsilon_coefficient_eta_tT']*r['eta_tT_for_dated_same_sign_endpoint'],.0002854581638610149,rel_tol=1e-12) for r in rows))
assert all(checks.values())
out=dict(scope='Fixed CKM/mass linear sensitivity in eta. Borrowed SM eta errors do not quantify heavy-scale approximation or full prediction uncertainty.',rows=rows,checks=checks,full_QCD_matching_completed=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
