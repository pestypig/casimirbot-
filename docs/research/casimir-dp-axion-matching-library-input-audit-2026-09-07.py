"""Audit mass-input handling in installed one-loop VddLL matching."""
import ast,hashlib,json,os,sys
sys.setrecursionlimit(20000)  # Generated matching expressions have deep ASTs.
from pathlib import Path
sys.path.insert(0,str(Path(os.environ['TEMP'])/'casimir-wilson-audit'))
import numpy as np
from wilson.match import smeft_loop
from wilson.run.smeft import smpar
from wilson.util import smeftutil
p=Path(smeft_loop.__file__)
sha=hashlib.sha256(p.read_bytes()).hexdigest()
assert sha=='8ed9cbfc1c7485e23506034dde6ffab8142439c69701718688c0a6427fa9d4e0'
def extract(parameterize):
    tree=ast.parse(p.read_text());fn=next(f for f in tree.body if isinstance(f,ast.FunctionDef) and f.name=='_match_all_array')
    prefix=[]
    for statement in fn.body:
        prefix.append(statement)
        if isinstance(statement,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='c' for t in statement.targets):break
    selected=[s for s in fn.body if isinstance(s,ast.Assign) and any(isinstance(t,ast.Subscript) and isinstance(t.value,ast.Name) and t.value.id=='c' and isinstance(t.slice,ast.Constant) and t.slice.value=='VddLL' for t in s.targets)]
    assert len(selected)==1
    if parameterize:
        found=0
        for s in prefix:
            if isinstance(s,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mt' for t in s.targets):
                assert isinstance(s.value,ast.Constant) and s.value.value==173
                s.value=ast.Subscript(value=ast.Name(id='par',ctx=ast.Load()),slice=ast.Constant(value='m_t'),ctx=ast.Load());found+=1
        assert found==1
    fn.body=prefix+selected+[ast.Return(value=ast.Subscript(value=ast.Name(id='c',ctx=ast.Load()),slice=ast.Constant(value='VddLL'),ctx=ast.Load()))]
    module=ast.Module(body=[fn],type_ignores=[]);ast.fix_missing_locations(module)
    namespace=dict(smeft_loop.__dict__);exec(compile(module,str(p),'exec'),namespace)
    return namespace[fn.name]
raw=extract(False);variant=extract(True)
C0=smeftutil.C_array2dict(np.zeros(9999));C={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in C0.items()}
C['phiq1'][0,2]=C['phiq1'][2,0]=1e-9
par=smpar.p.copy();par['GF']=1/(np.sqrt(2)*246.2**2);par['m_W']=80.379
def evaluate(fn,mass):
    pars=dict(par,m_t=mass)
    return fn(C,pars,162.6)-fn(C0,pars,162.6)
r173=evaluate(raw,173.);r162=evaluate(raw,162.6)
v173=evaluate(variant,173.);v162=evaluate(variant,162.6)
norm=float(np.max(np.abs(r173)))
raw_change=float(np.max(np.abs(r162-r173))/norm)
variant_change=float(np.max(np.abs(v162-v173))/norm)
checks=dict(unmodified_parameter_invariance=bool(raw_change<1e-12),variant_at_default_agrees=bool(np.max(np.abs(v173-r173))/norm<1e-12),variant_mass_response_nonzero=bool(variant_change>1e-3))
assert all(checks.values())
out=dict(library_sha256=sha,probe='Hermitian up-basis phiq1_13=phiq1_31=1e-9 GeV^-2; SM-subtracted VddLL tensor. Probe is not our model point.',scope='Extracted VddLL expression and original setup; isolated in-memory variant changes only hardcoded mt assignment to par[m_t]. Installed package unchanged.',original_relative_mass_response=raw_change,variant_relative_mass_response=variant_change,probe_tensor_max_GeV_minus2=norm,checks=checks,model_matching_validated=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
