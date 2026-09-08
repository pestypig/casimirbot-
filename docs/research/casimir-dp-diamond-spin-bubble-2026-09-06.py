"""Independent spin-degenerate Kohn-Sham bubble diagnostic, not measured spin response."""
import hashlib,json,math
from pathlib import Path
import h5py
import numpy as np
from scipy.integrate import simpson,trapezoid
base=Path(__file__).parent;folder=base/'casimir-dp-diamond-spin-response-2026-09-06'
raw=(folder/'diamond_nolfe.h5').read_bytes()
blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
assert blob=='775bab519afc75d424ae1fc499b09b54b42384a3'
prior=base/'casimir-dp-diamond-density-rate-2026-09-06.json'
assert hashlib.sha256(prior.read_bytes()).hexdigest()=='39d3554dfbf1e498cda44feada20d83d3fc72a6548ba2b56284dd6eb4b00e4c7'
p=json.loads(prior.read_text());alpha=1/137.03599908;me=5.1099894e5;v=776/299792.458
with h5py.File(folder/'diamond_nolfe.h5') as f:
    q=f['q'][:]*alpha*me;w=f['E'][:];eps=f['epsilon'][:]
    assert str(f.attrs['include_lfe']).lower()=='false'
assert eps.imag.min()>-1e-14
sel=w>=5.5;w=w[sel];spectral=np.maximum(eps[:,sel].imag,0)
rows=[]
for r in p['rows']:
    m=r['mass_GeV']*1e9
    admitted=w[None,:]/q[:,None]+q[:,None]/(2*m)<=v
    integrand=q[:,None]**3/(2*me**2)*spectral*admitted
    I=float(simpson(simpson(integrand,x=w,axis=1),x=q))
    alt=float(trapezoid(trapezoid(integrand,x=w,axis=1),x=q))
    scale=I/r['grid_integral_eV3']
    rows.append({'mass_GeV':r['mass_GeV'],'spin_integral_eV3':I,'spin_to_prior_density_rate':scale,'quadrature_relative_difference':abs(alt/I-1),'D_spin_grid_upper':r['D_density_grid_upper']*scale,'ratios':[{'window_keV':x['window_keV'],'D_spin_grid_upper_per_raw_Xe_count':x['D_density_grid_upper_per_raw_Xe_count']*scale} for x in r['xenon']]})
sx=np.array([[0,1],[1,0]],complex)/2;sy=np.array([[0,-1j],[1j,0]])/2
# Amplitude stripped of e*mu/me, for q along z and two spin-half particles.
A=2*(np.kron(sx,sx)+np.kron(sy,sy))
avg=float(np.trace(A@A.conj().T).real/4)
checks={'free_spin_half_amplitude_normalization':math.isclose(avg,.5,rel_tol=1e-12),'spin_bubble_trace_factor':math.isclose(np.trace(sx@sx).real/np.trace(np.eye(2)),.25),'positive_rates':all(r['spin_integral_eV3']>0 for r in rows),'quadrature_agreement_one_percent':all(r['quadrature_relative_difference']<.01 for r in rows)}
assert all(checks.values())
out={'checks':checks,'rows':rows,'archive_blob':blob,'archive_sha256':hashlib.sha256(raw).hexdigest(),'upstream_commit':'6d22f936bf49a15db73a24d1274dcc63c37780dd','sources':[{'name':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(folder.iterdir()) if f.is_file()],'scope':'Spin-degenerate independent KS bubble, no spin-orbit/exchange vertex/defects, angular-averaged no-LFE Im(epsilon), finite 5.5..150 eV and tabulated q. Not an exact spin susceptibility or complete magnetic-dipole prediction.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'rows':rows},indent=2))
