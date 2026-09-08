"""Conditional LO matching and independent single-particle spin checks; no fit."""
import json
from pathlib import Path
import numpy as np
from numpy.polynomial.hermite import hermgauss

mn, mpi, meta, ga, octet = .939, .13498, .547862, 1.2723, .583
gchi, gu, ma, mchi = 1.36, 5.6e-5, 1., 400.
hc = .1973269804  # GeV fm

def matching(q, B0):
    pion = mn*B0*ga/(mpi**2+q*q)
    eta = mn*B0*octet/(3*(meta**2+q*q))
    return np.array([pion+eta, -pion+eta])

def kL(q, b):
    y = (q*b/(2*hc))**2
    return -(1+2*y)*np.exp(-y)/3

def kT(q, b):
    y = (q*b/(2*hc))**2
    return -(1-2*y)*np.exp(-y)/3

# Independent Cartesian oscillator-density quadrature. p_z density has 2z^2
# relative to the normalized Gaussian; p_(+1) has x^2+y^2.
x, weights = hermgauss(100)
weights = weights/np.sqrt(np.pi)
errors = []
for q in [0., .03, .10, .20, .30]:
    for b in [1.4, 1.7, 2.0]:
        phase = np.cos(q*b*x/hc)
        fz = np.sum(weights*2*x*x*phase)
        fxy = np.sum(weights*phase)  # <x^2+y^2> = 1
        longitudinal = fz/3-2*fxy/3
        errors.append(abs(longitudinal-kL(q,b)))

# Spin-averaged squared reduced potential for a free spin-half nucleon.
S = [np.array([[0,1],[1,0]],complex)/2,
     np.array([[0,-1j],[1j,0]],complex)/2,
     np.diag([1.,-1.])/2]
trace_errors = []
for vec in [np.array([0.,0.,.1]), np.array([.03,.04,.05])]:
    q2 = vec@vec
    spin = sum(v*s for v,s in zip(vec,S))
    V = np.kron(spin,spin)/(mchi*mn)  # d4=1, sign immaterial here
    average = np.trace(V.conj().T@V).real/4
    trace_errors.append(abs(average/(q2*q2/(16*mchi*mchi*mn*mn))-1))

rows = []
for B0 in [2.7,3.0]:  # explicit sensitivity inputs, NOT a confidence interval
    for q in [0., .001, .05, .10, .246]:
        gp,gn = matching(q,B0)
        rows.append(dict(B0_GeV=B0,q_GeV=q,gbar_p=float(gp),gbar_n=float(gn),
                         d4p_GeV_m2=float(gchi*gu*gp/(ma*ma+q*q)),
                         d4n_GeV_m2=float(gchi*gu*gn/(ma*ma+q*q))))

# Independently reproduce radial-scalar/Higgs tree companion at small mixing.
lam, mh, mrho, fn = .1, 125., 1000., .3
Csi = lam*mchi*fn*mn/(mh*mh*mrho*mrho)
mu = mchi*mn/(mchi+mn)
sigma = mu*mu*Csi*Csi/np.pi*.3893793721e-27
checks = {"Cartesian_C13_longitudinal_matches": max(errors)<1e-12,
          "free_nucleon_spin_trace_matches": max(trace_errors)<1e-12,
          "zero_q_C13_projection": abs(kL(0,1.7)+1/3)<1e-14,
          "longitudinal_not_transverse": abs(kL(.2,1.7)-kT(.2,1.7))>.1,
          "scalar_companion_order_reproduced": 5e-47<sigma<7e-47}
checks = {k:bool(v) for k,v in checks.items()}
assert all(checks.values()), checks
out = dict(maturity="conditional one-body derivation; not a joint rate prediction",
           source="https://arxiv.org/html/1707.06998v2",
           axion_source="https://arxiv.org/html/2609.04186v1",
           matching_scope="LO pion+eta only; B0 sensitivity inputs, nonpole terms not fixed",
           rows=rows, max_quadrature_error=max(errors), checks=checks,
           scalar_companion_C_GeV_m2=Csi, scalar_companion_sigma_cm2=sigma,
           C13_scope="closed C12 core plus one p1/2 neutron; oscillator approximation",
           joint_prediction_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
