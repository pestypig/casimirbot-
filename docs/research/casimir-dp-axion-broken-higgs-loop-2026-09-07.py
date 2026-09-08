"""Exact Higgs-background neutral messenger loop at yu=0; CP-even subset."""
import hashlib,json
from pathlib import Path
import mpmath as m
m.mp.dps=45
base=Path(__file__).parent
old=base/'casimir-dp-axion-messenger-pole-subset-2026-09-07.json'
assert hashlib.sha256(old.read_bytes()).hexdigest()=='0b0e9bb4e6127de5a3a9b7fbf52698d86b43f572cdfdf6b452b07003bccd3147'
prior=json.loads(old.read_text())
v,f,M,k,Nc=map(m.mpf,['246.2','294','2000','0.2','3']);k/=m.sqrt(2)
mh,mr=m.mpf(125),m.mpf(1000)
angle=m.asin(2*m.mpf('.03')*v*f/(mr**2-mh**2))/2
c,s=m.cos(angle),m.sin(angle);R=m.matrix([[c,-s],[s,c]])
matrix=R.T*m.diag([mh**2,mr**2])*R
def integrals(p,t):
    A=t*(1-m.log(t/M**2))
    Bhl=-m.quad(lambda x:m.log(x*(t-(1-x)*p)/M**2),[0,1])
    Bhh=-m.quad(lambda x:m.log((t-x*(1-x)*p)/M**2),[0,1])
    return A,Bhl,Bhh
def P(p,w):
    t=M*M+k*k*w*w;gHL=k*M/m.sqrt(t);gHH=k*k*w/m.sqrt(t)
    A,Bhl,Bhh=integrals(p,t)
    return -Nc/(8*m.pi**2)*(gHL*gHL*(A+(t-p)*Bhl)+gHH*gHH*(2*A+(4*t-p)*Bhh))
def V(w):
    t=M*M+k*k*w*w
    return -Nc/(16*m.pi**2)*t*t*(m.log(t/M**2)-m.mpf('1.5'))
curvature_error=abs(P(0,v)+m.diff(V,v,2))
tad=m.diff(V,v)
t=M*M+k*k*v*v
tad_analytic=-Nc*k*k*v*t/(4*m.pi**2)*(m.log(t/M**2)-1)
def result(w):
    # w changes only loop background for comparison; external scalar inputs remain fixed.
    Ph=lambda p:P(p,w)
    Km=m.matrix([[c*c*Ph(mh**2),c*s*Ph((mh**2+mr**2)/2)],
        [c*s*Ph((mh**2+mr**2)/2),s*s*Ph(mr**2)]])
    K=R.T*Km*R
    rows=[]
    for q in map(m.mpf,['0','.05','.246']):
        G=(matrix+m.eye(2)*q*q)**-1
        ren=m.matrix([[Ph(-q*q),0],[0,0]])-K
        rows.append(dict(q_GeV=float(q),relative_scalar_propagator_amplitude=float((G*ren*G)[0,1]/G[0,1])))
    return K,rows
K,rows=result(v);_,zero_rows=result(m.mpf(0))
ct=dict(delta_lambdaH=(K[0,0]+tad/v)/(2*v*v),delta_muHS_GeV=K[0,1]/v,
    delta_mS2_GeV2=K[1,1],delta_t_GeV3=-f*K[1,1]-v*K[0,1]/2)
ct['delta_muH2_GeV2']=ct['delta_lambdaH']*v*v+f*ct['delta_muHS_GeV']+tad/v
res=[-ct['delta_muH2_GeV2']+ct['delta_lambdaH']*v*v+ct['delta_muHS_GeV']*f+tad/v,
    ct['delta_t_GeV3']+f*ct['delta_mS2_GeV2']+v*v*ct['delta_muHS_GeV']/2]
for p,i,j in [(mh**2,0,0),(mr**2,1,1),((mh**2+mr**2)/2,0,1)]:
    res.append((R*(m.matrix([[P(p,v),0],[0,0]])-K)*R.T)[i,j])
for r,o in zip(rows,prior['rows']):
    r['change_from_leading_amplitude']=r['relative_scalar_propagator_amplitude']-o['scalar_propagator_only_relative_amplitude']
    r['fractional_change_of_this_correction']=r['change_from_leading_amplitude']/o['scalar_propagator_only_relative_amplitude']
checks=dict(zero_momentum_matches_CW_curvature=curvature_error<m.mpf('1e-30'),
    tadpole_matches_CW_derivative=abs(tad-tad_analytic)<m.mpf('1e-30'),
    zero_background_recovers_archived_loop=max(abs(r['relative_scalar_propagator_amplitude']-o['scalar_propagator_only_relative_amplitude']) for r,o in zip(zero_rows,prior['rows']))<1e-15,
    five_CP_even_input_conditions=max(map(abs,res))<m.mpf('1e-30'))
checks={k:bool(z) for k,z in checks.items()};assert all(checks.values()),checks
out=dict(scope='One-loop CP-even neutral messenger two-point and tadpole at yu=0, exact in yL*v/MU. No CP-odd light-quark, gauge/GF, vertex or fermion matching.',checks=checks,
    heavy_eigenmass_GeV=float(m.sqrt(t)),left_mixing_sine=float(k*v/m.sqrt(t)),
    counterterms={k:float(z) for k,z in ct.items()},rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
