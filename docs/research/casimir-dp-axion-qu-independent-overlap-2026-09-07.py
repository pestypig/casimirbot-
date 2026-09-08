"""Common-input qu1/qu8 comparison with independent VddLL matching."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-matching-library-input-audit-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='05a5cf64756a3422f5095a66e967da26ecdf9f82136b72c3f539050cddc5bd66'
d={'__file__':str(p)};exec(compile(p.read_text().split('\nraw=extract(')[0],str(p),'exec'),d)
np=d['np'];raw=d['extract'](False)
p2=p.with_name('casimir-dp-axion-wilson-beta-audit-2026-09-07.py')
assert hashlib.sha256(p2.read_bytes()).hexdigest()=='53fbaa60f2df98415d10614ae447d7ab5a3800494f41890d34260ac02c65f4a6'
b={'__file__':str(p2)};exec(compile(p2.read_text().split('\nC=blank();')[0],str(p2),'exec'),b)
V=b['V'];Pu=b['Pu'];Pt=b['Pt'];v=246.2;mw=80.379;mt=173.;x=(mt/mw)**2;pref=(2*mw/v)**2/(16*math.pi**2)
par=d['smpar'].p.copy();par.update(GF=1/(math.sqrt(2)*v*v),m_W=mw,m_t=mt)
C0=d['smeftutil'].C_array2dict(np.zeros(9999))
def rotate(T):return np.einsum('ai,bj,ck,dl,abcd->ijkl',V.conj(),V,V.conj(),V,T,optimize=True)
rows=[]
amplitude=1e-6  # Algebraic linear-response probe; improves SM-subtraction precision.
for key,factor in [('qu1',-4.),('qu8',-2+2/3)]:
    C={k:np.array(val,copy=True) if isinstance(val,np.ndarray) else val for k,val in C0.items()}
    C[key][0,0,2,2]=amplitude
    for mu in [80.379,173.,300.]:
        tensor=raw(C,par,mu)-raw(C0,par,mu)
        actual=-rotate(tensor)[1,0,1,0]
        I1=x/8*(math.log(mu/mw)-(x-7)/(4*(x-1))-(x*x-2*x+4)*math.log(x)/(2*(x-1)**2))
        expected=pref*Pt[1,0]*factor*amplitude*Pu[1,0]*I1
        ratio=actual/expected
        rows.append(dict(operator=key,scale_GeV=mu,library_H_real=float(actual.real),library_H_imag=float(actual.imag),selected_H_real=float(expected.real),selected_H_imag=float(expected.imag),ratio_real=float(ratio.real),ratio_imag=float(ratio.imag),relative_difference=float(abs(ratio-1))))
# Rotation and Lagrangian/Hamiltonian sign cross-check using a pure qq tree tensor.
T=np.zeros((3,3,3,3),complex);T[0,0,0,0]=1e-9
tree_error=abs((-rotate(T)[1,0,1,0])/(-1e-9*Pu[1,0]**2)-1)
out=dict(scope='Unmodified library loop mass 173 GeV; common v/MW/scale, up-aligned qu probe, all four external indices rotated, SM subtraction and H=-L. Tests only these probes, not full model.',probe_amplitude_GeV_minus2=amplitude,rows=rows,tree_rotation_relative_error=float(tree_error),all_qu_probes_agree=bool(max(r['relative_difference'] for r in rows)<1e-7),full_model_admitted=False)
assert tree_error<1e-12
assert out['all_qu_probes_agree']
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
