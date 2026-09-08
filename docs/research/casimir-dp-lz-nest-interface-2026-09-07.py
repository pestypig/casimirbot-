"""Paper-derived NR input mapping, not an executed LZ detector simulation."""
import hashlib
import json
import math
from pathlib import Path

root = Path(__file__).parent
receipt = root / 'casimir-dp-lz-nr-parameters-2026-09-07.json'
expected = 'f4e146d15d843250c82d790cdd69c6a6309955d5de86f790e417ec572480bcab'
assert hashlib.sha256(receipt.read_bytes()).hexdigest() == expected
p = json.loads(receipt.read_text())['analysis_parameters']
order = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
         'theta', 'iota', 'p', 'f1', 'f2']

def vector(energy_keV):
    assert energy_keV > 0
    result = [p[name] for name in order]
    if energy_keV > p['E0_keV']:
        result[9] += p['a'] * math.log1p(p['b'] * (energy_keV - p['E0_keV']))
    assert len(result) == 12
    return result

assert vector(10) == vector(p['E0_keV'])
assert abs(vector(p['E0_keV'] + 1e-8)[9] - p['p']) < 1e-10
rows = []
for energy in [10, 74.7, 100, 150, 200, 220, 248, 269.9]:
    values = vector(energy)
    ratio = (energy + p['epsilon']) ** (-(values[9] - p['p']))
    assert 0 < ratio <= 1
    rows.append(dict(energy_keV=energy, NRYieldsParam=values,
                     conditional_Qy_ratio_to_constant_p=ratio))
out = dict(status='exploratory_source_interface_mapping',
    paper='https://arxiv.org/html/2609.02823v1',
    nest_tag='v2.4.5beta', nest_commit='19bc9bc063c62961d2f190beec2db16a9e279aa1',
    nest_cpp_sha256='29ba21cbd1b37be5c30a232db906ed2e433833e11574beec865072b16f9c5173',
    parameter_receipt_sha256=expected, zero_based_parameter_order=order,
    rows=rows, checks=['input hash', '12 entries', 'below-break invariance',
                      'continuity at break', 'positive conditional ratio'],
    limitations=['NEST not executed by this script',
                 'external per-energy mapping inferred from paper and source; not authenticated LZ wrapper',
                 'ratio holds all other NR settings fixed; not an S1/S2 or energy-response kernel',
                 'no accepted event counts or parameter exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps(rows, indent=2))
