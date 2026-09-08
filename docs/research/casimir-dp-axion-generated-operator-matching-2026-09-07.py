"""Inventory and linearized VddLL response of generated SMEFT operators."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-ew-higgs-running-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='e007250c3341497c93af13d1f7b2f078cfaadb2c51c9a2f886fdc17129ee585d'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
d=n['d'];np=n['np'];V=n['V'];low=n['low'];base=n['n']
summary,C=d['run'](base['z']['n']['keys'],1e-9)
from wilson.util.smeft_warsaw import flavor_rotation
I=np.eye(3);Cu=flavor_rotation({k:v for k,v in C.items() if k not in d['SM']},V.conj().T,I,I,I,I)
scalar_imaginary_max=0.
for k,value in list(Cu.items()):
    if np.asarray(value).shape==():
        scalar_imaginary_max=max(scalar_imaginary_max,abs(complex(value).imag))
        assert abs(complex(value).imag)<1e-12*max(abs(complex(value).real),1e-25)
        Cu[k]=float(complex(value).real)  # Hermitian scalar coefficients; checked roundoff only.
q=base['q'];C0=q['C0'];matcher=base['matcher'];par=base['par']
known={'phiq1','phiq3','qq1','qq3','qu1','qu8'}
active=[k for k in Cu if np.max(np.abs(Cu[k]))>1e-25]
generated=[k for k in active if k not in known]
def response(keys,amp):
    pos={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in C0.items()}
    neg={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in C0.items()}
    for k in keys:pos[k]=amp*Cu[k];neg[k]=-amp*Cu[k]
    tensor=(matcher(pos,par,low)-matcher(neg,par,low))/(2*amp)
    return -q['rotate'](tensor)[1,0,1,0]
rows=[]
for key in generated:
    h=response([key],100.)
    rows.append(dict(operator=key,max_coefficient_GeV_minus2=float(np.max(np.abs(Cu[key]))),VLL_real=float(h.real),VLL_imag=float(h.imag)))
total=response(generated,100.);tight=response(generated,300.);sumh=sum(complex(r['VLL_real'],r['VLL_imag']) for r in rows)
allh=response(active,100.);allcheck=response(active,300.)
tree=-(C['qq1']+C['qq3'])[1,0,1,0]
checks=dict(qq_rotation=bool(np.max(np.abs(Cu['qq3']-base['up'](C['qq3'])))/np.max(np.abs(Cu['qq3']))<1e-12),generated_linearity=bool(abs(total-sumh)/max(abs(total),1e-25)<1e-5),generated_amplification=bool(abs(total-tight)/max(abs(total),1e-25)<1e-5),all_amplification=bool(abs(allh-allcheck)/max(abs(allh),1e-25)<1e-5))
assert all(checks.values())
out=dict(scope='Linearized library finite VddLL response only, mt configured to162.6; all active non-SM coefficients rotated with Uq=Vdagger, other flavor rotations identity. Tree VLL qq term included once for reported partial total. Other LEFT chiralities and complete input/UV matching not established.',active_count=len(active),generated_count=len(generated),rows=sorted(rows,key=lambda r:abs(r['VLL_imag']),reverse=True),generated_total=dict(real=total.real,imag=total.imag),all_finite=dict(real=allh.real,imag=allh.imag),tree_plus_all_VLL_imag_GeV_minus2=float((tree+allh).imag),previous_partial_VLL_imag_GeV_minus2=2.7745106895407824e-15,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(dict(active_count=len(active),generated_count=len(generated),top=out['rows'][:7],generated_total=out['generated_total'],partial=out['tree_plus_all_VLL_imag_GeV_minus2'],checks=checks),indent=2))
