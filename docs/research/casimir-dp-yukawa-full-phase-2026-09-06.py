"""Rigid-sphere coherence with full eikonal phase difference; isotropic shell."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.special import i0,k0
from scipy.interpolate import PchipInterpolator
from numpy.polynomial.legendre import leggauss
base=Path('docs/research')
parent_path=base/'casimir-dp-shared-yukawa-screen-2026-09-06.json'
parent=json.loads(parent_path.read_text())
cfg_path=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
cfg=json.loads(cfg_path.read_text()); d=cfg['leading_design']; model=parent['model']
assert hashlib.sha256(cfg_path.read_bytes()).hexdigest()==parent['config_sha256']
R=d['radius_m']/1.973269804e-16
separation=d['branch_separation_m']/d['radius_m']
v=model['speed_kms']/299792.458; A=model['object_effective_nucleon_count']
flux=model['rho_GeV_cm3']/model['mchi_GeV']*model['speed_kms']*1e5
factor=flux*d['hold_time_s']*(d['radius_m']*100)**2

class Profile:
    def __init__(self,mediator,order=96,points=1601):
        self.a=mediator*1e-9*R
        a=self.a
        x,w=leggauss(order); x=(x+1)/2;w=w/2
        b=np.linspace(0,1,points)
        u=b[:,None]*x[None,:]
        first=b*np.sum(w*u*np.sqrt(np.maximum(0,1-u*u))*i0(a*u),axis=1)
        u=b[:,None]+(1-b[:,None])*x[None,:]
        second=(1-b)*np.sum(w*u*np.sqrt(np.maximum(0,1-u*u))*k0(a*u),axis=1)
        values=i0(a*b)*second
        values[1:]+=k0(a*b[1:])*first[1:]
        self.interpolator=PchipInterpolator(b,6*A/v*values)
        if a<.1: H=1+a*a/10+a**4/280+a**6/15120
        else:H=3*(a*math.cosh(a)-math.sinh(a))/a**3
        self.outer=2*A/v*H
    def __call__(self,b):
        b=np.asarray(b); out=np.empty_like(b,dtype=float); inside=b<1
        out[inside]=self.interpolator(b[inside])
        out[~inside]=self.outer*k0(self.a*b[~inside])
        return out

def integrate(profile,alpha,nr=2401,nphi=128,nmu=24,tail=20,sep=separation):
    r=np.concatenate(([0.],np.geomspace(1e-5,max(3.,tail/profile.a+2),nr)))
    phi=(np.arange(nphi)+.5)*2*np.pi/nphi
    mu,w=leggauss(nmu); mu=(mu+1)/2;w=w/2
    reference=profile(r)[:,None]
    quadratic=np.zeros(len(r)); exact=np.zeros(len(r))
    for cos_theta,weight in zip(mu,w):
        s=sep*math.sqrt(1-cos_theta*cos_theta)
        shifted=np.sqrt(np.maximum(0,r[:,None]**2+s*s-2*r[:,None]*s*np.cos(phi)))
        phase=alpha*(reference-profile(shifted))
        exact+=weight*np.mean(2*np.sin(phase/2)**2,axis=1)
        quadratic+=weight*np.mean(phase*phase/2,axis=1)
    return {'D_full':float(factor*2*np.pi*np.trapezoid(r*exact,r)),
            'D_quadratic':float(factor*2*np.pi*np.trapezoid(r*quadratic,r))}

rows=[]
for p in parent['rows'][:5]:
    profile=Profile(p['mediator_eV'])
    alpha=p['alpha_for_DP_comparator_exponent']
    low=integrate(profile,alpha)
    high=integrate(profile,alpha,nr=4801,nphi=256,nmu=48)
    born=p['K_D_soft_per_alpha2']*alpha*alpha
    rows.append({'mediator_eV':p['mediator_eV'],'alpha':alpha,**high,
        'visibility_loss':-math.expm1(-high['D_full']),
        'D_Born_parent_soft':born,'full_to_Born_ratio':high['D_full']/born,
        'weak_kernel_relative_difference':abs(high['D_quadratic']/born-1),
        'grid_refinement_relative_difference':abs(low['D_full']/high['D_full']-1)})
    print(json.dumps(rows[-1]),flush=True)

# Check independent weak momentum-space kernel, zero separation and profile continuity.
profile=Profile(.1)
weak=integrate(profile,1e-18,nr=2401,nphi=128,nmu=24)
tail_test=integrate(Profile(.001),rows[0]['alpha'],nr=4801,nphi=256,nmu=48,tail=30)
checks={
 'weak_phase_recovers_quadratic':abs(weak['D_full']/weak['D_quadratic']-1)<1e-8,
 'momentum_Born_kernel_recovered':all(r['weak_kernel_relative_difference']<.003 for r in rows),
 'full_phase_below_quadratic':all(0<r['D_full']<=r['D_quadratic'] for r in rows),
 'grid_refinement_below_half_percent':all(r['grid_refinement_relative_difference']<.005 for r in rows),
 'tail_extension_stable':abs(tail_test['D_full']/rows[0]['D_full']-1)<.002,
 'coincident_branches_zero':integrate(profile,1e-12,nr=101,nphi=16,nmu=8,sep=0)['D_full']<1e-25,
 'profile_boundary_continuity':abs(float(profile(np.array([1-1e-8]))[0]/profile(np.array([1+1e-8]))[0])-1)<1e-6,
}
assert all(checks.values()),checks
out={'evidence_class':'full_phase_rigid_elastic_eikonal_coherence_not_complete_model',
 'parent_sha256':hashlib.sha256(parent_path.read_bytes()).hexdigest(),'config_sha256':parent['config_sha256'],
 'rows':rows,'checks':checks,'profile_quadrature_order':96,'profile_nodes':1601,
 'fine_grid':{'radial_log_nodes':4801,'azimuth_nodes':256,'incident_cosine_nodes':48,'tail_mediator_lengths':20},
 'assumptions':['same 1-TeV isotropic 776-km/s population as Born parent',
   'real uniform Yukawa potential, rigid elastic sphere, straight trajectories',
   'transverse branch separation d*sin(theta); longitudinal transfer neglected at small angle',
   'no environmental transport, additional material, lattice or detector-response model'],
 'limitations':['fixed old comparator-inverted couplings are not fits',
   'numerical convergence does not bound physical eikonal or target errors',
   'coherence prediction alone does not establish xenon compatibility']}
(base/'casimir-dp-yukawa-full-phase-2026-09-06.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(checks),flush=True)
