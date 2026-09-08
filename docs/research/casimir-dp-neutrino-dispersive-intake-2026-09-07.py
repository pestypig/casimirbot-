"""Authenticate archived Omnes data and audit source normalization before use."""
import ast,hashlib,json,math
from pathlib import Path
import numpy as np

folder=Path(__file__).with_suffix('')
manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8-sig'))
assert manifest['commit']=='6a6dcfccf903317ea2104e27bb1dbbc7ad1d9fc7'
for entry in manifest['files']:
    data=(folder/entry['local_name']).read_bytes()
    assert len(data)==entry['bytes']
    assert hashlib.sha256(data).hexdigest()==entry['sha256']
    assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==entry['git_blob']

def literal(node):
    # Source tables contain Complex(real,imag); never eval a downloaded table.
    if isinstance(node,ast.Expression): return literal(node.body)
    if isinstance(node,ast.List): return [literal(x) for x in node.elts]
    if isinstance(node,ast.Constant) and type(node.value) in (int,float): return node.value
    if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.USub,ast.UAdd)):
        return (-1 if isinstance(node.op,ast.USub) else 1)*literal(node.operand)
    if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id=='Complex' and len(node.args)==2 and not node.keywords:
        return complex(literal(node.args[0]),literal(node.args[1]))
    raise ValueError('Unsupported data syntax: '+type(node).__name__)

tables={}
for key in ['c1','c2','d1','d2']:
    s,values=literal(ast.parse((folder/('hips_'+key+'.txt')).read_text(),mode='eval'))
    tables[key]=(np.asarray(s,dtype=float),np.asarray(values,dtype=complex))
s=tables['c1'][0]
shape=tables['c1'][1].shape
normalization={k:float(np.max(np.abs(v[:,0]-(1 if k in ['c1','d2'] else 0)))) for k,(_,v) in tables.items()}

# Independently evaluate the printed NLO subtraction formula, with the
# archived code's own central constants. Do not silently change source data.
mpi=.134;mk=.497;meta=.547862;mu=.547862;f=.0803;l85=-.46e-3;l64=.28e-3
chiral_log=lambda mass:mass*mass/(32*math.pi**2*f*f)*math.log(mass*mass/(mu*mu))
common=8/(f*f)*((2*mk*mk-mpi*mpi)*l85+4*mk*mk*l64+mk*mk/(72*math.pi**2)*(1+math.log(meta*meta/(mu*mu))))
paper_ratio=1+chiral_log(meta)-chiral_log(mpi)+common
code_ratio=1+math.log(meta*meta/(mpi*mpi))/(32*math.pi**2*f*f)+common

# Verify that the inspected source function actually yields the audited value.
tree=ast.parse((folder/'classes.py').read_text())
defs=[n for n in tree.body if isinstance(n,(ast.ClassDef,ast.FunctionDef)) and n.name in ['Params','GammaK0']]
namespace={'np':np}
exec(compile(ast.Module(body=defs,type_ignores=[]),'<inspected GammaK0 definitions>','exec'),namespace)
source_ratio=namespace['GammaK0'](MeanQ=True)/(.5*mpi*mpi)
rejected=False
try: literal(ast.parse('__import__("os")',mode='eval'))
except ValueError: rejected=True
checks={
 'data_hashes':True,
 'aligned_finite_monotone_grids':bool(np.all(np.diff(s)>0) and all(np.array_equal(x,s) and v.shape==shape and np.isfinite(v).all() for x,v in tables.values())),
 'source_formula_reproduced':math.isclose(source_ratio,code_ratio,rel_tol=1e-12),
 'parser_rejects_executable_expression':rejected
}
assert all(checks.values())
out=dict(scope='Authenticated numerical intake and normalization discrepancy; not admitted to decay prediction',
         full_model_admitted=False,commit=manifest['commit'],checks=checks,
         samples=int(shape[0]),s_nodes=int(shape[1]),s_range_GeV2=[float(s[0]),float(s[-1])],
         zero_normalization_max_errors=normalization,
         admission_checks={'identity_at_zero_to_1e_minus8':all(v<1e-8 for v in normalization.values()),
                           'code_matches_printed_gammaK0':math.isclose(code_ratio,paper_ratio,rel_tol=1e-8)},
         gammaK0_audit=dict(paper_equations='2407.13587v1 equations 76 and 79',
                           ratio_to_half_mpi_squared_paper=paper_ratio,
                           ratio_to_half_mpi_squared_code=code_ratio,
                           source_function_ratio=source_ratio),
         remaining_admission=['reconcile canonical channel normalization of numerical matrices with paper and implementation',
                              'reconcile source subtraction function with printed NLO formula',
                              'resolve pion mass convention versus preceding charged-mass slice',
                              'retain independently counted physical final-state symmetry factors',
                              'propagate phase and subtraction uncertainty with correlations stated'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
