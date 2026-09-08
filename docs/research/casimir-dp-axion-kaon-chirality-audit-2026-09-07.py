"""Tree and finite Delta-S=2 JMS chirality audit in top-only approximation."""
import ast,copy,hashlib,json
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-generated-operator-matching-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='201d83857993d014dec8414954fdcd0dd84360b721434f9ac3a036422def1b04'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),n)
np=n['np'];V=n['V'];low=n['low'];Cu=n['Cu'];C0=n['C0']
from wilson.match import smeft_tree,smeft_loop
keys=['VddLL','VddRR','V1ddLR','V8ddLR','S1ddRR','S8ddRR']
def extract(module,sha,loop):
    path=Path(module.__file__);assert hashlib.sha256(path.read_bytes()).hexdigest()==sha
    root=ast.parse(path.read_text());fn=next(f for f in root.body if isinstance(f,ast.FunctionDef) and f.name=='_match_all_array')
    prefix=[]
    for node in fn.body:
        prefix.append(node)
        if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='c' for t in node.targets):break
    if loop:
        for node in prefix:
            if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mt' for t in node.targets):node.value=ast.Subscript(value=ast.Name(id='par',ctx=ast.Load()),slice=ast.Constant(value='m_t'),ctx=ast.Load())
    selected=[]
    for key in keys:
        matches=[node for node in fn.body if isinstance(node,ast.Assign) and any(isinstance(t,ast.Subscript) and isinstance(t.value,ast.Name) and t.value.id=='c' and isinstance(t.slice,ast.Constant) and t.slice.value==key for t in node.targets)]
        assert len(matches)==1;selected+=matches
    fn.body=prefix+selected+[ast.Return(value=ast.Name(id='c',ctx=ast.Load()))]
    root=ast.Module(body=[fn],type_ignores=[]);ast.fix_missing_locations(root)
    ns=dict(module.__dict__);exec(compile(root,str(path),'exec'),ns);return ns[fn.name]
tree=extract(smeft_tree,'709b4ec92c166f4ceba881ec88309b511bbdf9d0b5ae6c2f0fb3ab56e7effda0',False)
loop=extract(smeft_loop,'8ed9cbfc1c7485e23506034dde6ffab8142439c69701718688c0a6427fa9d4e0',True)
par=dict(n['par'])
for k in ['m_u','m_c','m_d','m_s','m_b','m_e','m_mu','m_tau']:par[k]=0.
def rotate(k,t):
    if k=='VddLL':return np.einsum('ia,jb,kc,ld,ijkl->abcd',V.conj(),V,V.conj(),V,t)
    if k in ['V1ddLR','V8ddLR']:return np.einsum('ia,jb,ijkl->abkl',V.conj(),V,t)
    if k in ['S1ddRR','S8ddRR']:return np.einsum('ia,kc,ijkl->ajcl',V.conj(),V.conj(),t)
    return t
def run(amp):
    pos={k:0*v for k,v in C0.items()};neg={k:0*v for k,v in C0.items()}
    for k in Cu:pos[k]=amp*Cu[k];neg[k]=-amp*Cu[k]
    tp,tm=tree(pos,par),tree(neg,par);lp,lm=loop(pos,par,low),loop(neg,par,low)
    return {k:(-rotate(k,(tp[k]-tm[k])/(2*amp)),-rotate(k,(lp[k]-lm[k])/(2*amp))) for k in keys}
a=run(100.);b=run(300.);rows=[]
for k in keys:
    for i,j in [(1,0),(0,1)]:
        t,f=a[k][0][i,j,i,j],a[k][1][i,j,i,j];h=t+f
        rows.append(dict(operator=k,orientation='sd' if i==1 else 'ds',tree_real=float(t.real),tree_imag=float(t.imag),finite_real=float(f.real),finite_imag=float(f.imag),total_abs=float(abs(h))))
vll=a['VddLL'][0][1,0,1,0]+a['VddLL'][1][1,0,1,0]
other=max(r['total_abs'] for r in rows if r['operator']!='VddLL')
checks=dict(VLL_reproduced=bool(abs(vll.imag/2.7745442092905028e-15-1)<1e-6),nonVLL_null_within_floor=bool(other<1e-25),amplification=bool(max(abs(sum(a[k])[1,0,1,0]-sum(b[k])[1,0,1,0]) for k in keys)/abs(vll)<1e-6))
assert all(checks.values())
out=dict(scope='Six independent JMS down-quark structures and both sd/ds orientations; H=-L, correct chirality-specific rotations, tree and linearized one-loop matching. Non-top external masses zero consistently with Yukawa approximation. Not full UV or low-energy hadronic prediction.',rows=rows,max_nonVLL_abs_GeV_minus2=other,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
