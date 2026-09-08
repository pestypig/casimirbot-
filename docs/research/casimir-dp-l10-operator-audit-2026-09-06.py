"""Leading L10 spin algebra and scale checks; not a detector rate or fit."""
import hashlib
import json
import math
from pathlib import Path
import numpy as np

config = Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
sha = hashlib.sha256(config.read_bytes()).hexdigest()
assert sha == '5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d = json.loads(config.read_text())['leading_design']
S = [np.array([[0, 1], [1, 0]])/2,
     np.array([[0, -1j], [1j, 0]])/2,
     np.diag([1., -1.])/2]
def amplitude(q):
    # m_M=1, coefficient=1; q in matching mass units.
    return 4*sum((np.dot(q, q)*(i == j)-q[i]*q[j])*np.kron(S[i], S[j])
                 for i in range(3) for j in range(3))
def spin_average(q):
    a = amplitude(q)
    return float(np.trace(a.conj().T@a).real/4)
vectors = [np.array([0., 0., 1.]), np.array([1., 2., 3.]), np.array([.2, -.7, .4])]
checks = {
    'spin_half_average_equals_2_q4': all(np.isclose(spin_average(q), 2*np.dot(q,q)**2) for q in vectors),
    'longitudinal_spin_component_cancels': np.allclose(amplitude(vectors[0]), 4*(np.kron(S[0],S[0])+np.kron(S[1],S[1]))),
    'zero_momentum_vanishes': np.allclose(amplitude(np.zeros(3)), 0),
    'q_doubling_scales_probability_by_16': all(np.isclose(spin_average(2*q), 16*spin_average(q)) for q in vectors),
}
# Independent unpolarized nuclei: cross-site spin correlations vanish,
# even when spatial phases are equal (qR << 1).
two_spin_x = np.kron(S[0], np.eye(2)) + np.kron(np.eye(2), S[0])
checks['two_unpolarized_spins_scale_as_N'] = np.isclose(np.trace(two_spin_x@two_spin_x).real/4, 2/4)
u = 1.66053906892e-27
f13 = .0107  # NIST representative terrestrial composition, not sample assay.
mean_mass_u = (1-f13)*12+f13*13.00335483507
atoms = d['mass_kg']/(u*mean_mass_u)
hbarc_eVm = 1.973269804e-7
qsoft = hbarc_eVm/d['branch_separation_m']
qxe = math.sqrt(2*131.293*.93149410242*248e-6)*1e9
output = {
    'scope': 'Leading contact L10 algebra only; no carbon nuclear matching, rate, or exclusion',
    'config_sha256': sha,
    'checks': {key: bool(value) for key, value in checks.items()},
    'natural_carbon_assumption': {'fraction_C13': f13, 'atom_count': atoms, 'C13_count': atoms*f13},
    'scales': {'q_at_inverse_separation_eV': qsoft, 'q_at_Xe_248keV_eV': qxe,
               'q4_ratio_fixed_spin_matrix_element': (qsoft/qxe)**4},
    'missing': ['sample isotope assay and nuclear spin state', 'C13 isoscalar spin form factors',
                'Xe spin response and detector likelihood', 'UV matching and subleading terms',
                'solid dynamic spin response and selected-path survival'],
}
assert all(checks.values())
Path(__file__).with_suffix('.json').write_text(json.dumps(output, indent=2)+'\n')
print(json.dumps(output, indent=2))
