"""Shared SHM moments for approximate Xe and two finite-grid diamond channels."""
import hashlib,json,math
from pathlib import Path
import h5py
import numpy as np
from scipy.integrate import quad,simpson,cumulative_trapezoid
from scipy.special import spherical_jn
base=Path(__file__).parent
parent=base/'casimir-dp-photon-nuclear-magnetic-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='f10f5e53d2967e64f0021734ba2689e9586f3aa6ab3e83717629d19a8018ab13'
mod={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
p=mod['p'];ckm=299792.458;alpha=1/137.03599908;me=5.1099894e5
prior=base/'casimir-dp-diamond-density-rate-2026-09-06.json'
assert hashlib.sha256(prior.read_bytes()).hexdigest()=='39d3554dfbf1e498cda44feada20d83d3fc72a6548ba2b56284dd6eb4b00e4c7'
old=json.loads(prior.read_text())
tables=[]
for file,blob in [('casimir-dp-diamond-response-2026-09-06/diamond_comp.h5','640fbe133a393318e97b9b3856cc869cf309f142'),('casimir-dp-diamond-spin-response-2026-09-06/diamond_nolfe.h5','775bab519afc75d424ae1fc499b09b54b42384a3')]:
    raw=(base/file).read_bytes()
    assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob
    with h5py.File(base/file) as f:
        tables.append((f['q'][:]*alpha*me,f['E'][:],f['epsilon'][:]))
q,w,ep=tables[0];assert np.array_equal(q,tables[1][0]) and np.array_equal(w,tables[1][1])
sel=w>=5.5;w=w[sel];Q=q[:,None];W=w[None,:]
elf=np.maximum(ep[:,sel].imag/abs(ep[:,sel])**2,0)
spin=np.maximum(tables[1][2][:,sel].imag,0)
scenarios={'central':(238.,544.,250.2),'v0_220':(220.,544.,250.2),'vesc_528':(238.,528.,250.2),'vesc_560':(238.,560.,250.2),'summer_speed':(238.,544.,265.1),'winter_speed':(238.,544.,235.3)}
def pdf(v,h):
    v0,esc,earth=np.array(h)/ckm;z=esc/v0
    N=math.erf(z)-2*z*math.exp(-z*z)/math.sqrt(math.pi)
    return np.where((v>0)&(v<esc+earth),v/(math.sqrt(math.pi)*v0*earth*N)*(np.exp(-((v-earth)/v0)**2)-np.exp(-(np.minimum(v+earth,esc)/v0)**2)),0)
class Moments:
    def __init__(self,h):
        self.h=h;self.v=np.linspace(0,(h[1]+h[2])/ckm,40001);f=pdf(self.v,h)
        self.normalization=float(simpson(f,x=self.v))
        def tail(y):return -cumulative_trapezoid(y[::-1],x=self.v[::-1],initial=0)[::-1]
        self.eta=tail(np.divide(f,self.v,out=np.zeros_like(f),where=self.v>0));self.H=tail(f*self.v)
    def __call__(self,x):
        return np.interp(x,self.v,self.eta,right=0),np.interp(x,self.v,self.H,right=0)
def xe_shape(E,mass,M):
    out=0.
    for A,atomic,f in p['iso']:
        ma=atomic*.93149410242-54*.00051099895;red=ma*mass/(ma+mass)
        x=2*ma*E*1e-6;mom=math.sqrt(x);eta,H=M(mom/(2*red))
        c=1.23*A**(1/3)-.6;r=math.sqrt(c*c+7*math.pi**2*.52**2/3-5*.9**2)
        F=3*spherical_jn(1,mom*r/p['hc'])/(mom*r/p['hc'])*math.exp(-.5*(mom*.9/p['hc'])**2)
        charge=54**2/E*(H-(E*1e-6/(2*ma)+E*1e-6/mass)*eta)
        mag=0.
        if A in mod['moments']:
            J,muN=mod['moments'][A]
            mag=(J+1)/(3*J)*muN**2*ma/mod['mp']**2*1e-6*eta
        out+=f*F*F*(charge+mag)
    return max(0,out)
rows=[];moment_errors=[]
for name,h in scenarios.items():
    M=Moments(h)
    assert abs(M.normalization-1)<1e-8
    for vm in [100.,400.,700.]:
        x=vm/ckm
        for power,index in [(-1,0),(1,1)]:
            direct=quad(lambda v:float(pdf(v,h))*v**power,x,M.v[-1],points=[a for a in [(h[1]-h[2])/ckm] if x<a<M.v[-1]],epsabs=1e-13)[0]
            moment_errors.append(float(abs(M(x)[index]/direct-1)))
    for mass in [100.,200.,1000.]:
        vm=W/Q+Q/(2*mass*1e9);eta,H=M(vm)
        density=Q*np.maximum(H-(vm*vm-Q*Q/(4*(mass*1e9)**2))*eta,0)*elf
        magnetic=Q**3/(2*me**2)*eta*spin
        ints=[float(simpson(simpson(a,x=w,axis=1),x=q)) for a in [density,magnetic]]
        previous=next(r for r in old['rows'] if r['mass_GeV']==mass)
        factor=previous['D_density_grid_upper']*p['v']/previous['grid_integral_eV3']
        Ddensity,Dspin=[factor*I for I in ints]
        pref=.3/mass*ckm*1e5*p['year']*p['xeatoms']*alpha*1e-12*.3893793721e-27
        counts=[pref*quad(lambda E:xe_shape(E,mass,M),lo,270,epsabs=1e-12)[0] for lo in [5.4,200.]]
        rows.append({'halo':name,'mass_GeV':mass,'Xe_raw_full':counts[0],'Xe_raw_high':counts[1],'Xe_full_over_high':counts[0]/counts[1],'D_density_grid_upper':Ddensity,'D_spin_bubble_grid_upper':Dspin,'density_upper_per_Xe_full':Ddensity/counts[0],'spin_upper_per_Xe_full':Dspin/counts[0],'spin_upper_per_Xe_high':Dspin/counts[1]})
# Independent speed fold of earlier mono-speed Xe implementation at 248 keV.
h=scenarios['central'];M=Moments(h);mass=1000.;E=248.;oldv=p['v']
def direct(v):
    p['v']=v
    return float(pdf(v,h))*v*sum(f*(p['shape'](E,mass,A,a)+mod['magnetic'](E,mass,A,a)) for A,a,f in p['iso'])
breaks=[(h[1]-h[2])/ckm]+[math.sqrt(2*(a*.93149410242-54*.00051099895)*E*1e-6)/(2*mass*(a*.93149410242-54*.00051099895)/(mass+a*.93149410242-54*.00051099895)) for _,a,_ in p['iso']]
folded=quad(direct,1e-12,M.v[-1],points=[x for x in breaks if 1e-12<x<M.v[-1]],epsabs=1e-15)[0]
p['v']=oldv
qm=30000.;wm=30.;mm=1e12;vm=wm/qm+qm/(2*mm)
et,hm=M(vm)
via_moments=hm-(vm*vm-qm*qm/(4*mm*mm))*et
direct_density=quad(lambda v:float(pdf(v,h))/v*(v*v-vm*vm+qm*qm/(4*mm*mm)),vm,M.v[-1],epsabs=1e-15)[0]
checks={'halo_moments_direct_integrals':max(moment_errors)<1e-5,'xenon_direct_speed_fold':math.isclose(folded,xe_shape(E,mass,M),rel_tol=1e-6),'positive_nested_Xe_windows':all(0<r['Xe_raw_high']<r['Xe_raw_full'] for r in rows),'positive_material_components':all(r['D_density_grid_upper']>0 and r['D_spin_bubble_grid_upper']>0 for r in rows)}
checks['density_kernel_direct_speed_fold']=math.isclose(via_moments,direct_density,rel_tol=1e-6)
assert all(checks.values())
out={'checks':checks,'max_moment_relative_error':max(moment_errors),'halo_tuples_km_s':scenarios,'rows':rows,'scope':'Common shifted SHM, same mu=1e-6 GeV^-1 and rho=.3 GeV/cm3. Approximate Xe charge+Helm magnetic; two distinct finite-grid diamond approximations. D<=2N per component only, no full material sum, detector fit or exclusion.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'central':[r for r in rows if r['halo']=='central'],'max_moment_error':max(moment_errors)},indent=2))
