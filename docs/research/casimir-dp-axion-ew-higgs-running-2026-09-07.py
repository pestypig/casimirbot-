"""One-loop top-only SM trajectory with electroweak/Higgs inputs."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-full-qq-matching-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='d440e1dcfa73de64954d574d40c29b8d3a77413dbae585dd390af710fc01dae9'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
d=n['d'];np=n['np'];V=n['V'];v=d['v'];L=d['L'];low=d['low'];M=d['M'];mw=n['q']['mw']
from scipy.integrate import solve_ivp
g=2*mw/v;e=math.sqrt(4*math.pi*n['par']['alpha_e']);gp=e*g/math.sqrt(g*g-e*e)
initial_sm=np.array([g,gp,math.sqrt(4*math.pi*d['a']),d['yt0'],125.**2/v**2,125.**2/2])
def rhs(t,w):
    g,gp,gs,y,lam,m2=w
    return np.array([-19*g**3/6,41*gp**3/6,-7*gs**3,y*(4.5*y*y-2.25*g*g-17*gp*gp/12-8*gs*gs),12*lam*lam+.75*gp**4+1.5*g*g*gp*gp+2.25*g**4-3*(gp*gp+3*g*g)*lam+12*lam*y*y-12*y**4,m2*(6*lam-4.5*g*g-1.5*gp*gp+6*y*y)])/(16*math.pi**2)
sol=solve_ivp(rhs,[0,L],initial_sm,rtol=1e-11,atol=1e-12,dense_output=True,method='DOP853');assert sol.success
def standard(t):
    C=d['blank']();g,gp,gs,y,lam,m2=sol.sol(t)
    C.update(g=g,gp=gp,gs=gs,Lambda=lam,m2=m2)
    C['Gu']=V.conj().T@np.diag([0.,0.,y]);return C
errors=[]
for t in np.linspace(0,L,5):
    C=standard(t);b=d['beta'](C);expected=rhs(t,sol.sol(t));actual=np.array([b['g'],b['gp'],b['gs'],np.trace(V@b['Gu']),b['Lambda'],b['m2']],complex)/(16*math.pi**2)
    errors.append(float(np.max(np.abs(actual-expected)/np.maximum(abs(expected),1e-15))))
d['standard']=standard
B=d['B'];high=standard(L);Y=high['Gu']@high['Gu'].conj().T
hard=-np.einsum('ij,kl->ijkl',B,B)/(256*math.pi**2*M*M)+1.5*(np.einsum('ij,kl->ijkl',B,Y)+np.einsum('ij,kl->ijkl',Y,B))/(256*math.pi**2*M*M)
d['initial']['qq1']=hard.copy();d['initial']['qq3']=hard.copy()
rows=[]
for tol in [1e-7,1e-9]:
    summary,C=d['run'](n['z']['n']['keys'],tol);n['C']=C
    broad,_=n['response'](['qq1','qq3'],1e4)
    x=(low/mw)**2;I1=x/8*(math.log(low/mw)-(x-7)/(4*(x-1))-(x*x-2*x+4)*math.log(x)/(2*(x-1)**2))
    qu=n['q']['pref']*d['Pt'][1,0]*((-2+2/3)*C['qu8'][1,0,2,2]-4*C['qu1'][1,0,2,2])*I1
    h=summary['H_imag_GeV_minus2']+qu.imag+broad.imag
    rows.append(dict(rtol=tol,partial_H_imag_GeV_minus2=float(h),phiq1_11_real=float(C['phiq1'][0,0].real)))
checks=dict(SM_beta_agreement=bool(max(errors)<1e-10),coefficient_tolerance=bool(abs(rows[0]['partial_H_imag_GeV_minus2']/rows[1]['partial_H_imag_GeV_minus2']-1)<1e-8))
assert all(checks.values())
out=dict(scope='Top-only SM Yukawa approximation, full one-loop g/gp/gs/yt/Lambda/m2 trajectory. Tree-derived diagnostic EW/Higgs inputs, no finite input-scheme conversion. UV boundary remains restricted; finite matching still current/qu selected plus broad qq only.',SM_order=['g','gp','gs','yt','Lambda','m2_GeV2'],SM_low=initial_sm.tolist(),SM_high=sol.y[:,-1].tolist(),beta_max_relative_error=max(errors),rows=rows,previous_top_QCD_partial=2.716798183957349e-15,fractional_partial_change=rows[-1]['partial_H_imag_GeV_minus2']/2.716798183957349e-15-1,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
