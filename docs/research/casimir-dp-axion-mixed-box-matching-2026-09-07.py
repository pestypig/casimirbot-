"""Published hard/current matching versus mixed top-heavy full loop, no QCD."""
import hashlib,json
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-kaon-box-screen-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='1aefbe35e2c30b93b7be365c5c48289bd375509cb8c2910aeab9a2889d9c3899'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[];gim=[];expansion=[]')[0],str(p),'exec'),n)
m=n['m'];MW=n['MW'];x=n['xt'];v=m.mpf('246.2');y=m.mpf('.2');lu,lt=n['lam'][0],n['lam'][2]
def H1(x,mu):return m.log(mu/MW)-(x-7)/(4*(x-1))-(x*x-2*x+4)*m.log(x)/(2*(x-1)**2)
def H2(x,mu):return m.log(mu/MW)+(7*x-25)/(4*(x-1))-(x*x-14*x+4)*m.log(x)/(2*(x-1)**2)
h=lambda x:m.log(x)*(1-2*x+x*x/4)/(1-x)**2
rows=[];scale_errors=[]
for M in map(m.mpf,['2000','5000','20000','200000']):
    K=y*y*lu*lt*(2*n['mt']**2/v**2)/(64*m.pi**2*M*M)
    vals=[]
    for high in [M/2,M,2*M]:
        for low in [MW,n['mt'],2*n['mt']]:
            hard=-K*(m.mpf('1.5')+m.log(high**2/M**2))
            evolution=K*2*m.log(high/low)
            finite=K*(H1(x,low)+H2(x,low))
            vals.append(hard+evolution+finite)
    scale_errors.append(max(abs(z/vals[0]-1) for z in vals))
    b=y*v/m.sqrt(2);t=M*M+b*b;D=b*b/t;GF=1/(m.sqrt(2)*v*v)
    full=GF**2*MW**2/(4*m.pi**2)*2*D*lu*lt*n['S'](x,t/MW**2)
    rows.append(dict(M_GeV=float(M),EFT_imag_H_LL_GeV_minus2=float(m.im(vals[0])),full_imag_H_LL_GeV_minus2=float(m.im(full)),full_over_EFT=float(m.re(full/vals[0]))))
V=n['V0'];Pu=m.matrix(3);Pt=m.matrix(3)
for i in range(3):
    for j in range(3):Pu[i,j]=m.conj(V[0,i])*V[0,j];Pt[i,j]=m.conj(V[2,i])*V[2,j]
checks=dict(high_and_EW_scales_cancel=max(scale_errors)<m.mpf('1e-45'),finite_identity=abs(H1(x,MW)+H2(x,MW)-m.mpf('1.5')-(-4*h(x)+3/(1-x)))<m.mpf('1e-45'),flavor_sum_vanishes=m.norm(Pt*Pu+Pu*Pt)<m.mpf('1e-45'),full_theory_converges=abs(rows[-1]['full_over_EFT']-1)<1e-5)
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='Leading dimension-six yL^2 yt^2 electroweak overlap at fixed tree inputs and up alignment. No two-loop QCD, charm matching, scalar-A subset, or global fit.',rows=rows,checks=checks,full_QCD_matching_completed=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
