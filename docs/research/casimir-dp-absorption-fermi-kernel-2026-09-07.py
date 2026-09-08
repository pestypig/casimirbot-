"""Exact on-shell vector Fermi-gas rate diagnostic, without binding or transport."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import quad
base=Path(__file__).parent
parent=base/'casimir-dp-absorption-rate-2026-09-07.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='20b3adc518206caa51f964310d629a8654bf351e98e1d3cc3976406414c320fb'
a={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),a)
p=a['p'];m=.247;M=.939;lam=11500.
nodes,weights=np.polynomial.legendre.leggauss(4)

def bounds(momentum,mass=m):
    E=math.hypot(M,momentum);s=M*M+2*mass*E+mass*mass
    center=(s+M*M)*(E+mass)/(2*s)-M
    half=(s-M*M)*momentum/(2*s)
    return E,center-half,center+half

def bracket(E,T,mass=m):
    outgoing=M+T;nu=mass+E-outgoing;H=mass*E+mass*mass/2
    return mass*(H*(E+outgoing)-nu*(mass*outgoing+M*M))

def at_p(momentum,pf,blocked,mass=m,moment=0):
    E,lo,hi=bounds(momentum,mass)
    if blocked:lo=max(lo,math.hypot(M,pf)-M)
    if hi<=lo:return 0.
    T=(lo+hi)/2+(hi-lo)*nodes/2
    # Eq. 7 phase space and Eq. 8 amplitude, divided by sigma0=m^2/(4pi Lambda^4).
    kernel=bracket(E,T,mass)/(2*mass**3*E*momentum)
    return float((hi-lo)/2*np.dot(weights,kernel*T**moment))

def average(pf,blocked,mass=m,tol=1e-9,moment=0):
    return quad(lambda x:3*x*x*at_p(pf*x,pf,blocked,mass,moment),0,1,epsabs=tol,epsrel=tol,limit=200)[0]

def fermi(A,Z,neutron):
    pf=.27-1.13/A+9.73/A**2-39.53/A**3
    return pf*(2*((A-Z) if neutron else Z)/A)**(1/3)

sigma0=m*m/(4*math.pi*lam**4)*p['conv']
common=.3/m*a['ccm']*sigma0
rows=[]
for A,Z in [(12,6),(13,6)]+[(int(A),54) for A,_,_ in p['iso']]:
    for neutron in [False,True]:
        pf=fermi(A,Z,neutron)
        raw=average(pf,False);blocked=average(pf,True)
        rows.append(dict(A=A,Z=Z,nucleon='n' if neutron else 'p',pF_GeV=pf,
                         rate_over_sigma0_unblocked=raw,rate_over_sigma0_blocked=blocked,
                         blocking_fraction=blocked/raw,blocked_mean_T_MeV=1e3*average(pf,True,moment=1)/blocked))

def isotope_rate(A,blocked,neutrons_only=False):
    value=0.
    for r in rows:
        if r['A']!=A or (neutrons_only and r['nucleon']!='n'):continue
        count=A-r['Z'] if r['nucleon']=='n' else r['Z']
        value+=count*r['rate_over_sigma0_'+('blocked' if blocked else 'unblocked')]
    return common*value

forecasts=[]
for blocked in [False,True]:
    xe=sum(f*isotope_rate(A,blocked)*p['xe_atoms']*p['year'] for A,_,f in p['iso'])
    local=sum(f*isotope_rate(A,blocked)*p['nc']/p['f13']*p['d']['hold_time_s'] for A,f in [(12,1-p['f13']),(13,p['f13'])])
    forecasts.append(dict(blocked=blocked,Xe_primary_2p84ty=xe,local_encounters_hold=local,conditional_local_D_le_2N=2*local))

# Independent free stationary-target invariant phase-space limit.
q=m-m*m/(2*(M+m));T=m-q
free=bracket(M,T)*q/(m**3*M*(M+m))
smallp=at_p(1e-6,1e-6,False)
refine=max(abs(average(r['pF_GeV'],True,tol=1e-11)/r['rate_over_sigma0_blocked']-1) for r in rows)
checks=dict(free_target_limit=math.isclose(free,smallp,rel_tol=1e-7),heavy_limit=abs(at_p(1e-5,1e-5,False,mass=1e-5)-1)<1e-4,
            pauli_reduces_rate=all(0<r['blocking_fraction']<=1 for r in rows),adaptive_refinement=refine<1e-6)
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='On-shell independent-nucleon RFG diagnostic, point vector nucleon current; no separation energy, spectral function, FSI, detector transport or acceptance. Not an accepted knockout prediction or model-independent bound.',checks=checks,free_rate_over_sigma0=free,max_refinement_relative=refine,m_GeV=m,nucleon_mass_GeV=M,Lambda_GeV=lam,rows=rows,forecasts=forecasts)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({k:v for k,v in out.items() if k!='rows'},indent=2))
