"""Complete CP-even renormalizable scalar-potential input map, at tree order."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
parent=base/'casimir-dp-axion-potential-closure-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='44f6aa06188a196acba3554dffc5d4bcc817f29c1ff80aedc4d524968852a3ac'
r=next(z for z in json.loads(parent.read_text())['rows'] if z['lambda_PhiH']==.03)
v,f,mh,mr,ma=246.2,294.,125.,1000.,1.
c,s=math.cos(r['theta']),math.sin(r['theta'])
HH=mh*mh*c*c+mr*mr*s*s;SS=mh*mh*s*s+mr*mr*c*c;HS=(mr*mr-mh*mh)*s*c
names=['muH2','lambdaH','t','mS2','mA2','muS','muSA','lambdaS','lambdaSA','lambdaA','muHS','lambdaHS','lambdaHA']
free=dict(muS=0.,muSA=0.,lambdaS=r['lambda_Phi'],lambdaSA=r['lambda_Phi'],lambdaA=r['lambda_Phi'],lambdaHS=.03,lambdaHA=.03)
def solve(z):
    p=dict(z)
    p['lambdaH']=HH/(2*v*v)
    p['muHS']=HS/v-p['lambdaHS']*f
    p['muH2']=p['lambdaH']*v*v+p['muHS']*f+p['lambdaHS']*f*f/2
    p['mS2']=SS-2*p['muS']*f-3*p['lambdaS']*f*f-p['lambdaHS']*v*v/2
    p['t']=-p['mS2']*f-p['muS']*f*f-p['lambdaS']*f**3-p['muHS']*v*v/2-p['lambdaHS']*f*v*v/2
    p['mA2']=ma*ma-p['muSA']*f-p['lambdaSA']*f*f-p['lambdaHA']*v*v/2
    return p
def obs(p):
    return np.array([
      -p['muH2']+p['lambdaH']*v*v+p['muHS']*f+p['lambdaHS']*f*f/2,
      p['t']+p['mS2']*f+p['muS']*f*f+p['lambdaS']*f**3+p['muHS']*v*v/2+p['lambdaHS']*f*v*v/2,
      -p['muH2']+3*p['lambdaH']*v*v+p['muHS']*f+p['lambdaHS']*f*f/2,
      p['mS2']+2*p['muS']*f+3*p['lambdaS']*f*f+p['lambdaHS']*v*v/2,
      v*(p['muHS']+p['lambdaHS']*f),
      p['mA2']+p['muSA']*f+p['lambdaSA']*f*f+p['lambdaHA']*v*v/2])
zero={k:0. for k in names}
J=np.column_stack([obs(dict(zero,**{k:1.})) for k in names])
Jn=J/np.linalg.norm(J,axis=1)[:,None]
monomials=[(x,ss,a) for x in range(3) for ss in range(5) for a in range(0,5,2) if 0<2*x+ss+a<=4]
expected={(1,0,0),(2,0,0),(0,1,0),(0,2,0),(0,0,2),(0,3,0),(0,1,2),(0,4,0),(0,2,2),(0,0,4),(1,1,0),(1,2,0),(1,0,2)}
p=solve(free);target=np.array([0.,0.,HH,SS,HS,ma*ma]);scale=np.array([v*v,f*mr*mr,mr*mr,mr*mr,mr*mr,1.])
errors=[];rng=np.random.default_rng(2907)
for i in range(21):
    z=free if i==0 else {k:val+float(rng.normal())*.001 for k,val in free.items()}
    errors.append(float(np.max(np.abs((obs(solve(z))-target)/scale))))
checks=dict(complete_nonderivative_monomials=set(monomials)==expected and len(monomials)==13,
    vacuum_mass_map_rank_six=int(np.linalg.matrix_rank(Jn))==6,
    seven_free_inputs_close_tree_map=max(errors)<1e-9,
    minimal_reference_recovery=abs(p['muH2']-r['muH_squared_GeV2'])<1e-8 and abs(p['mS2']+r['muPhi_squared_GeV2'])<1e-8 and abs(p['mA2']-p['mS2'])<1e-8 and abs(p['t']+math.sqrt(2)*r['soft_mu_cubed_GeV3'])<1e-6)
checks={k:bool(z) for k,z in checks.items()};assert all(checks.values()),checks
out=dict(scope='Complete CP/gauge-invariant nonderivative scalar potential for one Higgs doublet and one complex singlet, dimension <=4, modulo constant, with fixed field origin. Tree input reconstruction only.',
    checks=checks,reference_scale_GeV=2000.,field_convention='Cartesian, canonical renormalized fields; fixed S vacuum f=294 GeV',
    seven_MSbar_boundary_assumptions=free,tree_reconstructed_coefficients=p,
    max_scaled_reconstruction_error=max(errors),loop_counterterms_evaluated=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
