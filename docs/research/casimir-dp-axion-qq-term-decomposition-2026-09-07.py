"""Algebraic mt-term decomposition; not a gauge-invariant diagram split."""
import ast,copy,hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-current-qq-independent-overlap-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='65aa215d256e235657431cbc63f183bd7cc8634a49307683de3208aecf7bbeba'
d={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),d)
np=d['np'];raw=d['raw'];rotate=d['rotate'];C0=d['C0'];par=d['par']
source=Path(raw.__code__.co_filename)
assert hashlib.sha256(source.read_bytes()).hexdigest()=='8ed9cbfc1c7485e23506034dde6ffab8142439c69701718688c0a6427fa9d4e0'
tree=ast.parse(source.read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='_match_all_array')
prefix=[]
for s in fn.body:
    prefix.append(s)
    if isinstance(s,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='c' for t in s.targets):break
assignment=next(s for s in fn.body if isinstance(s,ast.Assign) and any(isinstance(t,ast.Subscript) and isinstance(t.value,ast.Name) and t.value.id=='c' and isinstance(t.slice,ast.Constant) and t.slice.value=='VddLL' for t in s.targets))
def flatten(node,sign=1):
    if isinstance(node,ast.BinOp) and isinstance(node.op,(ast.Add,ast.Sub)):
        return flatten(node.left,sign)+flatten(node.right,sign*(-1 if isinstance(node.op,ast.Sub) else 1))
    return [(sign,node)]
terms=flatten(assignment.value)
groups={True:[],False:[]}
for sign,node in terms:
    names={n.id for n in ast.walk(node) if isinstance(n,ast.Name)}
    groups['mt' in names].append(ast.UnaryOp(op=ast.USub(),operand=node) if sign==-1 else node)
def make(group):
    f=copy.deepcopy(fn);a=copy.deepcopy(assignment)
    expr=ast.Constant(value=0)
    for node in groups[group]:expr=ast.BinOp(left=expr,op=ast.Add(),right=copy.deepcopy(node))
    a.value=expr
    f.body=copy.deepcopy(prefix)+[a,ast.Return(value=copy.deepcopy(a.targets[0]))]
    f.body[-1].value.ctx=ast.Load()
    module=ast.Module(body=[f],type_ignores=[]);ast.fix_missing_locations(module)
    ns=dict(raw.__globals__);exec(compile(module,str(source),'exec'),ns)
    return ns[f.name]
withmt=make(True);withoutmt=make(False)
def H(f,C,mu):return -rotate(f(C,par,mu)-f(C0,par,mu))[1,0,1,0]
rows=[];errors=[]
for key in ['qq1','qq3']:
    C={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in C0.items()}
    C[key][0,0,2,2]=C[key][2,2,0,0]=5e-7
    mu=173.;a=H(withmt,C,mu);b=H(withoutmt,C,mu);full=H(raw,C,mu);s=d['selected'](C,mu)
    errors.append(abs((a+b-full)/full));h=.001
    slope=lambda f:(H(f,C,mu*math.exp(h))-H(f,C,mu*math.exp(-h)))/(2*h)
    ss=(d['selected'](C,mu*math.exp(h))-d['selected'](C,mu*math.exp(-h)))/(2*h)
    rows.append(dict(operator=key,library_imag=float(full.imag),explicit_mt_terms_imag=float(a.imag),no_explicit_mt_terms_imag=float(b.imag),selected_imag=float(s.imag),explicit_mt_difference_imag=float((a-s).imag),library_log_slope_imag=float(slope(raw).imag),explicit_mt_log_slope_imag=float(slope(withmt).imag),no_explicit_mt_log_slope_imag=float(slope(withoutmt).imag),selected_log_slope_imag=float(ss.imag)))
checks=dict(reconstruction=bool(max(errors)<1e-7))
assert all(checks.values())
out=dict(scope='Exact additive AST partition by explicit name mt. Algebraic partition only, not separation into physical gauge-invariant sectors; masses and parameters fixed.',term_counts=dict(explicit_mt=len(groups[True]),no_explicit_mt=len(groups[False])),rows=rows,reconstruction_max_relative_error=float(max(errors)),checks=checks,qq_overlap_established=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
