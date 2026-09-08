"""Helm-consistent extended Yukawa potential and zero-energy audit."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.special import erf,spherical_jn
from scipy.integrate import cumulative_trapezoid,simpson,solve_ivp
from scipy.interpolate import PchipInterpolator
from scipy.optimize import brentq
base=Path(__file__).parent
p=base/'casimir-dp-coupled-attenuation-branches-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='16e728335769bbfa142a873a44d585de38118fb5a686705517d8866246d7e9f1'
alpha=json.loads(p.read_text())['rows'][1]['effective_proton_alpha']*math.sqrt(3.9)
A=131;Z=54;med=.01;hc=.1973269804;mA=A*.93149410242;mu=100*mA/(100+mA)
lam=2*mu*Z*alpha/med
Rfm=math.sqrt((1.23*A**(1/3)-.6)**2+7*math.pi**2*.52**2/3-5*.9**2)
R=Rfm*med/hc;s=.9*med/hc

def build(N):
 x=np.linspace(0,1.5,N);r=x[1:]
 rho=np.empty(N)
 rho[1:]=3/(4*math.pi*R**3)*(.5*(erf((r+R)/(math.sqrt(2)*s))-erf((r-R)/(math.sqrt(2)*s)))+s/(math.sqrt(2*math.pi)*r)*(np.exp(-(r+R)**2/(2*s*s))-np.exp(-(r-R)**2/(2*s*s))))
 rho[0]=3/(4*math.pi*R**3)*(erf(R/(math.sqrt(2)*s))-math.sqrt(2/math.pi)*R/s*math.exp(-R*R/(2*s*s)))
 assert np.min(rho)>-1e-10
 norm=simpson(4*math.pi*x*x*rho,x=x);assert abs(norm-1)<1e-8
 checks=[]
 for q in [1,5,10,20]:
  numeric=simpson(4*math.pi*x*x*rho*np.sinc(q*x/math.pi),x=x)
  analytic=3*spherical_jn(1,q*R)/(q*R)*math.exp(-.5*(q*s)**2)
  assert abs(numeric-analytic)<1e-8
  checks.append(dict(q_over_mmed=q,error=abs(numeric-analytic)))
 a=cumulative_trapezoid(x*rho*np.sinh(x),x,initial=0)
 b=-cumulative_trapezoid((x*rho*np.exp(-x))[::-1],x[::-1],initial=0)[::-1]
 w=np.empty(N);w[0]=4*math.pi*b[0]
 w[1:]=4*math.pi/x[1:]*(np.exp(-x[1:])*a[1:]+np.sinh(x[1:])*b[1:])
 interp=PchipInterpolator(x,w);tail=4*math.pi*a[-1]
 def potential(r):return float(interp(r)) if r<=x[-1] else tail*math.exp(-r)/r
 return potential,norm,checks

def solve(g,pot):
 x=1e-7;w0=pot(0)
 sol=solve_ivp(lambda r,y:[y[1],g*pot(r)*y[0]],(x,60),[x+g*w0*x**3/6,1+g*w0*x*x/2],rtol=1e-10,atol=1e-12)
 assert sol.success
 u,d=sol.y[:,-1];return 60-u/d,d
rows=[]
for N in [12001,24001]:
 pot,norm,checks=build(N)
 result=[]
 for sign in [-1,1]:
  a,_=solve(sign*lam,pot)
  result.append(dict(sign=sign,dimensionless_scattering_length=a,zero_energy_sigma_to_Born=(a/lam)**2))
 root=brentq(lambda g:solve(-g,pot)[1],1.5,1.95)
 rows.append(dict(grid_N=N,charge_norm=norm,form_factor_checks=checks,results=result,pole_strength=root))
for j in range(2):
 assert abs(rows[0]['results'][j]['dimensionless_scattering_length']/rows[1]['results'][j]['dimensionless_scattering_length']-1)<1e-5
assert abs(rows[0]['pole_strength']-rows[1]['pole_strength'])<1e-6
out=dict(status='extended_charge_zero_energy_diagnostic_not_finite_speed_spectrum',A=A,Z=Z,lambda_strength=lam,Helm_R_fm=Rfm,Helm_s_fm=.9,rows=rows,
 checks=['input hash','unit charge integral','four momentum-space Helm matches','potential-grid refinement'],
 limitations=['Xe131 mass-number approximation','zero energy only','no atomic screening or solid response','no finite-speed total or differential cross section','not detector response or exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
