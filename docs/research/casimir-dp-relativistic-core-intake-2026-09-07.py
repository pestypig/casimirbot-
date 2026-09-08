"""Authenticate a xenon ionization source and audit free-electron kinematics."""
import hashlib, json, math, subprocess, sys
from pathlib import Path
from io import StringIO
import numpy as np
from scipy.optimize import brentq

root=Path(sys.argv[1])
commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
assert commit=='b448a86a7660808bc5123d8a54e943e5a61994f7'
p=root/'tables/K_Xe_hf_v_6_hp_orth_mat.txt'
b=p.read_bytes(); normalized=b.replace(b'\r',b'')
assert hashlib.sha256(normalized).hexdigest()=='bcdc6de584619d833cb5e1645f7a8f81d8aa8128098935a97b0dd7f902d1c031'
parts=normalized.decode().strip().split('\n\n')
assert len(parts)==4
E,q,K=[np.loadtxt(StringIO(x)) for x in parts[1:]]
assert K.shape==(len(E),len(q))==(256,1024)
assert np.all(np.diff(E)>0) and np.all(np.diff(q)>0)
assert np.isfinite(K).all() and (K>=0).all()
EH=27.2114; qa=3728.94; me=510998.95; m=1e11; v=776/299792.458
def free(q):return q*q/(math.sqrt(me*me+q*q)+me)
def cap(q):return q*v-q*q/(2*m)
cross=brentq(lambda q:free(q)-cap(q),1,1e5)
rows=[dict(q_eV=x,free_electron_transfer_eV=free(x),incident_energy_ceiling_eV=cap(x)) for x in [37289.5,2e5,1e6,5e6]]
assert all(r['free_electron_transfer_eV']>r['incident_energy_ceiling_eV'] for r in rows)
out=dict(status='source_intake_and_kinematic_diagnostic_not_rate',commit=commit,
 source_url='https://github.com/benroberts999/AtomicIonisation',
 raw_local_sha256=hashlib.sha256(b).hexdigest(), normalized_no_CR_sha256=hashlib.sha256(normalized).hexdigest(),
 energy_range_eV=[float(E[0]*EH),float(E[-1]*EH)],momentum_range_eV=[float(q[0]*qa),float(q[-1]*qa)],
 shape=list(K.shape),zeros=int((K==0).sum()),free_stationary_electron_q_endpoint_eV=cross,
 kinematic_rows=rows,
 interpretation=['a stationary free electron cannot realize the high-q f-sum allocation',
 'bound electrons and the recoiling atom can permit high-q low-energy ionization; free endpoint is not an atomic cutoff',
 'vector Gamma=1 table matches the electron density vertex of the current charge-coupled lead',
 'Xe table enables a separate electron-recoil prediction, not a silica stopping substitution'],
 next_checks=['match K normalization and Hartree units to shared mediator products',
 'preserve zeros and prohibit out-of-domain interpolation; example log interpolator has unsafe outside fill',
 'audit partial-wave L=6 convergence and omitted momentum above 5 MeV',
 'fold a covered raw xenon electron spectrum through appropriate detector response before claiming a constraint'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
