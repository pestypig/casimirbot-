"""Shared flavor-inclusive neutrino up-scattering benchmark, no fitted counts."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.integrate import quad
from scipy.special import spherical_jn
base=Path(__file__).parent
path=base/'casimir-dp-axion-assembled-subsets-2026-09-07.py'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='d437f10cac13f73de009c96557d2628a43e4335e03915be2faffca2f030930ad'
a={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),a)
p=a['p']; raw=(base/'casimir-dp-neutrino-flux-update-2026-09-07/dune-with.d').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='845124b03c3560f9744da35a66095636b38b196d137ba1f2b557af2a03b4dc0b'
data=np.array([[float(x) for x in line.split()] for line in raw.decode().splitlines()[2:] if len(line.split())==5])
logflux=PchipInterpolator(np.log(data[:,0]),np.log(data[:,1:].sum(axis=1)*4*math.pi/1e4),extrapolate=False)
grid=np.linspace(math.log(.01),math.log(1e4),2401)
weighted=PchipInterpolator(grid,np.exp(logflux(grid)-grid))
def flux(E):return math.exp(float(logflux(math.log(E))))
def kernel(E):return weighted.integrate(math.log(max(E,.01)),grid[-1]) if E<1e4 else 0.
def emin(T,M,m):return (m*m+2*M*T)/(2*(math.sqrt(T*T+2*M*T)-T))
def bounds(E,M,m):
    ss=M*M+2*M*E; lam=max(0.,(ss-(M+m)**2)*(ss-(M-m)**2))
    center=2*M*E*E-m*m*(E+M); width=E*math.sqrt(lam)
    return m**4/(2*(center+width)),(center+width)/(2*M*(2*E+M))
bp=.939*(.026/.00216+.038/.00467);bn=.939*(.018/.00216+.056/.00467)
def coefficient(T,M,m,A,Z,mediator,r=.02,form=True):
    q=math.sqrt(2*M*T); x=q*1.23*A**(1/3)/p['hc']
    F=3*spherical_jn(1,x)/x/(1+(.7*q/p['hc'])**2) if form else 1.
    return M*(r*r*mediator*mediator)**2*(Z*bp+(A-Z)*bn)**2/(4*math.pi*(mediator*mediator+2*M*T)**2)*(1+T/(2*M))*(M*T+m*m/2)*F*F*p['conv']
def integrate_gl(fun,lo,hi,n):
    x,w=np.polynomial.legendre.leggauss(n)
    return (hi-lo)/2*sum(wi*fun((hi+lo)/2+(hi-lo)/2*xi) for xi,wi in zip(x,w))
def xe(lo,hi,m,med,n=96):
    def density(EkeV):
        T=EkeV*1e-6; total=0.
        for A,atomic,f in p['iso']:
            M=atomic*.93149410242-54*.00051099895
            total+=f*coefficient(T,M,m,A,54,med)*kernel(emin(T,M,m))
        return total*1e-6*p['xe_atoms']*p['year']
    return integrate_gl(density,lo,hi,n)
def carbon_upper(m,med,n=128):
    total=0.
    for A,atomic,f in [(12,12.,1-p['f13']),(13,13.00335483507,p['f13'])]:
        M=atomic*.93149410242-6*.00051099895; threshold=m+m*m/(2*M)
        def at_logE(lE):
            E=math.exp(lE); tlo,thi=bounds(E,M,m)
            sigma=integrate_gl(lambda lT:coefficient(math.exp(lT),M,m,A,6,med,form=False)*math.exp(lT)/E**2,math.log(tlo),math.log(thi),96)
            return E*flux(E)*sigma
        total+=p['nc']/p['f13']*f*integrate_gl(at_logE,math.log(threshold),math.log(1e4),n)
    return 2*total*p['d']['hold_time_s']
rows=[]
for m in [1.,2.]:
    for med in [1.,10.]:
        rows.append(dict(mchi_GeV=m,mediator_GeV=med,equal_yukawas=.02*med,Xe_raw_full=xe(5.4,269.9,m,med),Xe_raw_high=xe(202,269.9,m,med),Xe_raw_source_window=xe(202,296,m,med),D_independent_carbon_upper=carbon_upper(m,med)))
refined=carbon_upper(2.,1.,256)
direct=quad(lambda x:math.exp(float(logflux(x))-x),math.log(8.26464),math.log(1e4),epsabs=1e-16,limit=200)[0]
checks={'flux_kernel_direct_check':abs(kernel(8.26464)/direct-1)<1e-5,'carbon_quadrature_refinement':abs(refined/rows[2]['D_independent_carbon_upper']-1)<1e-3,'nested_xenon_windows':all(0<r['Xe_raw_high']<r['Xe_raw_full'] for r in rows),'coupling_fourth_power':math.isclose(coefficient(.000248,122.,1.,131,54,1.,r=.04)/coefficient(.000248,122.,1.,131,54,1.,r=.02),16,rel_tol=1e-12)}
assert all(checks.values()),checks
checks={k:bool(v) for k,v in checks.items()}
out=dict(scope='Three degenerate orthogonal chi flavors with universal inclusive coupling; shared site flux, independent point nuclei; no detector fit',full_model_admitted=False,mu_GeV=.00216,md_GeV=.00467,coupling_ratio_GeV_m1=.02,checks=checks,carbon_refinement_relative_change=refined/rows[2]['D_independent_carbon_upper']-1,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
