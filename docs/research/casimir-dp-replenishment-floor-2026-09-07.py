"""Necessary excitation source and cold-halo kinematic checks."""
import hashlib,json,math
from pathlib import Path
b=Path(__file__).parent;p=b/'casimir-dp-real-vector-survival-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='54747aaf8ba502583dcc42fe19680cafc9d458dfba337f5b1bf7038fb36dac38'
j=json.loads(p.read_text());ckm=299792.458;vesc=544.;vEarth=250.2;rows=[]
for w in j['rows']:
 if not w['real_vector_decay_open']:continue
 m=w['mchi_GeV'];d=w['gap_GeV'];cap=w['coupling_caps'][-1];assert abs(cap['gB_cap']-4*math.pi)<1e-12
 tau=cap['max_partial_lifetime_s_at_reference'];number=.3/m
 floor=number/tau
 # At S=x*f=1 and tau(x)<=tau_ref/x, loss n*f/tau >= n/tau_ref.
 for x in [1.,2.,10.,1e6]:assert abs((number/x)/(tau/x)/floor-1)<1e-12
 selfKE=m*(2*vesc/ckm)**2/4
 stationaryKE=m*((vesc+vEarth)/ckm)**2/2
 rows.append(dict(mchi_GeV=m,mediator_GeV=w['mediator_GeV'],gap_GeV=d,max_halo_pair_CM_kinetic_GeV=selfKE,min_relative_speed_for_one_excitation_km_s=ckm*math.sqrt(4*d/m),cold_halo_single_excitation_open=selfKE>=d,cold_halo_double_excitation_open=selfKE>=2*d,max_stationary_target_available_GeV=stationaryKE,any_stationary_free_target_excitation_possible=stationaryKE>=d,min_gross_excitation_source_cm3_s=floor,gross_gap_energy_throughput_W_m3=floor*d*1.602176634e-10*1e6,max_reference_halo_decay_length_m=(vesc+vEarth)*1000*tau))
out=dict(scope='Necessary steady-state source at selected raw Xe normalization, same cold halo, density .3 GeV/cm3, gB cap4pi and decay result. No inverse-vector absorption, high-energy source, medium energy release, or spatial transport solution. Energy throughput is not net heating or an external-power limit.',source_relation='S=xf=1, tau<=tau_ref/x implies excitation source >= n/tau_ref independent of x.',rows=rows,checks=dict(source_scaling_cancels=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
