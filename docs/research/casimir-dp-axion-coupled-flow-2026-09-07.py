"""Coupled gaugeless SMEFT response of a declared current/box boundary subset."""
import json,hashlib,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-wilson-beta-audit-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='53fbaa60f2df98415d10614ae447d7ab5a3800494f41890d34260ac02c65f4a6'
d={'__file__':str(p)};exec(compile(p.read_text().split('\nC=blank();')[0],str(p),'exec'),d)
np=d['np'];beta=d['beta'];blank=d['blank'];V=d['V'];Pu=d['Pu'];Pt=d['Pt']
from scipy.integrate import solve_ivp
M=2000.;low=162.6;v=246.2;y=.2;a=.108;L=math.log(M/low);c=7*a/(2*math.pi);yt0=math.sqrt(2)*low/v
SM={'g','gp','gs','Gu','Gd','Ge','m2','Lambda'};shapes=d['smeftutil'].C_keys_shape
def standard(t):
    C=blank();alpha=a/(1+c*t);C['gs']=math.sqrt(4*math.pi*alpha)
    C['Gu']=V.conj().T@np.diag([0.,0.,yt0*(alpha/a)**(4/7)])
    return C
initial=standard(L);B=y*y*Pu;Y=initial['Gu']@initial['Gu'].conj().T
initial['phiq1']=B/(4*M*M);initial['phiq3']=-initial['phiq1']
hard=-np.einsum('ij,kl->ijkl',B,B)/(256*math.pi**2*M*M)+1.5*(np.einsum('ij,kl->ijkl',B,Y)+np.einsum('ij,kl->ijkl',Y,B))/(256*math.pi**2*M*M)
initial['qq1']=hard.copy();initial['qq3']=hard.copy()
def run(keys,rtol):
    lengths=[np.asarray(initial[k]).size for k in keys];ends=np.cumsum([0]+lengths)
    def pack(C):return np.concatenate([np.asarray(C[k]).reshape(-1) for k in keys])*M*M
    def unpack(t,z):
        C=standard(t)
        for k,lo,hi in zip(keys,ends[:-1],ends[1:]):C[k]=(z[lo]/(M*M) if shapes[k]==1 else z[lo:hi].reshape(shapes[k])/(M*M))
        return C
    def rhs(t,z):return pack(beta(unpack(t,z)))/(16*math.pi**2)
    sol=solve_ivp(rhs,[L,0],pack(initial),rtol=rtol,atol=rtol*1e-5,method='DOP853')
    assert sol.success
    C=unpack(0,sol.y[:,-1]);i,j=1,0;x=(low/80.379)**2;mw=80.379
    H1=math.log(low/mw)-(x-7)/(4*(x-1))-(x*x-2*x+4)*math.log(x)/(2*(x-1)**2)
    H2=math.log(low/mw)+(7*x-25)/(4*(x-1))-(x*x-14*x+4)*math.log(x)/(2*(x-1)**2)
    S=float(d['n']['Sdiag'](d['n']['m'].mpf(str(x))))
    ct=C['phiq3'];flavor=(Pt@ct+ct@Pt)[i,j]
    finite=(1/(2*v**4))*mw**2/(4*math.pi**2)*Pt[i,j]*v*v*x*(C['phiq1'][i,j]*H1-ct[i,j]*H2+2*S/x*flavor)
    h=-(C['qq1']+C['qq3'])[i,j,i,j]+finite
    return dict(keys_count=len(keys),rtol=rtol,function_evaluations=sol.nfev,H_imag_GeV_minus2=float(h.imag),current11_real_GeV_minus2=float(C['phiq1'][0,0].real),qu1_max_GeV_minus2=float(np.max(abs(C['qu1']))))
restricted=run(['phiq1','phiq3','qq1','qq3'],1e-7)
allkeys=[k for k in initial if k not in SM];full=run(allkeys,1e-7);tight=run(allkeys,1e-9)
checks=dict(tolerance_stability=bool(abs(tight['H_imag_GeV_minus2']/full['H_imag_GeV_minus2']-1)<1e-5),additional_operator_generated=bool(full['qu1_max_GeV_minus2']>0))
assert all(checks.values())
out=dict(scope='Coupled gaugeless top-Yukawa beta evolution on imposed QCD-only SM trajectory, current/pure-heavy/mixed hard subset boundary. Only current finite EW matching included; other generated operators not yet fully matched.',restricted=restricted,coupled=full,tight=tight,coupled_over_restricted=full['H_imag_GeV_minus2']/restricted['H_imag_GeV_minus2'],checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
