"""Exact reduction for a rational two-flavor mixed triplet probe."""
import ast,hashlib,json,math
from pathlib import Path
import sympy as s
p=Path(__file__).with_name('casimir-dp-axion-triplet-mass-remainder-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='b94dd2b46085f3eba910dc2357834d3bda1ee681821100726a570be3befa68e8'
d={'__file__':str(p)};exec(compile(p.read_text().split('\nf=copy.copy(')[0],str(p),'exec'),d)
np=d['np'];n=d['n'];terms=d['terms']
C={'qq3':np.zeros((3,3,3,3))};C['qq3'][0,0,2,2]=C['qq3'][2,2,0,0]=.5
av=np.array([1,0,1]);bv=np.array([1,0,-1]);weight=np.einsum('a,b,c,d->abcd',av,bv,av,bv)/4
t,u,z=s.symbols('t u z',positive=True)
names=dict(mt=t,mW=s.Integer(1),vT=s.Integer(1),mZ=z,scale=u,pi=s.pi,Nc=s.Integer(3),cf=s.Rational(4,3))
numeric=dict(n['raw'].__globals__,C=C)
def evaluate(node):
    if isinstance(node,ast.Constant):return s.Rational(str(node.value))
    if isinstance(node,ast.Name):
        if node.id not in names:
            val=n['raw'].__globals__.get(node.id)
            names[node.id]=s.Rational(str(val)) if isinstance(val,(int,float)) else s.Symbol(node.id,positive=True)
        return names[node.id]
    if isinstance(node,ast.UnaryOp):return -evaluate(node.operand) if isinstance(node.op,ast.USub) else evaluate(node.operand)
    if isinstance(node,ast.BinOp):
        a,b=evaluate(node.left),evaluate(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        if isinstance(node.op,ast.Div):return a/b
        if isinstance(node.op,ast.Pow):return a**b
    if isinstance(node,ast.Call) and isinstance(node.func,ast.Name):
        if node.func.id=='einsum':
            expression=ast.Expression(body=node);ast.fix_missing_locations(expression)
            tensor=eval(compile(expression,'<tensor contraction>','eval'),numeric)
            value=float(np.sum(tensor*weight))
            # All contraction inputs are exact binary rationals and integers.
            return s.Rational(value)
        if node.func.id=='log':return s.log(evaluate(node.args[0]))
        if node.func.id=='sqrt':return s.sqrt(evaluate(node.args[0]))
    raise ValueError(ast.dump(node)[:200])
library=s.Add(*(evaluate(term) for term in terms))*16*s.pi**2
library=s.expand_log(library,force=True)
x=t*t
J=x/s.Integer(16)*(1-2*s.log(x)/(x-1))
K=x/s.Integer(8)*(s.log(u)+3*(x+1)/(4*(x-1))-x*(x+2)*s.log(x)/(2*(x-1)**2))
selected=8*J+4*K
candidate=2*x*s.log(x)/(x-1)
residual=s.factor(s.together(s.expand_log(library-selected-candidate,force=True)))
checks=dict(exact_identity=bool(residual==0),no_Z_mass=bool(z not in library.free_symbols))
assert all(checks.values())
out=dict(scope='Exact rational two-flavor rotation, symmetric mixed Cqq3 probe, explicit-mt additive library subset; MW=v=1 unit choices. General flavor completion and full matching remain unproven.',library_normalized=str(s.factor(s.together(library))),selected_normalized='8 J(x) + 4 K(x,mu)',remainder='2 x log(x)/(x-1)',symbolic_residual=str(residual),checks=checks,qq_full_overlap_established=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
