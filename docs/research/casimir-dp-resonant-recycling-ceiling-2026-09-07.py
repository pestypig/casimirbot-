"""Optimistic single-resonance absorption ceiling for incoherent recycling."""
import hashlib,json,math
from pathlib import Path
b=Path(__file__).parent;p=b/'casimir-dp-real-vector-survival-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='54747aaf8ba502583dcc42fe19680cafc9d458dfba337f5b1bf7038fb36dac38'
j=json.loads(p.read_text());rows=[];conv=.3893793721e-27;c=2.99792458e10
for w in j['rows']:
 if not w['real_vector_decay_open']:continue
 m=w['mchi_GeV'];d=w['gap_GeV'];v=w['mediator_GeV'];M=m+d
 k=math.sqrt((d*d-v*v)*((M+m)**2-v*v))/(2*M)
 E=d+(d*d-v*v)/(2*m)
 # Independent target-rest momentum converted to the resonant CM frame.
 labp=math.sqrt((E-v)*(E+v));assert abs(k/(labp*m/M)-1)<1e-10
 sigma=16*math.pi*conv/(k*k)
 tau=w['coupling_caps'][-1]['max_partial_lifetime_s_at_reference']
 nV=1/(tau*c*sigma);rho=E*nV
 rows.append(dict(mchi_GeV=m,mediator_GeV=v,resonant_CM_momentum_GeV=k,resonant_lab_vector_energy_GeV=E,adopted_absorption_ceiling_cm2=sigma,min_vector_density_cm3=nV,min_resonant_vector_energy_density_GeV_cm3=rho,ratio_to_frozen_DM_density=rho/.3))
out=dict(scope='Single isolated spin-1/2 resonance, incoherent incident particles near resonance, nonrelativistic ground targets; use16pi/k^2 as a deliberately loose peak ceiling, neglect stimulated losses, allow all targets in ground state and flux speed c. Coupling capgB=4pi retained. Not a coherent-drive, broad-resonance or arbitrary-multichannel bound.',derivation='Rrequired>=n/tau_ref, Rabs<=n*nV*c*sigma_ceiling => nV>=1/(tau_ref*c*sigma_ceiling).',source='https://pdgaws.lbl.gov/2022/reviews/rpp2022-rev-cross-section-formulae.pdf equation51.1',rows=rows,checks=dict(resonant_momentum_two_frames=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
