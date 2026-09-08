"""Zero-energy point-Yukawa sign audit; not finite-speed nuclear response."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import solve_ivp
from scipy.optimize import brentq
p=Path(__file__).with_name('casimir-dp-coupled-attenuation-branches-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='16e728335769bbfa142a873a44d585de38118fb5a686705517d8866246d7e9f1'
alpha=json.loads(p.read_text())['rows'][1]['effective_proton_alpha']*math.sqrt(3.9)
def solve(g,end=60,tol=1e-10):
 x=1e-7
 s=solve_ivp(lambda x,y:[y[1],g*math.exp(-x)/x*y[0]],(x,end),[x+g*x*x/2,1+g*x],rtol=tol,atol=tol*.01)
 assert s.success
 u,d=s.y[:,-1]
 return end-u/d,d
rows=[]
for A,Z in [(12,6),(16,8),(28,14),(131,54)]:
 mu=100*A*.93149410242/(100+A*.93149410242);lam=2*mu*Z*alpha/.01
 for sign in [-1,1]:
  a,_=solve(sign*lam);a2,_=solve(sign*lam,80,1e-11)
  assert abs(a-a2)<1e-6*max(1,abs(a))
  rows.append(dict(A=A,Z=Z,lambda_strength=lam,sign=sign,dimensionless_scattering_length=a,zero_energy_sigma_to_Born=(a/lam)**2,convergence_absolute=abs(a-a2)))
for sign in [-1,1]:
 a,_=solve(sign*1e-4)
 assert abs(a/(sign*1e-4)-1)<1e-3
root=brentq(lambda lam:solve(-lam)[1],1.5,1.9)
out=dict(status='exploratory_point_potential_zero_energy_diagnostic',effective_proton_alpha=alpha,
 equation='u_xx = sign*lambda*exp(-x)/x*u; x=m_med*r; a*m_med=x-u/u_x',
 potential='V=sign*Z*alpha_p*exp(-m_med*r)/r',rows=rows,
 attractive_s_wave_zero_energy_pole_strength=root,
 checks=['source hash','weak-coupling Born recovery both signs','radial endpoint and tolerance convergence'],
 limitations=['point nuclei, no extended charge profile or atomic screening','zero energy only, not LZ finite-speed correction',
 'not full diamond or captured-population calculation','no exclusion or bound-state formation rate'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(root)
