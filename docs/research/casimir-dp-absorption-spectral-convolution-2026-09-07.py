"""Conditional projected-current convolution on legacy carbon proton spectral weights."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
table=base/'casimir-dp-absorption-spectral-intake-2026-09-07/benhar-sf-12c.data'
assert hashlib.sha256(table.read_bytes()).hexdigest()=='951d532b7b2430a1eb5d8d7c3a5d434b703956afa828bb0b462dd5e17dacac3e'
d=np.loadtxt(table);p=d[:,0]/1000;rem=d[:,1]/1000
w=d[:,2]*p*p;w=w/w.sum()
m=.247;M=.939;MA=12*.93149410242-6*.00051099895

def integrate(p,rem,recoil=True,blocked=True,n=4,low=0.,high=1.,moment=0):
    p=np.asarray(p);rem=np.asarray(rem);Ep=np.sqrt(M*M+p*p)
    MR=MA-M+rem
    tr=p*p/(np.sqrt(MR*MR+p*p)+MR) if recoil else np.zeros_like(p)
    Q=m+M-rem-tr;s=Q*Q-p*p
    valid=(Q>0)&(s>M*M)
    safe=np.where(valid,s,1.)
    center=(safe+M*M)*Q/(2*safe)-M;half=(safe-M*M)*p/(2*safe)
    lo=np.maximum(center-half,low);hi=np.minimum(center+half,high)
    if blocked:lo=np.maximum(lo,math.hypot(M,.2205)-M)
    width=np.where(valid,np.maximum(0,hi-lo),0.)
    x,g=np.polynomial.legendre.leggauss(n)
    T=(lo[:,None]+hi[:,None])/2+width[:,None]*x/2
    out=M+T;nu=Q[:,None]-out;pp2=out*out-M*M
    pdotpprime=(p[:,None]**2+pp2-nu*nu)/2
    # General dots: do not use identities requiring energy conservation at projected vertex.
    prime_dot_nu=out*nu-pdotpprime+pp2
    initial_dot_nu=Ep[:,None]*nu-p[:,None]**2+pdotpprime
    B=prime_dot_nu*m*Ep[:,None]+m*out*initial_dot_nu-M*M*m*nu
    kernel=B/(2*m**3*Ep[:,None]*p[:,None])
    values=width/2*np.sum(g*kernel*T**moment,axis=1)
    return values

rows=[];edges=np.arange(0,305,5)/1000
for recoil in [False,True]:
    for blocked in [False,True]:
        v=integrate(p,rem,recoil,blocked);total=float(w@v)
        bins=[float(w@integrate(p,rem,recoil,blocked,low=lo,high=hi)) for lo,hi in zip(edges[:-1],edges[1:])]
        rows.append(dict(spectator_recoil=recoil,hard_pauli=blocked,rate_over_sigma0=total,mean_T_MeV=float(1000*(w@integrate(p,rem,recoil,blocked,moment=1))/total),spectrum_bin_rates_over_sigma0=bins))
# Free on-shell moving target: encode M-Ep as removal energy only for this algebraic test.
ptest=np.array([.03,.12,.22]);rtest=M-np.sqrt(M*M+ptest*ptest)
calc=integrate(ptest,rtest,recoil=False,blocked=False)
parent=base/'casimir-dp-absorption-fermi-kernel-2026-09-07.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='436144f88f3068145b06bb84af623cfb492e5603adae275d1c72c9890ec9af1d'
ns={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nsigma0=')[0],str(parent),'exec'),ns)
ref=np.array([ns['at_p'](float(q),.2205,False) for q in ptest])
checks=dict(free_moving_kernel=bool(np.allclose(calc,ref,rtol=1e-11)),
            quadrature=bool(np.allclose(integrate(p,rem,n=4),integrate(p,rem,n=8),rtol=1e-10,atol=1e-12)),
            positive_integrated_weights=bool(np.all(integrate(p,rem)>=-1e-12)),
            spectral_partition=all(math.isclose(sum(r['spectrum_bin_rates_over_sigma0']),r['rate_over_sigma0'],rel_tol=1e-10) for r in rows))
assert all(checks.values())
config=ns['p'];sigma0=m*m/(4*math.pi*11500.**4)*config['conv']
target_protons=6*(1-config['f13'])*config['nc']/config['f13']
for r in rows:
    r['local_C12_proton_only_D_le_2N']=2*(.3/m)*29979245800.*sigma0*target_protons*config['d']['hold_time_s']*r['rate_over_sigma0']
out=dict(scope='Conditional on-shell projected point-vector current with legacy proton response; normalized per proton. No neutron mapping, FSI, detector selection, or conserved many-body current is supplied.',checks=checks,m_GeV=m,M_GeV=M,bin_edges_MeV=(edges*1000).tolist(),rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(checks=checks,rows=[{k:v for k,v in r.items() if k!='spectrum_bin_rates_over_sigma0'} for r in rows]),indent=2))
