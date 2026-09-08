"""Nominal accepted true-energy ratio envelope; not an LZ likelihood."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
source = root / 'casimir-dp-virtual-mass-scan-2026-09-07.json'
raw = source.read_bytes()
rows = []
for row in json.loads(raw)['rows']:
    ratio = row['raw_low_high']
    assert ratio > 0
    rows.append(dict(mediator_GeV=row['mediator_GeV'], raw_low_high=ratio,
                     nominal_accepted_ratio_lower=0.5 * ratio,
                     nominal_accepted_ratio_upper=2 * ratio))
result = dict(
    status='conditional_nominal_efficiency_envelope_not_exclusion',
    source_sha256=hashlib.sha256(raw).hexdigest(),
    paper='https://arxiv.org/pdf/2609.02823v1',
    source_locations=['Figure 1 caption', 'Figure S2 caption'],
    true_energy_low_keV=[5.4, 200], true_energy_high_keV=[200, 269.9],
    nominal_efficiency_interval=[0.5, 1.0],
    caveats=['Not a calibration-nuisance confidence envelope',
             'Accepted events grouped by true origin energy, not reconstructed bins',
             'No background likelihood or model exclusion',
             'Input spectra retain their original microscopic approximations'],
    rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result, indent=2))
