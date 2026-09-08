"""Broader qq finite matching on full frozen evolved tensors; partial total only."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-candidate-tensor-membership-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='ba05ea517f55dcaf69b7db25e0a598443b58a8901e7829e8c89e9092d4e1c2f7'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nT=np.diag(')[0],str(p),'exec'),n)
d=n['d'];z=n['z'];np=n['np'];V=n['V'];low=d['low']
summary,C=d['run'](z['n']['keys'],1e-9)
p2=p.with_name('casimir-dp-axion-current-qq-independent-overlap-2026-09-07.py')
assert hashlib.sha256(p2.read_bytes()).hexdigest()=='65aa215d256e235657431cbc63f183bd7cc8634a49307683de3208aecf7bbeba'
q={'__file__':str(p2)};exec(compile(p2.read_text().split('\nrows=[]')[0],str(p2),'exec'),q)
q['x']=(low/q['mw'])**2;par=dict(q['par'],m_t=low,alpha_s=d['a']);matcher=q['d']['d']['extract'](True)
def up(t):return np.einsum('ai,bj,ck,dl,ijkl->abcd',V,V.conj(),V,V.conj(),t,optimize=True)
def response(keys,amplification):
    cc={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in q['C0'].items()}
    for key in keys:cc[key]=up(C[key])*amplification
    tensor=(matcher(cc,par,low)-matcher(q['C0'],par,low))/amplification
    broad=-q['rotate'](tensor)[1,0,1,0]
    selected=q['selected'](cc,low)/amplification
    return broad,selected
rows=[]
for keys in [['qq1'],['qq3'],['qq1','qq3']]:
    broad,selected=response(keys,1e4);tight,_=response(keys,1e5)
    rows.append(dict(operators=keys,broad_real=float(broad.real),broad_imag=float(broad.imag),selected_real=float(selected.real),selected_imag=float(selected.imag),difference_real=float((broad-selected).real),difference_imag=float((broad-selected).imag),amplification_relative_difference=float(abs(broad-tight)/max(abs(broad),1e-30))))
linear=abs(complex(rows[0]['broad_real'],rows[0]['broad_imag'])+complex(rows[1]['broad_real'],rows[1]['broad_imag'])-complex(rows[2]['broad_real'],rows[2]['broad_imag']))
x=q['x'];mw=q['mw'];Pt=q['Pt']
I1=x/8*(math.log(low/mw)-(x-7)/(4*(x-1))-(x*x-2*x+4)*math.log(x)/(2*(x-1)**2))
qu=q['pref']*Pt[1,0]*((-2+2/3)*C['qu8'][1,0,2,2]-4*C['qu1'][1,0,2,2])*I1
old=summary['H_imag_GeV_minus2']+qu.imag+rows[-1]['selected_imag']
updated=old+rows[-1]['difference_imag']
checks=dict(amplification_stability=bool(max(r['amplification_relative_difference'] for r in rows)<1e-7),operator_linearity=bool(linear/max(abs(complex(rows[-1]['broad_real'],rows[-1]['broad_imag'])),1e-30)<1e-7),previous_selected_reproduced=bool(abs(old/2.7377230375606335e-15-1)<1e-8))
assert all(checks.values())
out=dict(scope='Full qq1/qq3 VddLL finite expression, with loop mt configured in memory to 162.6; current/qu pieces remain selected. Frozen restricted UV boundary and top-self/QCD running. Not complete EW prediction or observable.',matching_parameters={k:float(par[k]) for k in ['m_t','m_W','GF','alpha_s','alpha_e']},rows=rows,previous_selected_imag_GeV_minus2=float(old),with_broader_qq_imag_GeV_minus2=float(updated),fractional_total_change=float(updated/old-1),checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
