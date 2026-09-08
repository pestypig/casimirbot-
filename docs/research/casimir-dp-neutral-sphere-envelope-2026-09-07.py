"""Conditional sphere-scale elastic decoherence envelope for neutral spherical cells."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
p=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(p.read_text())['leading_design']
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
hc=1.973269804e-7;qc=hc/d['radius_m'];N=d['mass_kg']/(12*1.66053906892e-27);v=776/299792.458
rr=1e-10
pref=.003*776e5*d['hold_time_s']*8*math.pi/v**2*(hc*100)**2*N*N*36
rows=[]
for r in json.loads(p.read_text())['rows']:
 ms=[x*1e9 for x in r['masses_GeV']];cs=r['effective_alpha_products']
 def integrand(q):
  A=sum(c/(q*q+m*m) for c,m in zip(cs,ms))
  return q*A*A*(q*q*rr*rr/(6*hc*hc))**2*(q*q*d['branch_separation_m']**2/(6*hc*hc))
 value=quad(integrand,0,qc,epsabs=1e-80,epsrel=1e-10)[0]*pref
 # Replacing |A| by sum |alpha|/m² gives a larger analytic q^7 moment.
 analytic=pref*sum(abs(c)/(m*m) for c,m in zip(cs,ms))**2*rr**4*d['branch_separation_m']**2/(216*hc**6)*qc**8/8
 assert 0<value<=analytic
 rows.append(dict(masses_GeV=r['masses_GeV'],conditional_partial_D_upper=value,analytic_absolute_amplitude_upper=analytic))
out=dict(status='conditional_neutral_cell_partial_upper_envelope',q_ceiling_eV=qc,
 assumed_electronic_rms_radius_m=rr,radius_scaling='upper envelope proportional to assumed rms radius^4',rows=rows,
 assumptions=['Born elastic density coupling to identical neutral spherically symmetric carbon cells',
 'point nuclei and nonnegative normalized electron clouds with stated rms radius',
 'isotropic incident directions, fixed separated branches during hold',
 'maximal N² positional coherence, no sphere form-factor suppression used'],
 limitations=['0.1 nm is an explicit radius hypothesis, not an authenticated diamond charge density',
 'only q <= hbar/R; not all low-q scattering or total decoherence',
 'surface charge, permanent multipoles, crystal bonding and induced response not included',
 'no population supply, full branch history or physical viability claim'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
