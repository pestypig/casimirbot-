"""Thresholded VLL QCD evolution and leading-order RGI normalization."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import solve_ivp
p=Path(__file__).with_name('casimir-dp-axion-kaon-chirality-audit-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='dbc60775cd8ccd41dc8c92d57e5a1bc4d372e6db0bb7ad48777b73b20229b62c'
parent=json.loads(p.read_text());row=next(r for r in parent['rows'] if r['operator']=='VddLL' and r['orientation']=='sd')
highC=complex(row['tree_real']+row['finite_real'],row['tree_imag']+row['finite_imag'])
def segment(ah,muh,mul,nf):
    beta0=11-2*nf/3
    al=ah/(1+beta0*ah*math.log(mul/muh)/(2*math.pi))
    assert al>0
    factor=(ah/al)**(2/beta0)
    def rhs(t,y):return [-beta0*y[0]**2/(2*math.pi),y[0]*y[1]/math.pi]
    sol=solve_ivp(rhs,[math.log(muh),math.log(mul)],[ah,1.],rtol=1e-11,atol=1e-13)
    assert sol.success
    error=max(abs(sol.y[0,-1]/al-1),abs(sol.y[1,-1]/factor-1))
    return al,factor,error
def evolve(mb,mc,mu):
    a=.108;f=1.;last=162.6;segments=[]
    for endpoint,nf in [(mb,5),(mc,4),(mu,3)]:
        al,fac,error=segment(a,last,endpoint,nf)
        segments.append(dict(from_GeV=last,to_GeV=endpoint,nf=nf,alpha_start=a,alpha_end=al,C_factor=fac,ODE_relative_error=error))
        a=al;f*=fac;last=endpoint
    C=highC*f;hat=C*a**(2/9)
    return dict(bottom_threshold_GeV=mb,charm_threshold_GeV=mc,hadronic_scale_GeV=mu,segments=segments,alpha_nf3=a,C_running_imag_GeV_minus2=C.imag,C_RGI_LO_imag_GeV_minus2=hat.imag,RGI_over_weak=f*a**(2/9))
rows=[evolve(4.18,1.3,mu) for mu in [2.,3.,4.]]
variations=[evolve(mb,mc,3.) for mb,mc in [(3.5,1.3),(5.,1.3),(4.18,1.1),(4.18,1.6)]]
reference=rows[1]['C_RGI_LO_imag_GeV_minus2']
checks=dict(LO_RGI_scale_invariance=bool(max(abs(r['C_RGI_LO_imag_GeV_minus2']/reference-1) for r in rows)<1e-12),analytic_ODE_agreement=bool(max(s['ODE_relative_error'] for r in rows+variations for s in r['segments'])<1e-9))
assert all(checks.values())
out=dict(scope='Leading-order VLL running with nf5->4->3, continuous alpha and C at diagnostic thresholds. Three-flavor EFT evaluated at 2/3/4 GeV after charm decoupling; no threshold or NDR finite corrections. RGI is LO only, not a completed NLO Bhat matching.',weak_C_imag_GeV_minus2=highC.imag,rows=rows,threshold_diagnostics=variations,checks=checks,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(dict(rows=[{k:v for k,v in r.items() if k!='segments'} for r in rows],threshold_RGI_factors=[r['RGI_over_weak'] for r in variations],checks=checks),indent=2))
