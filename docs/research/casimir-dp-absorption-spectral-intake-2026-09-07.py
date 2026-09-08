"""Legacy carbon spectral-table provenance and radial measure audit."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).with_suffix('')
manifest=json.loads((base/'manifest.json').read_text(encoding='utf-8-sig'))
for item in manifest['files']:
    data=(base/item['file']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==item['sha256']
    assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==item['git_blob']
data=np.loadtxt(base/'benhar-sf-12c.data');mom=np.unique(data[:,0]);energy=np.unique(data[:,1])
assert data.shape[0]==len(mom)*len(energy)
S=np.empty((len(mom),len(energy)))
for p,e,value in data:S[np.searchsorted(mom,p),np.searchsorted(energy,e)]=value
dp=float(np.diff(mom)[0]);de=float(np.diff(energy)[0])
weight=S*mom[:,None]**2
normalization=float(weight.sum()*dp*de)
prob=weight/weight.sum()
trap=float(np.trapezoid(np.trapezoid(weight,energy,axis=1),mom))
meanp=float((prob*mom[:,None]).sum());meanE=float((prob*energy[None,:]).sum())
# Conditional support only: p_N^0=M-Erem, no residual recoil correction.
m=.247;M=.939;pg=mom[:,None]/1000;eg=energy[None,:]/1000
openmask=(m+M-eg>0)&((m+M-eg)**2-pg**2>M*M)
checks=dict(hashes=True,regular_grid=bool(np.allclose(np.diff(mom),dp) and np.allclose(np.diff(energy),de)),nonnegative=bool(np.all(S>=0)),unit_probability=math.isclose(float(prob.sum()),1,rel_tol=1e-12))
checks['six_nucleon_normalization']=math.isclose(4*math.pi*normalization,6,rel_tol=1e-5)
assert all(checks.values())
out=dict(scope='Legacy table intake. Midpoint-cell probability normalized only on tabulated support; not a physical rate or uncertainty interval. Loader radial p^2 applied once.',checks=checks,shape=list(S.shape),momentum_centers_MeV=[float(mom[0]),float(mom[-1])],removal_energy_centers_MeV=[float(energy[0]),float(energy[-1])],cell_widths_MeV=[dp,de],radial_integral_in_table_units=normalization,fourpi_radial_integral=4*math.pi*normalization,trap_integral_on_center_support=trap,mean_momentum_MeV=meanp,mean_removal_energy_MeV=meanE,conditional_fraction_kinematically_open=float(prob[openmask].sum()),fraction_removal_above_247MeV=float(prob[:,energy>.247*1000].sum()),full_response_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
