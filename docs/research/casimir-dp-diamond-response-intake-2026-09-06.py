"""Authenticate diamond dielectric data and map supported halo kinematics; no rate."""
import hashlib,json,math
from pathlib import Path
import h5py
import numpy as np
base=Path(__file__).parent
folder=base/'casimir-dp-diamond-response-2026-09-06'
path=folder/'diamond_comp.h5'
raw=path.read_bytes()
blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
assert blob=='640fbe133a393318e97b9b3856cc869cf309f142'
config=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha=hashlib.sha256(config.read_bytes()).hexdigest()
assert sha=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(config.read_text())['leading_design']
with h5py.File(path) as f:
    q=f['q'][:];E=f['E'][:];eps=f['epsilon'][:];attrs={k:float(v) for k,v in f.attrs.items()}
alpha=1/137.03599908;me=5.1099894e5;ame=alpha*me;hc=1.973269804e-7
elf=np.imag(eps)/np.abs(eps)**2
checks={'published_blob_hash':True,'shape_matches_axes':eps.shape==(len(q),len(E)),
        'finite_data':bool(np.isfinite(eps).all()),'increasing_axes':bool((np.diff(q)>0).all() and (np.diff(E)>0).all()),
        'ELF_passivity_with_roundoff_tolerance':bool(elf.min()>-1e-14)}
rows=[]
for speed in [776.,809.1]:
    v=speed/299792.458
    for mass in [100.,1000.]:
        m=mass*1e9
        for omega in [5.5,30.,150.]:
            root=math.sqrt(v*v-2*omega/m)
            qminus=2*omega/(v+root);qplus=m*(v+root)
            rows.append({'speed_km_s':speed,'mass_GeV':mass,'omega_eV':omega,
                         'qminus_eV':qminus,'qplus_eV':qplus,'qminus_R_over_hbar':qminus*d['radius_m']/hc,
                         'grid_has_kinematic_overlap':bool(q[-1]*ame>qminus and q[0]*ame<qplus),
                         'grid_covers_whole_kinematic_q_interval':bool(q[0]*ame<=qminus and q[-1]*ame>=qplus)})
checks['lower_root_energy_equation']=all(abs(r['qminus_eV']*r['speed_km_s']/299792.458-r['qminus_eV']**2/(2*r['mass_GeV']*1e9)-r['omega_eV'])<1e-10 for r in rows)
assert all(checks.values())
records=[]
for entry in sorted(folder.iterdir()):
    if entry.is_file():records.append({'name':entry.name,'bytes':entry.stat().st_size,'sha256':hashlib.sha256(entry.read_bytes()).hexdigest()})
out={'upstream_commit':'6d22f936bf49a15db73a24d1274dcc63c37780dd','config_sha256':sha,'dataset_git_blob':blob,
     'sources':records,'checks':checks,'q_grid_ame':[float(q[0]),float(q[-1])],
     'q_grid_eV':[float(q[0]*ame),float(q[-1]*ame)],'energy_grid_eV':[float(E[0]),float(E[-1])],
     'epsilon_shape':list(eps.shape),'hdf5_attributes':attrs,'ELF_min':float(elf.min()),
     'negative_ELF_cells_roundoff':int((elf<0).sum()),'kinematics':rows,
     'status':'Authenticated density-response input only. No spin-density response, photon-dipole rate or completeness claim.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'q_grid_eV':out['q_grid_eV'],'first_kinematics':rows[0],
                 'negative_ELF_cells_roundoff':out['negative_ELF_cells_roundoff']},indent=2))
