"""Flavor-covariant qq J/K matching diagnostic on the frozen subset."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-generated-qu-matching-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='9e3f6e8a2a72d4342732948b1fc0c86019404e0d92156259b07cab6add5fa8e0'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=')[0],str(p),'exec'),n)
np=n['np'];d=n['d'];Pt=n['Pt'];x=n['x'];pref=n['pref'];low=n['low'];mw=n['mw']
J=x/16*(1-2*math.log(x)/(x-1))
K=x/8*(math.log(low/mw)+3*(x+1)/(4*(x-1))-x*(x+2)*math.log(x)/(2*(x-1)**2))
def contractions(A,B,P):
    i,j=1,0;Q=A+B
    top=sum(P[b,a]*(A[i,j,a,b]+A[a,b,i,j]-B[i,j,a,b]-B[a,b,i,j]+2*B[a,j,i,b]+2*B[i,b,a,j]) for a in range(3) for b in range(3))
    wave=sum(P[i,m]*(Q[m,j,i,j]+Q[i,j,m,j])+P[m,j]*(Q[i,m,i,j]+Q[i,j,i,m]) for m in range(3))
    return -8*pref*P[i,j]*top*J,2*pref*wave*K,wave
rows=[];Cs=[]
for tol in [1e-7,1e-9]:
    summary,C=d['run'](n['keys'],tol);Cs.append(C)
    hj,hk,wave=contractions(C['qq1'],C['qq3'],Pt)
    qu=pref*Pt[1,0]*((-2+2/3)*C['qu8'][1,0,2,2]-4*C['qu1'][1,0,2,2])*n['I1']
    base=summary['H_imag_GeV_minus2']+qu.imag
    rows.append(dict(rtol=tol,previous_partial_imag=float(base),J_imag=float(hj.imag),K_imag=float(hk.imag),updated_selected_imag=float(base+hj.imag+hk.imag),qq_fractional_shift=float((hj.imag+hk.imag)/base)))
C=Cs[-1];A=C['qq1'];B=C['qq3'];hj,hk,wave=contractions(A,B,Pt)
phase=np.exp(1j*np.array([.23,-.47,.81]));F=phase[:,None].conj()*phase[None,:]
T=np.einsum('ij,kl->ijkl',F,F)
rj,rk,_=contractions(A*T,B*T,Pt*F);expected=F[1,0]**2
# Local top-Yukawa external-leg anomalous dimension cancels the explicit K log.
yt=d['yt0'];tree_slope=-yt**2*wave/(32*math.pi**2)
matching_slope=2*pref*wave*x/8
checks=dict(rephasing_J=bool(abs(rj/hj-expected)<1e-10),rephasing_K=bool(abs(rk/hk-expected)<1e-10),external_leg_log_cancellation=bool(abs((tree_slope+matching_slope)/tree_slope)<1e-12),tolerance=bool(abs(rows[0]['updated_selected_imag']/rows[1]['updated_selected_imag']-1)<1e-8))
assert all(checks.values())
out=dict(source='https://arxiv.org/pdf/1811.04961 v2 Eq. 2.24, 2.30, 2.31',scope='Author-derived top-projector completion of J contraction in down-doublet basis; selected top/QCD boundary and trajectory only; not full UV/kaon matching.',J=J,K=K,rows=rows,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
