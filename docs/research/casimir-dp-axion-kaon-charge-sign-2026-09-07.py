"""Charge-asymmetry test of the magnitude-reflected kaon branch, conditional."""
import cmath,hashlib,json,math
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-axion-kaon-signed-branches-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='c6d20e0025145c33f375ba3863964f1123b0439d557b9256d199dd39c7003e0c'
parent=json.loads(p.read_text())
observed=.00332
def mixing_asymmetry(qp):return (1-abs(qp)**2)/(1+abs(qp)**2)
rows=[]
for r in parent['reference_rows']:
    for phase in [43.5,45.]:
        eps=r['signed_total_reference']*cmath.exp(1j*math.radians(phase))
        qp=(1-eps)/(1+eps)
        am=mixing_asymmetry(qp)
        # Right-sign decay asymmetry a=(|A+|^2-|Abar-|^2)/sum.
        # For zero wrong-sign amplitudes A_L=(am+a)/(1+am*a).
        required=(observed-am)/(1-observed*am)
        rows.append(dict(yL=r['yL'],phase_reference_degrees=phase,signed_epsilon_reference=r['signed_total_reference'],q_over_p_magnitude=abs(qp),predicted_AL_equal_right_sign_rates=am,required_right_sign_rate_asymmetry=required))
eps=.002228*cmath.exp(1j*math.pi/4);qp=(1-eps)/(1+eps)
rephased=cmath.exp(2j*.71)*qp
checks=dict(exact_epsilon_identity=math.isclose(mixing_asymmetry(qp),2*eps.real/(1+abs(eps)**2),rel_tol=1e-12),flavor_rephasing_invariance=math.isclose(mixing_asymmetry(qp),mixing_asymmetry(rephased),rel_tol=1e-12),physical_reflection_reverses_asymmetry=math.isclose(mixing_asymmetry((1+eps)/(1-eps)),-mixing_asymmetry(qp),rel_tol=1e-12),required_decay_asymmetry_reconstructs_measurement=all(math.isclose((r['predicted_AL_equal_right_sign_rates']+r['required_right_sign_rate_asymmetry'])/(1+r['predicted_AL_equal_right_sign_rates']*r['required_right_sign_rate_asymmetry']),observed,rel_tol=1e-12) for r in rows))
assert all(checks.values())
out=dict(scope='Reference-phase mapping, zero wrong-sign semileptonic amplitudes, equal CP-conjugate right-sign rates unless explicitly varied. No full DeltaS=1 or absorptive matching.',observed_AL=observed,observed_error=.00006,rows=rows,checks=checks,reflected_branch_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
