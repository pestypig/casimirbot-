#!/usr/bin/env python3
"""Two-component charged quadratic-field abundance screen on finite-T e+e- history.

Exploratory U(1)-preserving low-energy toy. Not the full pNGB potential,
perturbation/structure calculation, or boson-star solution.
"""
from __future__ import annotations
import json, math
from pathlib import Path
import numpy as np
from scipy.integrate import quad, solve_ivp
from scipy.interpolate import PchipInterpolator
from scipy.optimize import brentq

MASS_EV=1e-17; M= MASS_EV*1e-9; OMEGA_H2=.1198; HRED=.674
MRED=2.435e18; ME=.51099895e-3; TNU=2e-3; T0=2.348e-13; GS0=3.91
H0=67.4/3.0856775814913673e19*6.582119569e-25
RHOC=3*H0**2*MRED**2; RHODM=OMEGA_H2/HRED**2*RHOC

def e_pair(y):
    def occ(x):
        z=math.hypot(x,y); return 0.0 if z>700 else 1/(math.exp(z)+1)
    rho=4/(2*math.pi**2)*quad(lambda x:x*x*math.hypot(x,y)*occ(x),0,np.inf,epsrel=2e-8)[0]
    p=4/(6*math.pi**2)*quad(lambda x:(x**4/math.hypot(x,y))*occ(x),0,np.inf,epsrel=2e-8)[0]
    return rho,p

def dof(T):
    re,pe=e_pair(ME/T); gs_em=2+45/(2*math.pi**2)*(re+pe)
    rd,pd=e_pair(ME/TNU); gs_dec=2+45/(2*math.pi**2)*(rd+pd)
    tnr=1 if T>=TNU else (gs_em/gs_dec)**(1/3)
    rr=math.pi**2/15+re+math.pi**2/30*5.25*tnr**4
    return 30/math.pi**2*rr, gs_em+5.25*tnr**3, rr

Ts=np.geomspace(1e-6,1e-2,420)
gs=[]; gss=[]; rr=[]
for t in Ts:
    a,b,c=dof(float(t)); gs.append(a); gss.append(b); rr.append(c)
gs=np.array(gs); gss=np.array(gss); rr=np.array(rr)
Ns=np.log(T0/Ts*(GS0/gss)**(1/3)); ix=np.argsort(Ns)
Ns=Ns[ix]; Ts=Ts[ix]; gs=gs[ix]; rr=rr[ix]
lnH=PchipInterpolator(Ns,.5*np.log(math.pi**2/30*gs*Ts**4/(3*MRED**2)))
dlnH=lnH.derivative(); lnT=PchipInterpolator(Ns,np.log(Ts)); rrT=PchipInterpolator(Ns,rr)
Tstart=1e-2; Nstart=math.log(T0/Tstart*(GS0/dof(Tstart)[1])**(1/3))
Nstart=max(Nstart,float(Ns.min()))
def hr(n): return math.exp(float(lnH(n)))/M
Nstop=brentq(lambda n:hr(n)-.01,Nstart,float(Ns.max()))
hr0=hr(Nstart)
def rhs(n,z):
    u,up,v,vp=z; inv=1/hr(n)
    damp=3+float(dlnH(n))
    return up,-damp*up-inv**2*u,vp,-damp*vp-inv**2*v
# v is the unit-alpha response to initial physical ydot=m*X_i: y_N=m/H_i.
sol=solve_ivp(rhs,(Nstart,Nstop),(1,0,0,1/hr0),method='DOP853',rtol=2e-9,atol=2e-11,max_step=.001,dense_output=True)
if not sol.success: raise RuntimeError(sol.message)
def rate(n): return 1/hr(n)
Ncycle0=brentq(lambda n:quad(rate,n,Nstop,epsabs=1e-9,epsrel=2e-7)[0]-2*math.pi,Nstop-.2,Nstop-1e-8)
Nsamp=np.linspace(Ncycle0,Nstop,900); z=sol.sol(Nsamp); H=np.exp(np.array(lnH(Nsamp)))
# Per-unit-X_i^2 cycle-averaged comoving energy in independent quadratures.
Cu=float(np.mean(np.exp(3*Nsamp)*.5*((H*z[1])**2+(M*z[0])**2)))
Cv=float(np.mean(np.exp(3*Nsamp)*.5*((H*z[3])**2+(M*z[2])**2)))
Cuv=float(np.mean(np.exp(3*Nsamp)*.5*((H*z[1])*(H*z[3])+(M*z[0])*(M*z[2]))))
Corth=Cv-Cuv**2/Cu
alpha_opt=math.sqrt(Cu/Corth)
beta_opt=-alpha_opt*Cuv/Cu
# Conserved comoving U(1) charge per unit alpha and X_i^2.
qcycle=np.exp(3*Nsamp)*H*(z[0]*z[3]-z[2]*z[1])
q1=float(np.mean(qcycle))
qstart=math.exp(3*Nstart)*M
alphas=[0,.01,.1,1,10,100,1000,3000,5000,10000]
rows=[]
for alpha in alphas:
    C=Cu+alpha**2*Cv
    Xi=math.sqrt(.1*RHODM/C)
    # Late charge-to-energy fraction, cycle-averaged; <=1 for canonical massive fields.
    zeta=M*abs(alpha*q1)/C
    rho_i=.5*Xi**2*M**2*(1+alpha**2) # initial kinetic+potential; X_N=0,Ydot=alpha*m
    Tr=math.exp(float(lnT(Nstart)))
    rrad=rrT(Nstart)*Tr**4
    rows.append({"initial_rotation_alpha_ydot_over_mX":alpha,"required_initial_field_scale_GeV":Xi,"late_charge_fraction_mn_over_rho":zeta,"initial_scalar_to_radiation_ratio":rho_i/rrad})
Xi_opt=math.sqrt(.1*RHODM/(2*Cu))
charged_samples=[]
for temp_mev in (2.0,1.0,.5,.2,.1,.05):
    T=temp_mev*1e-3
    N=math.log(T0/T*(GS0/dof(T)[1])**(1/3))
    u,up,v,vp=sol.sol(N); H=math.exp(float(lnH(N)))
    y=beta_opt*u+alpha_opt*v; yp=beta_opt*up+alpha_opt*vp
    rho=.5*Xi_opt**2*((H*up)**2+(H*yp)**2+M**2*(u**2+y**2))
    charged_samples.append({"temperature_MeV":temp_mev,"rho_phi_over_radiation":rho/(rrT(N)*T**4)})
result={"status":"finite-temperature two-component harmonic U(1) toy; exploratory charge-bearing abundance screen","model":{"potential":"m^2(X^2+Y^2)/2","mass_eV":MASS_EV,"initial_conditions":"X=Xi, Xdot=0, Y=0, Ydot=alpha*m*Xi at T=10 MeV","symmetry":"exact O(2) rotation of (X,Y); homogeneous Noether charge is conserved","cosmology":"radiation domination; finite-mass e+e- thermodynamics; instantaneous neutrino decoupling at 2 MeV","DM_fraction_normalized":0.1,"general_initial_conditions":"X=Xi, Y=beta*Xi, Xdot=0, Ydot=alpha*m*Xi"},"outputs":{"H_over_m_initial":hr0,"T_initial_MeV":math.exp(float(lnT(Nstart)))*1e3,"T_stop_MeV":math.exp(float(lnT(Nstop)))*1e3,"comoving_charge_relative_drift":float(max(abs(qcycle.min()-qstart),abs(qcycle.max()-qstart))/abs(qstart)),"late_energy_basis_X_GeV2":Cu,"late_energy_basis_rotation_GeV2":Cv,"alpha_for_equal_basis_energy_if_Y_i_zero":math.sqrt(Cu/Cv),"energy_cross_term_X_rotation_basis_GeV2":Cuv,"orthogonal_rotation_basis_energy_GeV2":Corth,"charge_maximizing_initial_conditions":{"alpha_ydot_over_mX":alpha_opt,"beta_Y_i_over_X_i":beta_opt,"late_charge_fraction_mn_over_rho":M*abs(alpha_opt*q1)/(2*Cu),"required_initial_field_scale_GeV":Xi_opt,"initial_Y_over_reference_f":beta_opt*Xi_opt/6.7e17,"required_initial_scalar_fraction_of_radiation_by_temperature":charged_samples,"initial_scalar_to_radiation_ratio":(.5*(.1*RHODM/(2*Cu))*M**2*(1+alpha_opt**2+beta_opt**2))/ (rrT(Nstart)*(math.exp(float(lnT(Nstart)))**4))},"rotation_scan_beta_zero":rows},"numerics":{"solver":"DOP853 rtol=2e-9 atol=2e-11 max_step=0.001 in ln(a)","cycle_comoving_energy_relative_scatter_X":float(np.std(np.exp(3*Nsamp)*.5*((H*z[1])**2+(M*z[0])**2))/Cu),"cycle_comoving_energy_relative_scatter_rotation":float(np.std(np.exp(3*Nsamp)*.5*((H*z[3])**2+(M*z[2])**2))/Cv),"cycle_charge_relative_scatter":float(np.std(qcycle)/abs(q1))},"limitations":["This is a harmonic two-real-component toy, not the exact O(3)/O(2) nonlinear pNGB potential or its radial mode.","The initial rotation alpha is a free parameter; no inflationary, reheating, baryogenesis-like, or other charge-generation mechanism is specified.","Isocurvature for a rotating background, perturbation transfer, structure formation, star fraction, and profile-dependent Q/M are not calculated.","No LZ xenon or Casimir-DP coupling is introduced.","The homogeneous radiation background neglects scalar backreaction; reported early energy fraction is a diagnostic."]}
out=Path(__file__).with_suffix('.json'); out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8'); print(json.dumps(result,indent=2))