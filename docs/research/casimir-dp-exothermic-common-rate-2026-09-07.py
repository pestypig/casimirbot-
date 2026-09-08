"""Isoscalar off-diagonal contact benchmark, prescribed excited halo population."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-axion-tree-companions-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ef78e9d39deae17717c1d31d8d3b7f47a864fa2d6abafed1a9c0a4b28d95fd93'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
h=n['h'];a=n['p'];ckm=n['ckm'];halo=h['scenarios']['central'];vmax=(halo[1]+halo[2])/ckm
sigma=1e-45;fraction=1.;rho=.3;mp=.9382720813
def limits(m,A,release):
    mu=m*A/(m+A);s=math.sqrt(vmax*vmax+2*release/mu)
    return mu*mu/(2*A)*(s-vmax)**2,mu*mu/(2*A)*(s+vmax)**2
def rate(m,A,Z,mass,release,lo,hi,form=True):
    mu=m*mass/(m+mass);mup=m*mp/(m+mp)
    def integrand(E):
        q=math.sqrt(2*mass*E);vm=abs(mass*E/mu-release)/q*ckm
        F=n['form'](q,A) if form else 1.
        return mass*sigma*A*A/(2*mup*mup)*F*F*h['eta'](vm,*halo)*ckm**2*1e5
    return quad(integrand,lo,hi,epsabs=1e-52,epsrel=1e-8,points=[mu*release/mass] if lo<mu*release/mass<hi else None)[0]*rho*fraction/m
rows=[]
for m in [10.,15.,40.,100.]:
    release=.000248*(m+131.293*.93149410242)/m
    xe=0.;high=0.
    for A,atomic,f in a['iso']:
        mass=atomic*.93149410242-54*.00051099895
        lo,hi=limits(m,mass,release)
        for lower,upper,label in [(5.4e-6,269.9e-6,'full'),(200e-6,269.9e-6,'high')]:
            left=max(lo,lower);right=min(hi,upper)
            value=0 if left>=right else rate(m,A,54,mass,release,left,right)*f*a['xe_atoms']*a['year']
            if label=='full':xe+=value
            else:high+=value
    carbon=0.;checks=[]
    for A,atomic,f in [(12,12.,1-a['f13']),(13,13.00335483507,a['f13'])]:
        mass=atomic*.93149410242-6*.00051099895;mu=m*mass/(m+mass);mup=m*mp/(m+mp)
        lo,hi=limits(m,mass,release)
        numerical=rate(m,A,6,mass,release,lo,hi,False)
        analytic=rho*fraction/m*sigma*A*A*(mu/mup)**2*quad(lambda v:h['pdf'](v,*halo)*math.sqrt((v/ckm)**2+2*release/mu)*ckm*1e5,0,halo[1]+halo[2],points=[halo[1]-halo[2]],epsabs=1e-7)[0]
        checks.append(abs(numerical/analytic-1));assert checks[-1]<1e-7
        carbon+=analytic*f*a['nc']/a['f13']*a['d']['hold_time_s']
    rows.append(dict(mchi_GeV=m,delta_GeV=-release,sigma_p_reference_cm2=sigma,f_excited=fraction,C_nucleon_GeV_minus2=math.sqrt(math.pi*sigma/a['conv'])/(m*mp/(m+mp)),Xe_raw_window=xe,Xe_raw_high=high,C_independent_F1_events_upper=carbon,D_independent_upper=2*carbon,speed_vs_recoil_relative_error=max(checks)))
out=dict(scope='Off-diagonal isoscalar vector nucleon contact, sigma_p=mu_p^2 C^2/pi. Conditional present excited fraction1, no cosmological survival derivation. Xe Helm; carbon F=1 upper within coherent independent-nucleus approximation.',operator='C (chi_bar gamma_mu chi_star + h.c.) (p_bar gamma^mu p + n_bar gamma^mu n)',rho_GeV_cm3=rho,halo_km_s=halo,rows=rows,checks=dict(speed_vs_recoil_integrals=True),model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
