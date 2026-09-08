"""Independent wilson beta-function audit at the aligned boundary, not a fit."""
import os,sys,json,hashlib,math
from pathlib import Path
sys.path.insert(0,str(Path(os.environ['TEMP'])/'casimir-wilson-audit'))
import numpy as np
import wilson
from wilson.util import smeftutil
from wilson.run.smeft.beta import beta
import inspect
p=Path(__file__).with_name('casimir-dp-axion-kaon-box-screen-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='1aefbe35e2c30b93b7be365c5c48289bd375509cb8c2910aeab9a2889d9c3899'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[];gim=[];expansion=[]')[0],str(p),'exec'),n)
V=np.array(n['V0'].tolist(),dtype=complex);Pu=np.outer(V[0].conj(),V[0]);Pt=np.outer(V[2].conj(),V[2])
def blank():return {k:0. if s==1 else np.zeros(s,dtype=complex) for k,s in smeftutil.C_keys_shape.items()}
y=.2;M=2000.;v=246.2;yt=math.sqrt(2)*162.6/v;gs=math.sqrt(4*math.pi*.108)
C=blank();C['phiq1']=y*y*Pu/(4*M*M);C['phiq3']=-C['phiq1'];C['Gu']=V.conj().T@np.diag([0.,0.,yt]);C['gs']=gs
B=beta(C);i,j=1,0
source=(B['qq1']+B['qq3'])[i,j,i,j]/(16*math.pi**2)
expected=y*y*Pu[i,j]*yt*yt*Pt[i,j]/(32*math.pi**2*M*M)
# Independent homogeneous test with Yukawas zero and a symmetric flavor tensor.
Q=blank();Q['gs']=gs
T=(np.einsum('ij,kl->ijkl',Pu,Pt)+np.einsum('ij,kl->ijkl',Pt,Pu))/2
Q['qq1']=T/(M*M);Q['qq3']=T/(M*M)
QB=beta(Q);actual=(QB['qq1']+QB['qq3'])[i,j,i,j];target=4*gs*gs*(Q['qq1']+Q['qq3'])[i,j,i,j]
generated={k:float(np.max(np.abs(val)))/(16*math.pi**2) for k,val in B.items() if k not in ['g','gp','gs','Gu','Gd','Ge','m2','Lambda'] and np.max(np.abs(val))>1e-30}
checks=dict(mixed_source=bool(abs(source/expected-1)<1e-10),VLL_projection=bool(abs(actual/target-1)<1e-10),QCD_top_yukawa=bool(np.max(np.abs(beta(Q|{'Gu':C['Gu']})['Gu']-beta(blank()|{'Gu':C['Gu']})['Gu']+8*gs*gs*C['Gu']))<1e-10))
assert all(checks.values()),checks
out=dict(scope='Boundary differential audit, gaugeless and top-only Yukawa. Generated operators have not yet been evolved or matched to observables.',wilson_version=wilson.__version__,beta_source_sha256=hashlib.sha256(Path(inspect.getfile(beta)).read_bytes()).hexdigest(),source_real=float(source.real),source_imag=float(source.imag),source_over_expected_real=float((source/expected).real),VLL_over_expected_real=float((actual/target).real),generated_beta_max_abs_GeV_minus2_per_log_mu=generated,checks=checks,full_coupled_evolution_completed=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
