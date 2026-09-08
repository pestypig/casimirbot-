"""Check evolved qq3 membership; no projection is used to replace the model."""
import ast,hashlib,json
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-top-self-running-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='c948aa033e8c49df5a06556b0c6597012f183fe26faa817f7165a68d4141c8de'
tree=ast.parse(p.read_text().split('\nfull=z[')[0])
# Skip only the old comparison's baseline output calculation.
tree.body=[node for node in tree.body if not(isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='base' for t in node.targets))]
n={'__file__':str(p)};exec(compile(tree,str(p),'exec'),n)
d=n['d'];z=n['z'];np=n['np'];V=d['V']
T=np.diag([0.,0.,1.]);U=np.diag([1.,0.,0.]);H=[];labels=[]
for i in range(3):
    h=np.zeros((3,3),complex);h[i,i]=1;H.append(h);labels.append(f'diag{i+1}')
for i in range(3):
    for j in range(i+1,3):
        for name,val in [('real',1.),('imag',1j)]:
            h=np.zeros((3,3),complex);h[i,j]=val;h[j,i]=np.conj(val);H.append(h);labels.append(f'{name}{i+1}{j+1}')
basis=[(np.einsum('ij,kl->ijkl',h,T)+np.einsum('ij,kl->ijkl',T,h))/2 for h in H]
pure=np.einsum('ij,kl->ijkl',U,U)
def realvec(x):return np.concatenate([x.real.reshape(-1),x.imag.reshape(-1)])
def up(x):return np.einsum('ai,bj,ck,dl,ijkl->abcd',V,V.conj(),V,V.conj(),x,optimize=True)
def down(x):return np.einsum('ai,bj,ck,dl,abcd->ijkl',V.conj(),V,V.conj(),V,x,optimize=True)
def fit(tensor,bs):
    design=np.column_stack([realvec(b) for b in bs]);norm=np.linalg.norm(tensor)
    coeff,_,rank,_=np.linalg.lstsq(design,realvec(tensor)/norm,rcond=None)
    projection=sum(c*b for c,b in zip(coeff,bs))*norm;res=tensor-projection
    return dict(rank=int(rank),relative_Frobenius_residual=float(np.linalg.norm(res)/norm),max_absolute_residual_GeV_minus2=float(np.max(np.abs(res))),coefficients_GeV_minus2=[float(c*norm) for c in coeff]),projection,res
rows=[];tensors=[]
for label,tol in [('high_boundary',None),('low_1e-7',1e-7),('low_1e-9',1e-9)]:
    if tol is None:C=d['initial']
    else:_,C=d['run'](z['n']['keys'],tol)
    tensor=up(C['qq3']);tensors.append(tensor)
    f,proj,res=fit(tensor,basis);fplus,_,_=fit(tensor,basis+[pure])
    rows.append(dict(stage=label,qq3_Frobenius_norm_GeV_minus2=float(np.linalg.norm(tensor)),family=f,family_plus_pure_up=fplus,rotation_roundtrip_relative_error=float(np.linalg.norm(down(tensor)-C['qq3'])/np.linalg.norm(C['qq3']))))
checks=dict(rotation_roundtrip=bool(max(r['rotation_roundtrip_relative_error'] for r in rows)<1e-12),boundary_decomposition=bool(rows[0]['family_plus_pure_up']['relative_Frobenius_residual']<1e-12),tolerance_stability=bool(np.linalg.norm(tensors[1]-tensors[2])/np.linalg.norm(tensors[2])<1e-8))
assert all(checks.values())
mp=p.with_name('casimir-dp-axion-triplet-mass-remainder-2026-09-07.py')
assert hashlib.sha256(mp.read_bytes()).hexdigest()=='b94dd2b46085f3eba910dc2357834d3bda1ee681821100726a570be3befa68e8'
m={'__file__':str(mp)};exec(compile(mp.read_text().split('\nrows=[]')[0],str(mp),'exec'),m)
m['d']['x']=(d['low']/m['d']['mw'])**2;params=dict(m['par'],m_t=d['low'])
def response(tensor):
    cc={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in m['C0'].items()};cc['qq3']=tensor
    broad=-m['rotate'](m['probe'](cc,params,d['low']))[1,0,1,0]
    selected=m['d']['selected'](cc,d['low']);r=broad-selected
    return complex(r)
_,proj,res=fit(tensors[-1],basis);_,projplus,resplus=fit(tensors[-1],basis+[pure])
responses={label:response(t) for label,t in [('full',tensors[-1]),('family',proj),('outside_family',res),('family_plus_pure',projplus),('outside_family_plus_pure',resplus)]}
checks['response_linearity']=bool(abs(responses['full']-responses['family_plus_pure']-responses['outside_family_plus_pure'])/max(abs(responses['full']),1e-30)<1e-8)
assert all(checks.values())
out=dict(scope='Frozen subset boundary and top-self/QCD trajectory; least-squares membership diagnostic in real Hermitian tensor span. No fitted physical inputs or replacement by projected tensor. Responses are explicit-mt library minus selected qq3 matching only.',basis_labels=labels,rows=rows,checks=checks,remainder_responses_GeV_minus2={k:dict(real=v.real,imag=v.imag) for k,v in responses.items()},candidate_in_tested_family=bool(rows[-1]['family']['relative_Frobenius_residual']<1e-10),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(dict(rows=[dict(stage=r['stage'],family_residual=r['family']['relative_Frobenius_residual'],family_plus_pure_residual=r['family_plus_pure_up']['relative_Frobenius_residual']) for r in rows],responses=out['remainder_responses_GeV_minus2'],checks=checks),indent=2))
