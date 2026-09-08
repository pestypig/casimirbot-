"""Pure-heavy electroweak box versus dimension-six matching, without QCD."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-kaon-box-screen-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='1aefbe35e2c30b93b7be365c5c48289bd375509cb8c2910aeab9a2889d9c3899'
n={'__file__':str(p)}
exec(compile(p.read_text().split('\nrows=[];gim=[];expansion=[]')[0],str(p),'exec'),n)
m=n['m'];v=m.mpf('246.2');MW=n['MW'];y=m.mpf('.2');lu=n['lam'][0]
GF=1/(m.sqrt(2)*v*v) # exact tree identity for order-consistent comparison
rows=[]
for M in map(m.mpf,['2000','5000','20000','200000']):
    b=y*v/m.sqrt(2);t=M*M+b*b;D=b*b/t;x=t/MW**2
    full=GF**2*MW**2/(4*m.pi**2)*(D*lu)**2*n['Sdiag'](x)
    matched=(y*y*lu)**2/(128*m.pi**2*M*M)
    rows.append(dict(M_GeV=float(M),full_H_LL_real_GeV_minus2=float(m.re(full)),matched_H_LL_real_GeV_minus2=float(m.re(matched)),full_over_matched=float(m.re(full/matched)),imaginary_full=float(m.im(full))))
x=n['xt'];X=m.mpf('1e10')
h=lambda z:m.log(z)*(1-2*z+z*z/4)/(1-z)**2
asym=x*(m.log(X)/4-h(x)+3/(4*(1-x)))
ratio=float(n['S'](x,X)/asym)
checks=dict(pure_heavy_asymptotic_normalization=abs(rows[-1]['full_over_matched']-1)<2e-5,convergence=all(abs(rows[i+1]['full_over_matched']-1)<abs(rows[i]['full_over_matched']-1) for i in range(len(rows)-1)),pure_heavy_no_CP_phase=all(r['imaginary_full']==0 for r in rows),mixed_large_mass_expansion=abs(ratio-1)<1e-8)
assert all(checks.values())
out=dict(scope='Pure-heavy overlap and mixed loop asymptotics only, tree GF relation, no QCD or full mixed finite matching.',rows=rows,mixed_asymptotic_ratio=ratio,checks=checks,full_matching_completed=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
