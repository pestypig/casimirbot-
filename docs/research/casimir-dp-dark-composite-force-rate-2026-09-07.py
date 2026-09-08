"""Two-target conditional Born screen; no LZ likelihood or allowed model."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

base = Path('docs/research')
source = base/'casimir-dp-shared-yukawa-screen-2026-09-06.py'
force = base/'casimir-dp-yukawa-force-screen-2026-09-06.json'
assert hashlib.sha256(source.read_bytes()).hexdigest() == '8dbd1f7f6aa92119675d53f335e7186d880ddce9bca94cc5f489cc0277864df6'
assert hashlib.sha256(force.read_bytes()).hexdigest() == '8d9c3bb9f1adf98b246cbe094bf4fcad6777644fc85f627af640700dcb4a50f4'
n = {}
exec(compile(source.read_text(encoding='utf-8').split('\nrows=[]')[0], str(source), 'exec'), n)
config = n['config']
assert hashlib.sha256(config.read_bytes()).hexdigest() == '5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
N, mean_mass = 1e4, 10.
mass = N*mean_mass
rd = (9*math.pi*mass/(4*mean_mass**4))**(1/3)
# Update globals used by inherited kernels; monochromatic shell unchanged.
n['mchi'] = mass
n['flux'] = n['rho']/mass*n['v_kms']*1e5
n['mu'] = mass*n['mxe']/(mass+n['mxe'])
n['Emax'] = 2*n['mu']**2*n['v']**2/n['mxe']
f = n['form']

def local(mediator, cutoff):
    a = mediator*n['R']
    def fun(logx):
        x = math.exp(logx)
        return (2*x*x/(x*x+a*a)**2*f(x)**2
                *f(x*rd/n['R'])**2*n['loss_filter'](x*n['dR']))
    val = quad(fun, math.log(min(a,1)*1e-7), math.log(cutoff),
               epsabs=0, epsrel=2e-8, limit=600)[0]
    return 4*math.pi*n['charge']**2/n['v']**2*n['R']**2*val*n['GeV2_cm2']*n['flux']*n['hold']

def xenon(mediator, lo, hi):
    hi = min(hi, n['Emax'])
    if hi <= lo: return 0.
    val = quad(lambda e:n['dsigma_dE'](e, mediator)*f(math.sqrt(2*n['mxe']*e)*rd)**2,
               lo, hi, epsabs=0, epsrel=2e-9, limit=500)[0]
    return val*n['GeV2_cm2']*n['flux']*n['Nxe']*n['year']

rows = []
for r in json.loads(force.read_text())['rows']:
    mediator = r['mediator_eV']*1e-9
    # Source product assumes g_dark=sqrt(4*pi); infer ordinary g_N.
    gn = r['maximum_product_at_alpha_DM_one']*math.sqrt(4*math.pi)
    kd = local(mediator, 80)
    assert abs(kd/n['local_kernel'](mediator)-1) < 1e-10
    for gd in [.01, N**(-1/3)]:
        alpha = N*gd*gn/(4*math.pi)
        d = kd*alpha**2
        rows.append(dict(mediator_eV=r['mediator_eV'], constituent_g=gd,
            screening_scale_ratio=gd*N**(1/3), ordinary_g=gn,
            nugget_nucleon_alpha=alpha, D_quadratic_interval=d,
            visibility_loss_quadratic=-math.expm1(-d),
            raw_Xe_5p4to269p9=xenon(mediator,5.4e-6,269.9e-6)*alpha**2,
            raw_Xe_200to269p9=xenon(mediator,200e-6,269.9e-6)*alpha**2,
            point_nugget_central_phase=n['central_eikonal_per_alpha'](mediator)*alpha,
            local_cutoff40to80_relative=abs(kd-local(mediator,40))/kd,
            comparator_over_quadratic=n['cfg']['frozen_diosi']['gaussian_exponent_at_hold']/d))
out = dict(status='conditional Born scale screen; not an accepted event count or allowed point',
    N=N, mean_constituent_mass_GeV=mean_mass, mass_GeV=mass, radius_m=rd*n['hbc_GeVm'],
    rho_GeV_cm3=n['rho'], speed_kms=n['v_kms'], flux_cm2_s=n['flux'],
    assumptions=['uniform mean xenon nucleus, not isotope Helm response',
        'isotropic monochromatic incident shell', 'rigid uniform sphere, qR up to 80',
        'one unscreened isoscalar scalar; external conservative ordinary-force ceilings',
        'screening-scale endpoint is marginal, not controlled unscreened point',
        'self-interaction, formation, transport and detector response not yet admitted'], rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
