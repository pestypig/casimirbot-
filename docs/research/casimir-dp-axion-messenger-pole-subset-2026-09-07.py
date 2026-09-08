"""Leading neutral messenger two-point/tadpole contribution to hybrid counterterms."""
import hashlib,json
from pathlib import Path
import mpmath as mp
base=Path(__file__).parent
src=base/'casimir-dp-axion-field-threshold-2026-09-07.py'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='7502701e03f138bc0b614ddb19ac63132d721f5e27a98496dd4071656bda48fe'
parent=base/'casimir-dp-axion-scalar-input-scheme-2026-09-07.json'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='853940c15240bb1e5746f5ed28ab9ca559737019b16b10f10f3e6612bcb34275'
ns={'__file__':str(src),'__name__':'archived_definitions'}
exec(compile(src.read_text().split('\nrows=[];')[0],str(src),'exec'),ns)
mp.mp.dps=45
v,f,mh,mr,ma=map(mp.mpf,['246.2','294','125','1000','1'])
theta=mp.asin(2*mp.mpf('.03')*v*f/(mr**2-mh**2))/2
c,s=mp.cos(theta),mp.sin(theta);R=mp.matrix([[c,-s],[s,c]])
M0=R.T*mp.diag([mh**2,mr**2])*R
PH=lambda p:ns['Pi'](p,mp.mpf('.2')/mp.sqrt(2),mp.mpf(2000))
PA=lambda p:ns['Pi'](p,mp.mpf('.0032'),mp.mpf(2000))
pstar=(mh**2+mr**2)/2
Kmass=mp.matrix([[c*c*PH(mh**2),c*s*PH(pstar)],[c*s*PH(pstar),s*s*PH(mr**2)]])
K=R.T*Kmass*R
ct={}
ct['delta_lambdaH']=(K[0,0]-PH(0))/(2*v*v)
ct['delta_muHS_GeV']=K[0,1]/v
ct['delta_muH2_GeV2']=ct['delta_lambdaH']*v*v+f*ct['delta_muHS_GeV']-PH(0)
ct['delta_mS2_GeV2']=K[1,1]
ct['delta_t_GeV3']=-f*K[1,1]-v*v*ct['delta_muHS_GeV']/2
ct['delta_mA2_GeV2']=PA(ma**2)
def ren(p):return mp.matrix([[PH(p),0],[0,0]])-K
res=[(R*ren(mh**2)*R.T)[0,0],(R*ren(mr**2)*R.T)[1,1],(R*ren(pstar)*R.T)[0,1],PA(ma**2)-ct['delta_mA2_GeV2']]
res += [-ct['delta_muH2_GeV2']+ct['delta_lambdaH']*v*v+ct['delta_muHS_GeV']*f-PH(0),ct['delta_t_GeV3']+f*ct['delta_mS2_GeV2']+v*v*ct['delta_muHS_GeV']/2]
def Bclosed(p):
    z=p/mp.mpf(2000)**2
    return mp.mpf(1) if z==0 else 2+(1-z)/z*mp.log1p(-z)
berr=[abs(Bclosed(p)-ns['B'](p,mp.mpf(2000))) for p in [0,ma**2,mh**2,pstar,mr**2,-mp.mpf('.246')**2]]
rows=[];inv_errors=[]
for q in map(mp.mpf,['0','.05','.246']):
    E=M0+mp.eye(2)*q*q;G=E**-1;S=ren(-q*q)
    relative=(G*S*G)[0,1]/G[0,1]
    eps=mp.mpf('1e-5')
    numerical=(((E-eps*S)**-1)[0,1]-((E+eps*S)**-1)[0,1])/(2*eps)/G[0,1]
    inv_errors.append(abs(relative-numerical))
    rows.append(dict(q_GeV=float(q),scalar_propagator_only_relative_amplitude=float(relative),pseudoscalar_propagator_only_relative_amplitude=float((PA(-q*q)-PA(ma**2))/(q*q+ma**2))))
points=[]
for p in [mh**2,pstar,mr**2]:
    delta=PH(p)-PH(0);linear=p*mp.diff(PH,0)
    points.append(dict(p2_GeV2=float(p),PiH_minus_PiH0_GeV2=float(delta),linear_derivative_GeV2=float(linear),nonlinear_fraction_of_momentum_increment=float((delta-linear)/delta)))
checks=dict(closed_B0_matches_integral=max(berr)<mp.mpf('1e-35'),six_renormalization_conditions=max(map(abs,res))<mp.mpf('1e-30'),propagator_insertion_matches_inverse_derivative=max(inv_errors)<mp.mpf('1e-18'))
checks={k:bool(z) for k,z in checks.items()};assert all(checks.values()),checks
out=dict(scope='Finite leading-yL^2/yR^2 neutral two-point and tadpole subset at mu=MU; delta v and delta f set to zero for this isolated contribution. Not the complete messenger or electroweak input conversion.',checks=checks,counterterms={k:float(z) for k,z in ct.items()},momentum_points=points,rows=rows,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
