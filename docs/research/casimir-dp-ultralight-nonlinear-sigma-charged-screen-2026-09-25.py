#!/usr/bin/env python3
"""Exact O(3)/O(2) fixed-radius sigma-model continuation of charged pNGB toy.

The radial mode is frozen at f. The soft-breaking potential is exactly
V=(1/2)m^2 f^2 sin(theta)^2. This is nonlinear in angular coordinates and
preserves the residual U(1) charge. It remains a homogeneous exploratory model.
"""
from __future__ import annotations
import json, math
from pathlib import Path
import numpy as np
from scipy.integrate import quad, solve_ivp
from scipy.interpolate import PchipInterpolator
from scipy.optimize import brentq

MASS_EV=1e-17; M=MASS_EV*1e-9; F=6.7e17; TARGET_FRACTION=.1
OMEGA_H2=.1198; HRED=.674; MRED=2.435e18; ME=.51099895e-3
TNU=2e-3; T0=2.348e-13; GS0=3.91; G_NU=5.25
H0=67.4/3.0856775814913673e19*6.582119569e-25
RHOC=3*H0**2*MRED**2; RHODM=OMEGA_H2/HRED**2*RHOC
ALPHA=678772.562466697; BETA=-150.92778505790557

def epair(y):
    def occ(x):
        e=math.hypot(x,y); return 0.0 if e>700 else 1/(math.exp(e)+1)
    r=4/(2*math.pi**2)*quad(lambda x:x*x*math.hypot(x,y)*occ(x),0,np.inf,epsrel=2e-8)[0]
    p=4/(6*math.pi**2)*quad(lambda x:x**4/math.hypot(x,y)*occ(x),0,np.inf,epsrel=2e-8)[0]
    return r,p

def dof(T):
    re,pe=epair(ME/T); gs_em=2+45/(2*math.pi**2)*(re+pe)
    rd,pd=epair(ME/TNU); gs_dec=2+45/(2*math.pi**2)*(rd+pd)
    tnr=1 if T>=TNU else (gs_em/gs_dec)**(1/3)
    rr=math.pi**2/15+re+math.pi**2/30*G_NU*tnr**4
    return 30/math.pi**2*rr,gs_em+G_NU*tnr**3,rr

Ts=np.geomspace(1e-6,1e-2,420); gs=[]; gss=[]; rr=[]
for t in Ts:
    a,b,c=dof(float(t)); gs.append(a); gss.append(b); rr.append(c)
gs=np.array(gs); gss=np.array(gss); rr=np.array(rr)
Ns=np.log(T0/Ts*(GS0/gss)**(1/3)); ix=np.argsort(Ns)
Ns=Ns[ix]; Ts=Ts[ix]; gs=gs[ix]; rr=rr[ix]
lnH=PchipInterpolator(Ns,.5*np.log(math.pi**2/30*gs*Ts**4/(3*MRED**2)))
dlnH=lnH.derivative(); lnT=PchipInterpolator(Ns,np.log(Ts)); rrT=PchipInterpolator(Ns,rr)
TSTART=1e-2; NSTART=math.log(T0/TSTART*(GS0/dof(TSTART)[1])**(1/3))
NSTART=max(NSTART,float(Ns.min()))
def hr(n): return math.exp(float(lnH(n)))/M
HR0=hr(NSTART); A0=math.exp(NSTART)
TMIN=brentq(lambda n:hr(n)-.01,NSTART,float(Ns.max()))

def init_for_Xi(Xi):
    s=Xi*math.sqrt(1+BETA**2)/F
    if not 0<s<1: raise ValueError('initial transverse field leaves sigma-model chart')
    theta=math.asin(s); cost=math.sqrt(1-s*s)
    theta_dot_over_m=BETA*ALPHA*Xi/(F*math.sqrt(1+BETA**2)*cost)
    phi_dot_over_m=ALPHA/(1+BETA**2)
    theta_N=theta_dot_over_m/HR0
    charge=A0**3*s*s*phi_dot_over_m
    return theta,theta_N,charge

def evolve(Xi, dense=False):
    theta_i,thetaN_i,charge=init_for_Xi(Xi)
    def rhs(n,z):
        theta,thetaN=z
        sn=math.sin(theta); cs=math.cos(theta)
        phi_dot_over_m=charge/(math.exp(3*n)*sn*sn)
        inv=1/hr(n)
        return thetaN,-(3+float(dlnH(n)))*thetaN-inv**2*sn*cs*(1-phi_dot_over_m**2)
    sol=solve_ivp(rhs,(NSTART,TMIN),(theta_i,thetaN_i),method='DOP853',rtol=1e-9,atol=1e-11,max_step=.001,dense_output=True)
    if not sol.success: raise RuntimeError(sol.message)
    # At H/m=0.01, one late radial period spans approximately 2*pi*H/m
    # in ln(a); use a fixed window to avoid nested oscillatory quadrature.
    start=TMIN-2*math.pi*.01
    grid=np.linspace(start,TMIN,700); state=sol.sol(grid)
    rho=[]; q=[]
    for n,(theta,thetaN) in zip(grid,state.T):
        sn=math.sin(theta); H=math.exp(float(lnH(n)))
        phi_dot_over_m=charge/(math.exp(3*n)*sn*sn)
        energy=.5*F**2*M**2*((H/M)**2*thetaN**2+sn**2*(phi_dot_over_m**2+1))
        rho.append(energy); q.append(math.exp(3*n)*F**2*sn**2*M*phi_dot_over_m)
    comoving=float(np.mean(np.exp(3*grid)*np.array(rho)))
    zeta=float(M*np.mean(q)/comoving)
    return comoving,zeta,sol,charge,(start,grid,state,np.array(rho),np.array(q))

def residual(logXi):
    return evolve(math.exp(logXi))[0]-TARGET_FRACTION*RHODM
Xi=math.exp(brentq(residual,math.log(5e14),math.log(3e15),xtol=2e-8))
C,zeta,sol,charge,cycle=evolve(Xi)
theta_i,thetaN_i,charge_check=init_for_Xi(Xi)
initial_rho=.5*F**2*M**2*(thetaN_i**2*HR0**2+math.sin(theta_i)**2*(1+(charge/(A0**3*math.sin(theta_i)**2))**2))
T_i=math.exp(float(lnT(NSTART)))
rho_rad_i=float(rrT(NSTART))*T_i**4
samples=[]
for t_mev in (2,1,.5,.2,.1,.05):
    T=t_mev*1e-3; n=math.log(T0/T*(GS0/dof(T)[1])**(1/3))
    th,thN=sol.sol(n); sn=math.sin(th); H=math.exp(float(lnH(n)))
    w=charge/(math.exp(3*n)*sn*sn)
    r=.5*F**2*M**2*((H/M)**2*thN**2+sn**2*(w*w+1))
    samples.append({'temperature_MeV':t_mev,'theta_rad':th,'rho_phi_over_radiation':r/(float(rrT(n))*T**4),'m_phi_nQ_over_rho':M*F**2*sn**2*(M*w)/r})
_,grid,state,rho,q=cycle
qrel=float(max(abs(q.min()-np.mean(q)),abs(q.max()-np.mean(q)))/abs(np.mean(q)))
result={'status':'fixed-radius nonlinear O(3)/O(2) sigma-model test; no radial-mode or charge-generation calculation','model':{'action':'L=f^2/2[(d theta)^2+sin(theta)^2(d phi)^2]-m^2 f^2 sin(theta)^2/2','f_GeV':F,'mass_eV':MASS_EV,'soft-breaking_potential':'V=m^2 f^2 sin(theta)^2/2; exact residual U(1) in phi','cosmology':'same finite-temperature e+e- equation of state; instantaneous neutrino decoupling at 2 MeV','initial_condition_map':'Cartesian harmonic-screen alpha,beta mapped to the tangent bundle of the radius-f sphere; Xi then retuned to 10% DM','alpha':ALPHA,'beta':BETA},'outputs':{'initial_Xi_GeV':Xi,'initial_theta_rad':theta_i,'initial_theta_dot_over_m':thetaN_i*HR0,'initial_phi_dot_over_m':charge/(A0**3*math.sin(theta_i)**2),'initial_transverse_radius_over_f':math.sin(theta_i),'initial_scalar_over_radiation':initial_rho/rho_rad_i,'late_m_nQ_over_rho':zeta,'comoving_charge_relative_drift_over_final_cycle':qrel,'cycle_comoving_energy_relative_scatter':float(np.std(np.exp(3*grid)*rho)/np.mean(np.exp(3*grid)*rho)),'BBN_samples':samples},'numerics':{'solver':'DOP853 rtol=1e-9 atol=1e-11 max_step=.001 in ln(a)','thermal_grid_points':len(Ts),'abundance_root':'Brent root in log Xi; repeated integration of nonlinear field equation'},'limitations':['Radial mode is frozen; this is the nonlinear sigma-model limit, not the full linear O(3) theory.','Initial alpha,beta are imported from a harmonic-model optimizer; no physical history generates them.','The abundance is retuned after changing the field-space metric; this is not a prediction from fixed initial conditions.','Rotating-background isocurvature and perturbation transfer, star formation, and profile-dependent Q/M are not computed.','No xenon, gamma-ray, or Casimir-DP observable is coupled to this field.']}
out=Path(__file__).with_suffix('.json'); out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8'); print(json.dumps(result,indent=2))
