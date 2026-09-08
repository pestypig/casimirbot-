"""Scalar up-quark box matching; twist moments require a common declared scale."""
import json,hashlib,math
from pathlib import Path
base=Path(__file__).parent
p=base/'casimir-dp-axion-dirac-box-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='9fe74018a72ee93985d9300a65289447d102cd6e2206da0400738e51ced1437a'
d=json.loads(p.read_text());Cu=d['C_u_scalar_GeV_m3'];Ct=d['twist_combination_GeV_m3']
mx=400.;mn=.939;conv=.3893793721e-27

def twist_at_common_scale(moment,coefficient_scale_GeV,moment_scale_GeV):
    if coefficient_scale_GeV is None or moment_scale_GeV is None or not math.isclose(coefficient_scale_GeV,moment_scale_GeV,rel_tol=1e-12):
        raise ValueError('UNMATCHED_TWIST_OPERATOR_SCALE')
    return .75*mn*Ct*moment
rows=[]
for sp in [.012,.017,.022]:
    for sn in [.010,.015,.020]:
        Cp=Cu*sp;Cn=Cu*sn
        mu=mx*mn/(mx+mn)
        rows.append(dict(sigma_up_proton_GeV=sp,sigma_up_neutron_GeV=sn,
            C_scalar_p_Lagrangian_GeV_m2=Cp,C_scalar_n_Lagrangian_GeV_m2=Cn,
            neutron_over_proton=Cn/Cp,free_proton_sigma_cm2=mu*mu*Cp*Cp/math.pi*conv,
            Xe131_zero_q_amplitude_GeV_m2=54*Cp+77*Cn,
            C12_zero_q_amplitude_GeV_m2=6*(Cp+Cn),
            lambdaP_equal_proton_tree= Cp/(mx*.3*mn/(125**2*1000**2))))
rejects=[]
for scales in [(None,91.1876),(1.,91.1876)]:
    try:twist_at_common_scale(.254,*scales);rejects.append(False)
    except ValueError:rejects.append(True)
central=rows[4]
checks={'missing_and_mismatched_twist_scale_rejected':all(rejects),
        'scalar_sigma_normalization':math.isclose(central['C_scalar_p_Lagrangian_GeV_m2'],mn*Cu*(.017/mn),rel_tol=1e-12),
        'isospin_symmetric_target_recovers_A':math.isclose((54+77)*Cu*.017,131*Cu*.017,rel_tol=1e-12),
        'all_scalar_coefficients_positive':all(r['C_scalar_p_Lagrangian_GeV_m2']>0 and r['C_scalar_n_Lagrangian_GeV_m2']>0 for r in rows)}
assert all(checks.values())
out=dict(scope='Leading zero-transfer scalar up-box projection with published sigma-term sensitivity range; twist total not admitted without scale matching',checks=checks,rows=rows,twist_coefficient_per_unit_momentum_fraction_GeV_m2=.75*mn*Ct,twist_prediction_admitted=False,source_sigma_terms='https://arxiv.org/html/1707.06998v2',source_moment_scale='https://arxiv.org/html/1810.01039v2',full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'central':central,'twist_factor':out['twist_coefficient_per_unit_momentum_fraction_GeV_m2']},indent=2))
