"""Test the finite remainder on a Hermitian flavor basis, without fitting."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-triplet-mass-remainder-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='b94dd2b46085f3eba910dc2357834d3bda1ee681821100726a570be3befa68e8'
z={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),z)
np=z['np'];d=z['d'];C0=z['C0'];V=d['V'];Pt=d['Pt'];par=dict(z['par'],m_t=173.)
d['x']=(173/d['mw'])**2;x=d['x'];amp=1e-6;T=np.diag([0.,0.,1.]);basis=[]
for a in range(3):
    h=np.zeros((3,3),complex);h[a,a]=1
    basis.append((f'diag{a+1}',h,a<2))
for a in range(3):
    for b in range(a+1,3):
        for label,val in [('real',1.),('imag',1j)]:
            h=np.zeros((3,3),complex);h[a,b]=val;h[b,a]=np.conj(val)
            basis.append((f'{label}{a+1}{b+1}',h,b<2))
for seed in [7,19,41]:
    rng=np.random.default_rng(seed);a=rng.normal(size=(3,3))+1j*rng.normal(size=(3,3))
    basis.append((f'heldout{seed}',(a+a.conj().T)/2,False))
rows=[]
for name,h,light in basis:
    C={k:np.array(v,copy=True) if isinstance(v,np.ndarray) else v for k,v in C0.items()}
    C['qq3']=amp*(np.einsum('ij,kl->ijkl',h,T)+np.einsum('ij,kl->ijkl',T,h))/2
    hd=V.conj().T@h@V
    hypothesis=d['pref']*amp*Pt[1,0]*hd[1,0]*2*x*math.log(x)/(x-1)
    Q=np.eye(3)-T
    mapped=Q@h@Q+(Q@h@T+T@h@Q)/4
    mapped_down=V.conj().T@mapped@V
    reconstructed=d['pref']*amp*Pt[1,0]*mapped_down[1,0]*2*x*math.log(x)/(x-1)
    for mu in [80.379,173.,300.]:
        library=-z['rotate'](z['probe'](C,par,mu))[1,0,1,0]
        remainder=library-d['selected'](C,mu)
        error=abs(remainder-hypothesis)/max(abs(hypothesis),1e-25)
        scale=max(abs(hypothesis),abs(library),abs(reconstructed),1e-25)
        rows.append(dict(basis=name,light_block=light,scale_GeV=mu,remainder_real=float(remainder.real),remainder_imag=float(remainder.imag),hypothesis_real=float(hypothesis.real),hypothesis_imag=float(hypothesis.imag),relative_error=float(error),agrees=bool(error<1e-7),mapped_real=float(reconstructed.real),mapped_imag=float(reconstructed.imag),mapped_scaled_error=float(abs(remainder-reconstructed)/scale)))
lightmax=max(r['relative_error'] for r in rows if r['light_block'])
checks=dict(light_block_span=bool(lightmax<1e-7),reconstructed_family_map=bool(max(r['mapped_scaled_error'] for r in rows)<1e-7))
assert all(checks.values())
out=dict(scope='Cqq3=amplitude sym(H tensor T), H Hermitian. Naive map H fails outside light block. Reconstructed map QHQ+(QHT+THQ)/4, Q=1-T, tested on full Hermitian basis and three held-out combinations. Only explicit-mt library subset; no arbitrary four-index completion claimed.',rows=rows,light_block_max_relative_error=lightmax,reconstructed_map_max_scaled_error=max(r['mapped_scaled_error'] for r in rows),checks=checks,all_H_basis_agrees=bool(all(r['agrees'] for r in rows)),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(light_block_max_relative_error=lightmax,at173=[dict(basis=r['basis'],light_block=r['light_block'],relative_error=r['relative_error'],agrees=r['agrees']) for r in rows if r['scale_GeV']==173.]),indent=2))
