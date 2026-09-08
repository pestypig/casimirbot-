"""Rebuild each messenger boundary and evolve at fixed effective dark coupling."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-ew-higgs-running-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='e007250c3341497c93af13d1f7b2f078cfaadb2c51c9a2f886fdc17129ee585d'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
d=n['d'];np=n['np'];base=n['n'];q=base['q'];M=n['M'];v=n['v'];low=n['low']
from wilson.util.smeft_warsaw import flavor_rotation
I=np.eye(3);Y=n['Y'];Pu=d['Pu'];keys=base['z']['n']['keys']
gu=5.5700260688158226e-5
def calculate(y,tol=1e-9):
    initial=n['standard'](n['L']);B=y*y*Pu;unit=y**4*Pu/(256*math.pi**2*M*M)
    initial['phiq1']=B/(4*M*M)-17*unit
    initial['phiq3']=-B/(4*M*M)+9*unit
    hard=(-np.einsum('ij,kl->ijkl',B,B)+1.5*(np.einsum('ij,kl->ijkl',B,Y)+np.einsum('ij,kl->ijkl',Y,B)))/(256*math.pi**2*M*M)
    initial['qq1']=hard.copy();initial['qq3']=hard.copy();d['initial']=initial
    _,C=d['run'](keys,tol)
    Cu=flavor_rotation({k:w for k,w in C.items() if k not in d['SM']},n['V'].conj().T,I,I,I,I)
    for k,w in list(Cu.items()):
        if np.asarray(w).shape==():
            assert abs(complex(w).imag)<1e-12*max(abs(complex(w).real),1e-25)
            Cu[k]=float(complex(w).real)
    def finite(amp):
        pos=dict(q['C0']);neg=dict(q['C0'])
        for k,w in Cu.items():pos[k]=amp*w;neg[k]=-amp*w
        tensor=(base['matcher'](pos,base['par'],low)-base['matcher'](neg,base['par'],low))/(2*amp)
        return -q['rotate'](tensor)[1,0,1,0]
    f=finite(100);f2=finite(300)
    assert abs(f-f2)/max(abs(f),1e-25)<1e-5
    h=-(C['qq1']+C['qq3'])[1,0,1,0]+f
    mixing=(y*v/math.sqrt(2))**2/(M*M+(y*v/math.sqrt(2))**2)
    return dict(yL=y,yR_fixed_gu=gu/math.sqrt(mixing),left_mixing_squared=mixing,H_imag_GeV_minus2=float(h.imag))
rows=[]
for y in [.05,.1,.15,.2]:
    r=calculate(y);rows.append(r);print(json.dumps(r),flush=True)
assert abs(rows[-1]['H_imag_GeV_minus2']/2.7745442092905028e-15-1)<1e-7
# Infer the polynomial from endpoints; the two interior full evolutions test it.
matrix=np.array([[r['yL']**2,r['yL']**4] for r in [rows[0],rows[-1]]])
coef=np.linalg.solve(matrix,np.array([r['H_imag_GeV_minus2'] for r in [rows[0],rows[-1]]]))
residual=max(abs((coef[0]*r['yL']**2+coef[1]*r['yL']**4)/r['H_imag_GeV_minus2']-1) for r in rows)
assert residual<1e-7
ledger=p.with_name('casimir-dp-axion-flag24-input-ledger-2026-09-07.json')
assert hashlib.sha256(ledger.read_bytes()).hexdigest()=='0c809ee41ba1b4ac5cf13ed86476fe0fa8efe8be7fc80d6d3ea32aaa235f7d71'
data=json.loads(ledger.read_text());reference=data['conditional_epsilon_NP_magnitude']
for r in rows:
    r['conditional_epsilon_magnitude']=reference*abs(r['H_imag_GeV_minus2']/rows[-1]['H_imag_GeV_minus2'])
    r['fraction_dated_measured_magnitude']=r['conditional_epsilon_magnitude']/.002228
out=dict(scope='Restricted UV boundary; full implemented top-only SM trajectory and linearized VLL matching. Fixed gu preserves tree dark operator only; yR-dependent loops are not held fixed.',gu=gu,rows=rows,H_polynomial_coefficients_y2_y4=coef.tolist(),heldout_polynomial_relative_error=float(residual),ledger_sha256=hashlib.sha256(ledger.read_bytes()).hexdigest(),checks=dict(reference_reproduced=True,interior_evolutions_reproduce_polynomial=True),allowed_region=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
