"""Joint force/bubble-drift screen within the frozen matching family."""
import hashlib,json,math
from pathlib import Path
from scipy.optimize import brentq
base=Path(__file__).parent
parent=base/'casimir-dp-portal-force-tradeoff-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='aed8e933f0bcf17c764f6e403e50ef4a3e2e9ee1d8d54055fb637fe26eed5d2f'
mod={'__file__':str(parent)};exec(compile(parent.read_text().split('\nbmin=')[0],str(parent),'exec'),mod)
src=base/'casimir-dp-portal-pair-loop-drift-2026-09-07.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='903a031c1c18f918f7ffb3cfb942909c783f3f1f09b7029d5258699e0a7b6b7a'
p=json.loads(src.read_text());point=mod['point'];I=p['bubble_log_difference']
halo=base/'casimir-dp-portal-common-halo-2026-09-07.json'
assert hashlib.sha256(halo.read_bytes()).hexdigest()=='26bafe5f48f23336b05ed36de6781b04025d738ae64220aee5c27a2384fe4e1a'
D=next(r['D_local_perpendicular_to_wind_upper'] for r in json.loads(halo.read_text())['rows'] if r['halo']=='central' and r['mass_GeV']==1000)
ref=point(100.);rows=[]
for tol in [.01,.1,.3]:
    threshold=tol*16*math.pi**2/I
    b=brentq(lambda b:point(b)['lambda_threshold_shift']-threshold,2.82,100.,xtol=1e-12)
    r=point(b);freq=r['required_confinement_frequency_Hz'];bounds=[]
    for label,fcap in [('diagnostic_free_hold_10percent',math.acosh(1.1)/(.25*2*math.pi)),('1kHz',1e3),('10kHz',1e4),('100kHz',1e5),('1MHz',1e6)]:
        scale=min(1.,(fcap/freq)**2)
        bounds.append({'force_allowance_label':label,'allowed_curvature_frequency_Hz':fcap,'light_product_scale_ceiling_relative_to_reference':scale,'lambda_effective_min':r['lambda_effective_for_same_light_product']/scale,'conditional_common_halo_rigid_vacuum_D_upper':D*scale*scale})
    rows.append({'declared_cross_scale_loop_tolerance':tol,'Delta_lambda_ceiling':threshold,'matched_point':r,'conditional_force_and_signal_bounds':bounds})
checks={'joint_loop_boundary':all(math.isclose(r['matched_point']['lambda_threshold_shift']*I/(16*math.pi**2),r['declared_cross_scale_loop_tolerance'],rel_tol=1e-12) for r in rows),'force_loop_product_identity':all(math.isclose(r['matched_point']['required_confinement_frequency_Hz']**2*r['Delta_lambda_ceiling'],ref['required_confinement_frequency_Hz']**2*ref['lambda_threshold_shift'],rel_tol=1e-12) for r in rows),'declared_yukawa_domain':all(r['matched_point']['y_squared_over_4pi']<1 and r['matched_point']['threshold_over_4pi']<1 for r in rows),'inherited_Higgs_screen':all(r['matched_point']['passes_conditional_Higgs_screen'] for r in rows)}
assert all(checks.values())
out={'checks':checks,'rows':rows,'scope':'Restricted fixed C,aN,mu,heavy-mass family, explicit loop-drift tolerances, chamber-only force curvature and conditional vacuum local envelope. Weaken light product only; no actual trap assumption, full combined apparatus, loop matching or full portal viability.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'ten_percent':rows[1]},indent=2))
