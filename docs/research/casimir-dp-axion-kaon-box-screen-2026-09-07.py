"""Aligned up-singlet electroweak kaon box kernel, not a meson likelihood."""
import hashlib,json
from pathlib import Path
import mpmath as m
m.mp.dps=50
base=Path(__file__).parent
parent=base/'casimir-dp-axion-weak-mixing-screen-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='d959c811f354b948477e437f1d207884dd134e0d6463bfda519f021543a05b77'
family=json.loads(parent.read_text())['rows']
def Sdiag(x):return x*(1-m.mpf(11)*x/4+x*x/4)/(1-x)**2-m.mpf('1.5')*x**3*m.log(x)/(1-x)**3
def S(x,y):
    if x==0 or y==0:return m.mpf(0)
    if x==y:return Sdiag(x)
    h=lambda z:m.log(z)*(1-2*z+z*z/4)/(1-z)**2
    return x*y*((h(x)-h(y))/(x-y)-3/(4*(1-x)*(1-y)))
def ckm(delta):
    a,b,c=map(m.mpf,['.2264','.0037','.0405'])
    s12,c12=m.sin(a),m.cos(a);s13,c13=m.sin(b),m.cos(b);s23,c23=m.sin(c),m.cos(c)
    e=m.exp(1j*delta)
    return m.matrix([[c12*c13,s12*c13,s13/e],[-s12*c23-c12*s23*s13*e,c12*c23-s12*s23*s13*e,s23*c13],[s12*s23-c12*c23*s13*e,-c12*s23-s12*c23*s13*e,c23*c13]])
V0=ckm(m.mpf('1.215'))
lam=[m.conj(V0[i,1])*V0[i,0] for i in range(3)]
MW=m.mpf('80.379');mc=m.mpf('1.279');mt=m.mpf('162.6')
xc,xt=(mc/MW)**2,(mt/MW)**2
sm=sum(lam[i]*lam[j]*S([0,xc,xt][i],[0,xc,xt][j]) for i in range(3) for j in range(3))
rows=[];gim=[];expansion=[]
for r in family:
    D=m.mpf(str(r['deficit']));yL=m.mpf(str(r['yL']))
    mT=m.sqrt(2000**2+(yL*m.mpf('246.2'))**2/2);xT=(mT/MW)**2
    L=[(1-D)*lam[0],lam[1],lam[2],D*lam[0]];xs=[0,xc,xt,xT]
    gim.append(abs(sum(L)))
    ct=2*L[1]*L[3]*S(xc,xT);tt=2*L[2]*L[3]*S(xt,xT);TT=L[3]**2*Sdiag(xT)
    new=ct+tt+TT
    full=sum(L[i]*L[j]*S(xs[i],xs[j]) for i in range(4) for j in range(4))
    expansion.append(abs(full-sm-new))
    eta_new=m.mpf('.496')*ct+m.mpf('.5765')*(tt+TT)
    rows.append(dict(yL=float(yL),heavy_mass_GeV=float(mT),lambda_T_real=float(m.re(L[3])),lambda_T_imag=float(m.im(L[3])),
        Re_box_new=float(m.re(new)),Im_box_new=float(m.im(new)),
        Re_new_over_Re_LO_SM=float(m.re(new)/m.re(sm)),Im_new_over_Im_LO_SM=float(m.im(new)/m.im(sm)),
        Im_new_with_paper_QCD_approximation=float(m.im(eta_new))))
diag_errors=[abs(S(x,x*(1+m.mpf('1e-20')))/Sdiag(x)-1) for x in [xc,xt,m.mpf(600)]]
realV=ckm(m.mpf(0))
checks=dict(GIM_sum_includes_heavy_row=max(gim)<m.mpf('1e-45'),
    expanded_new_terms_equal_full_sum=max(expansion)<m.mpf('1e-45'),
    equal_mass_limit=max(diag_errors)<m.mpf('1e-18'),
    symmetric_loop_function=abs(S(xc,xt)-S(xt,xc))<m.mpf('1e-45'),
    no_new_phase_needed=all(r['lambda_T_imag']==0. and r['Im_box_new']!=0. for r in rows),
    real_CKM_has_no_CP_phase=all(m.im(realV[i,j])==0 for i in range(3) for j in range(3)))
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='Dimensionless W/charged-Goldstone Inami-Lim kaon mixing kernel, aligned up-singlet and mu=0. CKM angles and masses are diagnostic references, not a new fit. No hadronic matrix element, full QCD evolution or epsilon_K likelihood.',checks=checks,
    LO_SM_kernel=dict(real=float(m.re(sm)),imag=float(m.im(sm))),rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
