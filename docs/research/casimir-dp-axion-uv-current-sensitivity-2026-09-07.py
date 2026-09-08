"""One-loop heavy-current boundary sensitivity, not full two-loop matching."""
import hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-qq-matching-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='da1bfddd207ef022f4ac7baf39bacc0dd904817806de28a133122374feaede66'
q={'__file__':str(p)};exec(compile(p.read_text().split('\nrows=[];Cs=[]')[0],str(p),'exec'),q)
d=q['d'];n=q['n'];np=q['np'];M=d['M'];y=d['y'];Pu=d['Pu']
original1=d['initial']['phiq1'].copy();original3=d['initial']['phiq3'].copy()
unit=y**4*Pu/(256*math.pi**2*M*M)
def value(tol):
    summary,C=d['run'](n['keys'],tol)
    hj,hk,_=q['contractions'](C['qq1'],C['qq3'],q['Pt'])
    qu=q['pref']*q['Pt'][1,0]*((-2+2/3)*C['qu8'][1,0,2,2]-4*C['qu1'][1,0,2,2])*n['I1']
    return float(summary['H_imag_GeV_minus2']+hj.imag+hk.imag+qu.imag)
base=value(1e-9)
d['initial']['phiq1']=original1-17*unit
d['initial']['phiq3']=original3+9*unit
shifted=value(1e-7);tight=value(1e-9)
Y=d['Y'];B=d['B']
alignment=float(np.max(np.abs(B@Y+Y@B)))
checks=dict(tolerance=bool(abs(shifted/tight-1)<1e-8),top_alignment=bool(alignment/(y*y*np.max(np.abs(Y)))<1e-12),sum_identity=bool(np.max(np.abs((d['initial']['phiq1']+d['initial']['phiq3'])+8*unit))/np.max(np.abs(unit))<1e-10))
assert all(checks.values())
out=dict(source='https://arxiv.org/pdf/2204.05962 v2 Eqs. S.3.7-S.3.8; mu=M',scope='Only pure-Higgs/messenger quartic current boundary insertion; selected coupled evolution and matching. Partial higher-order sensitivity, not an uncertainty band or full UV completion.',base_imag_GeV_minus2=base,with_current_boundary_imag_GeV_minus2=tight,fractional_change=tight/base-1,relative_C1_boundary_change=-17*y*y/(64*math.pi**2),relative_C3_boundary_change=-9*y*y/(64*math.pi**2),checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
