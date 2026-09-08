"""Companion classical force/trajectory audit for the same illustrative scalar point."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
src=base/'casimir-dp-portal-spherical-chamber-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='e33690bdcb47b37b8953912893c62337250a99ed4fbeddc692e168e50795f01f'
bg=json.loads(src.read_text());match=base/'casimir-dp-portal-matched-density-2026-09-06.json'
assert hashlib.sha256(match.read_bytes()).hexdigest()=='2342070b54b1cce63ad4cda9947068d293fb32fd55c07132eaa257df1186d4b8'
p=json.loads(match.read_text());cfg=base.parent.parent/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design'];mu=bg['mu_eV'];hc=1.973269804e-7;c=299792458.;lam=1e-24;vev=(mu*1e-9)/math.sqrt(lam)
coeff=p['a_N_GeV_inverse']/.939*vev**2
rows=[];errors=[]
for r in bg['rows']:
    u=r['central_field_fraction'];curv=u*(u*u-1)/3
    omega2=c*c*coeff*(mu/hc)**2*u*u*(1-u*u)/3;omega=math.sqrt(omega2)
    # Fit the first few background samples to the regular even-power origin series.
    pr=r['profiles'][0];x=np.array(pr['r_um'][1:9])*1e-6*mu/hc;y=np.array(pr['u'][1:9])-u
    scale=max(x);z=x/scale;fit=np.linalg.lstsq(np.column_stack([z**2,z**4,z**6]),y,rcond=None)[0]
    numerical_curv=2*fit[0]/scale**2;errors.append(abs(numerical_curv/curv-1))
    free_scale=(omega*d['hold_time_s']/math.acosh(1.1))**2
    rows.append({'cavity_radius_um':r['radius_um'],'wall_thickness_um':r['thickness_um'],'outward_curvature_s_inverse_squared':omega2,'minimum_harmonic_confinement_frequency_Hz':omega/(2*math.pi),'initial_acceleration_at_half_separation_m_s2':omega2*d['branch_separation_m']/2,'initial_force_N':d['mass_kg']*omega2*d['branch_separation_m']/2,'free_hold_10percent_growth_time_s':math.acosh(1.1)/omega,'lambda_min_for_diagnostic_10percent_free_hold':lam*free_scale,'light_vertex_product_scale_at_that_lambda':1/free_scale})
checks={'origin_profile_curvature':max(errors)<.01,'all_curvatures_destabilizing':all(r['outward_curvature_s_inverse_squared']>0 for r in rows),'force_acceleration_units':all(math.isclose(r['initial_force_N']/r['initial_acceleration_at_half_separation_m_s2'],d['mass_kg'],rel_tol=1e-12) for r in rows),'ten_percent_free_growth_inversion':all(math.isclose(math.cosh(2*math.pi*r['minimum_harmonic_confinement_frequency_Hz']*r['free_hold_10percent_growth_time_s']),1.1,rel_tol=1e-12) for r in rows)}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out={'checks':checks,'max_origin_curvature_relative_error':max(errors),'fractional_mass_coupling_coefficient':coeff,'lambda_illustrative':lam,'rows':rows,'scope':'Weak-self-screened sphere in hypothetical shell backgrounds, classical force at center, leading nonrelativistic mass coupling. No authenticated trap stiffness; free-hold ten percent is an explicit diagnostic, not a frozen acceptance rule. No irreversible decoherence inferred from deterministic force.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))

