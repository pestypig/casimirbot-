"""Isolated qu matching term; not complete electroweak or UV matching."""
import ast, hashlib, json, math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-coupled-flow-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='4ffd5264b811f086dda1cf609e78b39e33817a8a2cd919fc7df66d1a559cb5da'
tree=ast.parse(p.read_text().split('\nrestricted=run(')[0])
# Expose the final tensor without changing or running the archived output driver.
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='run')
assert isinstance(fn.body[-1],ast.Return)
fn.body[-1].value=ast.Tuple(elts=[fn.body[-1].value,ast.Name(id='C',ctx=ast.Load())],ctx=ast.Load())
ast.fix_missing_locations(tree)
d={'__file__':str(p)};exec(compile(tree,str(p),'exec'),d)
np=d['np'];Pt=d['Pt'];low=d['low'];v=d['v'];mw=80.379;x=(low/mw)**2
H1=math.log(low/mw)-(x-7)/(4*(x-1))-(x*x-2*x+4)*math.log(x)/(2*(x-1)**2)
I1=x*H1/8
# alpha/(4*pi*sin(theta_W)^2) = g2^2/(16*pi^2), with g2=2 MW/v.
pref=(2*mw/v)**2/(16*math.pi**2)
keys=[k for k in d['initial'] if k not in d['SM']]
def evaluate(tol):
    summary,C=d['run'](keys,tol);i,j=1,0
    singlet=pref*Pt[i,j]*(-4*C['qu1'][i,j,2,2])*I1
    octet=pref*Pt[i,j]*(-2+2/3)*C['qu8'][i,j,2,2]*I1
    shift=singlet+octet;base=summary['H_imag_GeV_minus2']
    return dict(rtol=tol,previous_projection_imag=base,singlet_imag=float(singlet.imag),octet_imag=float(octet.imag),shift_imag=float(shift.imag),partial_updated_imag=float(base+shift.imag),fractional_shift=float(shift.imag/base))
rows=[evaluate(1e-7),evaluate(1e-9)]
# Independently compare the old current normalization with Eq. 2.24's I1 term.
current_pref_old=mw**2*x/(8*math.pi**2*v*v)*H1
current_pref_new=pref*4*I1
checks=dict(current_normalization=bool(abs(current_pref_new/current_pref_old-1)<1e-12),tolerance_stability=bool(abs(rows[0]['shift_imag']/rows[1]['shift_imag']-1)<1e-5))
assert all(checks.values())
out=dict(source='https://arxiv.org/pdf/1811.04961 (v2), Eq. 2.24 first bracket and Eq. 2.28',scope='Only generated qu1/qu8 finite matching added to previous selected projection. qq J/K matching, full UV boundary, full SM running, QCD below weak scale and observable conversion remain incomplete.',convention='Down-type q basis; right-handed up basis diagonal; i=1,j=0, top index=2; dimensionful Hamiltonian coefficient in GeV^-2.',I1=I1,rows=rows,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
