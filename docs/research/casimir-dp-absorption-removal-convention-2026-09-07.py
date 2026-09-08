"""Spectator recoil bookkeeping for intrinsic removal energy, not an absorption rate."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
datafile=base/'casimir-dp-absorption-spectral-intake-2026-09-07/benhar-sf-12c.data'
assert hashlib.sha256(datafile.read_bytes()).hexdigest()=='951d532b7b2430a1eb5d8d7c3a5d434b703956afa828bb0b462dd5e17dacac3e'
data=np.loadtxt(datafile);p=data[:,0]/1000;E=data[:,1]/1000
w=data[:,2]*p*p;w=w/w.sum()
m=.247;M=.939 # same diagnostic nucleon mass as prior kernel, not a neutron data fit
MA=12*.93149410242-6*.00051099895
MR=MA-M+E
res_energy=np.sqrt(MR*MR+p*p)
TR=p*p/(res_energy+MR)
p0=MA-res_energy
Q=m+p0;s=Q*Q-p*p
allowed=(Q>0)&(s>M*M)
oldQ=m+M-E;oldallowed=(oldQ>0)&(oldQ*oldQ-p*p>M*M)
# Exact spectator identity and nonrelativistic recoil comparison.
checks=dict(spectator_energy_conservation=bool(np.max(abs(p0+res_energy-MA))<1e-12),
            removal_identity=bool(np.max(abs(p0-(M-E-TR)))<1e-12),
            recoil_nonnegative=bool(np.all(TR>=0)),
            support_cannot_grow=bool(np.all(~allowed|oldallowed)))
assert all(checks.values())
out=dict(scope='Assumes table E is intrinsic separation plus excitation and residual mass MA-M+E. Only a conditional kinematic audit on normalized legacy proton weights. Not a neutron spectral function, off-shell current model, or rate.',checks=checks,m_GeV=m,M_GeV=M,MA_GeV=MA,weighted_mean_residual_recoil_MeV=float(1000*np.dot(w,TR)),largest_tabulated_recoil_MeV=float(1000*TR.max()),open_weight_without_recoil=float(w[oldallowed].sum()),open_weight_with_recoil=float(w[allowed].sum()),mean_NR_recoil_error_MeV=float(1000*np.dot(w,p*p/(2*MR)-TR)))
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
