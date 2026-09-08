"""Mass/scale diagnostic of the explicit-mt triplet finite remainder."""
import ast,copy,hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-qq-term-decomposition-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='6ab884eb37968479cdb9e202c19a608f74e758235f85a867a401361e09a89000'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nwithmt=make(')[0],str(p),'exec'),n)
np=n['np'];d=n['d'];par=n['par'];C0=n['C0'];rotate=n['rotate']
# Keep only terms containing Cqq3; other coefficients are zero for this probe.
terms=[node for node in n['groups'][True] if any(isinstance(s,ast.Subscript) and isinstance(s.value,ast.Name) and s.value.id=='C' and isinstance(s.slice,ast.Constant) and s.slice.value=='qq3' for s in ast.walk(node))]
f=copy.copy(n['fn']);prefix=copy.deepcopy(n['prefix'])
for s in prefix:
    if isinstance(s,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mt' for t in s.targets):
        assert s.value.value==173
        s.value=ast.Subscript(value=ast.Name(id='par',ctx=ast.Load()),slice=ast.Constant(value='m_t'),ctx=ast.Load())
expr=ast.Constant(value=0)
for term in terms:expr=ast.BinOp(left=expr,op=ast.Add(),right=copy.deepcopy(term))
f.body=prefix+[ast.Return(value=expr)]
module=ast.Module(body=[f],type_ignores=[]);ast.fix_missing_locations(module)
ns=dict(n['raw'].__globals__);exec(compile(module,str(n['source']),'exec'),ns);probe=ns[f.name]
C={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in C0.items()};amp=1e-6
C['qq3'][0,0,2,2]=C['qq3'][2,2,0,0]=amp/2
normalizer=d['pref']*amp*d['Pt'][1,0]*d['d']['Pu'][1,0]
rows=[]
for mt in [120.,162.6,173.,207.,250.,400.,600.,1000.]:
    pars=dict(par,m_t=mt);d['x']=(mt/d['mw'])**2
    for mu in [80.379,173.,300.]:
        h=-rotate(probe(C,pars,mu))[1,0,1,0];s=d['selected'](C,mu);r=(h-s)/normalizer
        candidate=2*d['x']*math.log(d['x'])/(d['x']-1)
        rows.append(dict(mt_GeV=mt,scale_GeV=mu,remainder_imag_GeV_minus2=float((h-s).imag),normalized_real=float(r.real),normalized_imag=float(r.imag),normalized_over_x=float(r.real/d['x']),candidate_2xlogx_over_xminus1=candidate,candidate_relative_error=float(abs(r/candidate-1))))
scale_errors=[max(abs(complex(r['normalized_real'],r['normalized_imag'])-complex(base['normalized_real'],base['normalized_imag'])) for r in rows if r['mt_GeV']==base['mt_GeV']) for base in rows[::3]]
checks=dict(scale_independence=bool(max(scale_errors)<1e-6),phase_alignment=bool(max(abs(r['normalized_imag']) for r in rows)<1e-6),candidate_function=bool(max(r['candidate_relative_error'] for r in rows)<1e-8))
assert all(checks.values())
out=dict(scope='Only library explicit-mt additive Cqq3 terms, isolated in-memory configurable mt; not pole/MS conversion or gauge-invariant sector. Symmetric mixed probe only.',retained_terms=len(terms),rows=rows,checks=checks,qq_overlap_established=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(dict(retained_terms=len(terms),rows=[r for r in rows if r['scale_GeV']==173.],checks=checks),indent=2))
