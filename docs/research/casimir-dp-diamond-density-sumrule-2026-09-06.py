"""Thresholded f-sum ceiling for the specified nonrelativistic density kernel."""
import hashlib,json,math
from pathlib import Path
import h5py
import numpy as np
from scipy.integrate import quad,simpson
base=Path(__file__).parent
prior=base/'casimir-dp-diamond-density-rate-2026-09-06.json'
assert hashlib.sha256(prior.read_bytes()).hexdigest()=='39d3554dfbf1e498cda44feada20d83d3fc72a6548ba2b56284dd6eb4b00e4c7'
p=json.loads(prior.read_text())
data=base/'casimir-dp-diamond-response-2026-09-06/diamond_comp.h5'
assert hashlib.sha256(data.read_bytes()).hexdigest()=='77ed914ab0f330028c62e4c1a5f2005a2a3d38b683ca431a8fb8f37157c29021'
alpha=1/137.03599908;me=5.1099894e5;v=776/299792.458;threshold=5.5
with h5py.File(data) as f:
    wp2=4*math.pi*alpha*12*(alpha*me)**3/float(f.attrs['V_cell'])/me
    q=f['q'][:]*(alpha*me);w=f['E'][:];eps=f['epsilon'][:]
elf=eps.imag/abs(eps)**2
moment=simpson(w[None,:]*elf,x=w,axis=1)
budget=math.pi*wp2/2
fractions=moment/budget
rows=[];errors=[]
for r in p['rows']:
    m=r['mass_GeV']*1e9;root=math.sqrt(v*v-2*threshold/m)
    lower=2*threshold/(v+root);upper=m*(v+root)
    for cap in [float(q[-1]),100000.,upper]:
        high=min(cap,upper)
        # K(omega)/omega = v²/omega - 1/m - omega/q² decreases with omega.
        exact=budget*((v*v/threshold-1/m)*(high*high-lower*lower)/2-threshold*math.log(high/lower))
        numerical=budget*quad(lambda t:(v*v/threshold-1/m)*math.exp(2*t)-threshold,math.log(lower),math.log(high),epsabs=1e-7)[0]
        errors.append(abs(numerical/exact-1))
        scale=exact/r['grid_integral_eV3']
        rows.append({'mass_GeV':r['mass_GeV'],'q_cap_eV':cap,'formal_all_q_NR_extension':cap==upper,'integral_ceiling_eV3':exact,'ceiling_over_prior_grid_integral':scale,'D_density_threshold_ceiling':r['D_density_grid_upper']*scale,'ratios':[{'window_keV':x['window_keV'],'D_ceiling_per_raw_Xe_count':x['D_density_grid_upper_per_raw_Xe_count']*scale} for x in r['xenon']]})
checks={'positive_spectral_moments':bool((moment>=-1e-12).all()),'grid_partial_fsum_no_overshoot':bool((fractions<=1.001).all()),'closed_form_log_quadrature_agree':max(errors)<1e-10,'ceiling_exceeds_prior_grid':all(r['ceiling_over_prior_grid_integral']>1 for r in rows)}
assert all(checks.values())
out={'checks':checks,'all_electron_plasma_energy_eV':math.sqrt(wp2),'grid_partial_fsum_fraction_max':float(fractions.max()),'grid_partial_fsum_fraction_min':float(fractions.min()),'threshold_eV':threshold,'rows':rows,'scope':'Positive longitudinal density response, omega>=5.5 eV, all-electron nonrelativistic f-sum and prior dipole kernel. Formal all-q extension is not a relativistically valid physical bound. No below-threshold, spin, transverse-current or mixed response bound.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
