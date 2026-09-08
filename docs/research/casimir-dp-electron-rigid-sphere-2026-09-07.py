import json,math,hashlib
from pathlib import Path
from scipy.integrate import quad
from scipy.special import spherical_jn
base=Path(__file__).parent
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(p.read_text())['leading_design']
source=base/'casimir-dp-electron-contact-cross-check-2026-09-07.json'
W=6*json.loads(source.read_text())['rows'][0]['W_at_reference_24_8_GeV_minus2']
R=c['radius_m']/1.973269804e-16;N=c['mass_kg']/(12*1.66053906660e-27);v=776/299792.458
pref=.003*776e5*c['hold_time_s']*.3893793721e-27/(2*math.pi*v*v)*(N*W/R)**2
r=c['branch_separation_m']/c['radius_m']
def f(x):
 z=r*x;filter=z*z/6 if abs(z)<1e-4 else 1-math.sin(z)/z
 return 9*spherical_jn(1,x)**2/x*filter if x else 0.
L=1000
coarse=sum(quad(f,k,k+1,epsabs=1e-11)[0] for k in range(L))
fine=sum(quad(f,k/2,(k+1)/2,epsabs=1e-12)[0] for k in range(2*L))
assert abs(fine-coarse)<1e-9
tail=9/L**2+12/L**3+4.5/L**4
out=dict(status='rigid_electron_density_smooth_sphere_at_nominal_Xe_reference_not_total_response',
 partial_D=pref*fine,outer_tail_D_bound=pref*tail,loose_full_D_bound=pref*26.5,
 central_phase=2*R*(3*N/(4*math.pi*R**3))*abs(W)/v,
 atom_count=N,source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
 assumptions=['uniform rigid sphere with six electron-density contact amplitudes per carbon atom',
 'coefficient at nominal XENON1T electron-reference count; same speed, density and frozen hold',
 'no internal excitations, microscopic lattice response, nuclear coupling or full detector fit'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
