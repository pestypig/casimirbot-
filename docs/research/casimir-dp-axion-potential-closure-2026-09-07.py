"""Minimal soft-breaking scalar potential: exact tree masses and on-shell vertices."""
import json,math
from pathlib import Path
import numpy as np
f=294.;v=246.2;mh=125.;mr=1000.;ma=1.;mx=400.;fn=.3;mn=.939
rows=[];mass_errors=[];vertex_errors=[];C_errors=[]
for lp in [0.,.01,.03,.07,.1]:
    theta=.5*math.asin(2*lp*f*v/(mr*mr-mh*mh))
    c,s=math.cos(theta),math.sin(theta)
    Mhh=mh*mh*c*c+mr*mr*s*s
    Mss=mh*mh*s*s+mr*mr*c*c
    off=lp*f*v
    LH=Mhh/(2*v*v); LP=(Mss-ma*ma)/(2*f*f)
    soft=ma*ma*f/math.sqrt(2) # coefficient mu^3 in -mu^3(Phi+Phi*)
    muH2=LH*v*v+lp*f*f/2
    muPhi2=LP*f*f+lp*v*v/2-ma*ma
    M=np.array([[Mhh,off],[off,Mss]])
    mass_errors.append(max(abs(np.linalg.eigvalsh(M)/np.array([mh*mh,mr*mr])-1)))
    g_cart=lp*v*c-2*LP*f*s
    g_polar=-s*(mh*mh-ma*ma)/f
    vertex_errors.append(abs(g_cart-g_polar))
    ghheavy_cart=lp*v*s+2*LP*f*c
    ghheavy_polar=c*(mr*mr-ma*ma)/f
    vertex_errors.append(abs(ghheavy_cart-ghheavy_polar))
    Cexact=mx/f*fn*mn/v*s*c*(1/(mh*mh)-1/(mr*mr))
    Ccompact=lp*mx*fn*mn/(mh*mh*mr*mr)
    C_errors.append(abs(Cexact-Ccompact))
    width=g_cart*g_cart/(32*math.pi*mh)*math.sqrt(1-4*ma*ma/(mh*mh))
    # Width fraction uses a chosen SM-width reference, no lifetime/acceptance claim.
    br=width/(c*c*.0041+width)
    rows.append(dict(lambda_PhiH=lp,theta=theta,lambda_H=LH,lambda_Phi=LP,
        muH_squared_GeV2=muH2,muPhi_squared_GeV2=muPhi2,soft_mu_cubed_GeV3=soft,
        g_h_aa_GeV=g_cart,g_heavy_aa_GeV=ghheavy_cart,Gamma_h_aa_GeV=width,
        branching_fraction_with_4p1MeV_SM_reference=br,
        scalar_C_GeV_m2=Cexact,quartic_loop_counting_LP_over_16pi2=LP/(16*math.pi**2),
        kappa_A_cancel_h_aa=(-g_cart/(v*c))))
checks={'physical_eigenmasses':max(mass_errors)<1e-12,
        'Cartesian_polar_on_shell_vertices':max(vertex_errors)<1e-9,
        'exact_scalar_coefficient_identity':max(C_errors)<1e-22,
        'positive_quartic_tree_potential':all(r['lambda_H']>0 and r['lambda_Phi']>0 and r['lambda_PhiH']>-2*math.sqrt(r['lambda_H']*r['lambda_Phi']) for r in rows)}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='Minimal soft-breaking tree potential only; explicit-breaking messenger counterterms not fixed',checks=checks,rows=rows,max_vertex_error_GeV=max(vertex_errors),full_loop_matching_complete=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
