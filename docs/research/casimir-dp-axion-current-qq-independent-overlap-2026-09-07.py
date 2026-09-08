"""Independent current and qq comparison; preserve discrepancies explicitly."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-qu-independent-overlap-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='e600fdba0c8241b63d69fb236fbc40af5ec0ae7a95954ffc578ebd3d769a461d'
d={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[]')[0],str(p),'exec'),d)
np=d['np'];V=d['V'];Pt=d['Pt'];x=d['x'];pref=d['pref'];mw=d['mw'];raw=d['raw'];rotate=d['rotate'];C0=d['C0'];par=d['par']
def selected(C,mu):
    i,j=1,0
    A=rotate(C['qq1']);B=rotate(C['qq3']);Q=A+B
    c1=V.conj().T@C['phiq1']@V;c3=V.conj().T@C['phiq3']@V
    I1=x/8*(math.log(mu/mw)-(x-7)/(4*(x-1))-(x*x-2*x+4)*math.log(x)/(2*(x-1)**2))
    I2=x/8*(math.log(mu/mw)+(7*x-25)/(4*(x-1))-(x*x-14*x+4)*math.log(x)/(2*(x-1)**2))
    J=x/16*(1-2*math.log(x)/(x-1))
    K=x/8*(math.log(mu/mw)+3*(x+1)/(4*(x-1))-x*(x+2)*math.log(x)/(2*(x-1)**2))
    S=x*(1-11*x/4+x*x/4)/(1-x)**2-1.5*x**3*math.log(x)/(1-x)**3
    top=sum(Pt[b,a]*(A[i,j,a,b]+A[a,b,i,j]-B[i,j,a,b]-B[a,b,i,j]+2*B[a,j,i,b]+2*B[i,b,a,j]) for a in range(3) for b in range(3))
    wave=sum(Pt[i,m]*(Q[m,j,i,j]+Q[i,j,m,j])+Pt[m,j]*(Q[i,m,i,j]+Q[i,j,i,m]) for m in range(3))
    return pref*Pt[i,j]*(4*c1[i,j]*I1-4*c3[i,j]*I2+(Pt@c3+c3@Pt)[i,j]*S)-8*pref*Pt[i,j]*top*J+2*pref*wave*K
rows=[]
for probe in ['phiq1_up','phiq3_up','current_difference_up','qq1_mixed','qq3_mixed','qq_sum_mixed','qq1_up']:
    C={k:np.array(val,copy=True) if isinstance(val,np.ndarray) else val for k,val in C0.items()}
    amp=1e-6
    if probe.startswith('phiq'):C[probe.split('_')[0]][0,0]=amp
    elif probe=='current_difference_up':C['phiq1'][0,0]=amp;C['phiq3'][0,0]=-amp
    elif probe=='qq1_up':C['qq1'][0,0,0,0]=amp
    else:
        keys=['qq1','qq3'] if probe=='qq_sum_mixed' else [probe.split('_')[0]]
        for key in keys:C[key][0,0,2,2]=C[key][2,2,0,0]=amp/2
    for mu in [80.379,173.,300.]:
        h=-rotate(raw(C,par,mu)-raw(C0,par,mu))[1,0,1,0];s=selected(C,mu)
        delta=h-s
        noQCD=dict(par,alpha_s=0.)
        h0=-rotate(raw(C,noQCD,mu)-raw(C0,noQCD,mu))[1,0,1,0]
        rows.append(dict(probe=probe,scale_GeV=mu,library_real=float(h.real),library_imag=float(h.imag),selected_real=float(s.real),selected_imag=float(s.imag),difference_real=float(delta.real),difference_imag=float(delta.imag),relative_difference=float(abs(delta)/max(abs(s),1e-30)),library_without_QCD_real=float(h0.real),library_without_QCD_imag=float(h0.imag),without_QCD_difference_imag=float((h0-s).imag)))
currentmax=max(r['relative_difference'] for r in rows if 'current' in r['probe'] or 'phiq' in r['probe'])
linearity=[]
for mu in [80.379,173.,300.]:
    lookup={r['probe']:complex(r['library_real'],r['library_imag']) for r in rows if r['scale_GeV']==mu}
    linearity.append(abs((lookup['qq1_mixed']+lookup['qq3_mixed']-lookup['qq_sum_mixed'])/lookup['qq_sum_mixed']))
checks=dict(current_overlap=bool(currentmax<1e-7),library_qq_linearity=bool(max(linearity)<1e-7))
assert all(checks.values())
out=dict(scope='Up-aligned current and symmetric mixed/up qq probes at common mt=173; full library finite terms compared to selected top J/K/current formula. Disagreements are observations, not fitted away.',rows=rows,current_max_relative_difference=currentmax,current_overlap=bool(currentmax<1e-7),checks=checks,qq_overlap_established=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(current_max_relative_difference=currentmax,rows=[r for r in rows if r['scale_GeV']==173.]),indent=2))
