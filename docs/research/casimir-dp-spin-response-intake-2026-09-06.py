"""Archive and statically audit upstream response coverage; execute no upstream code."""
import ast
import base64
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen

REV = '50581c637069305a3def3865462ef1b4ed9a616d'
ROOT = Path(__file__).with_suffix('')
ROOT.mkdir(exist_ok=True)
files = ['WIMpy/Nuclei.txt', 'WIMpy/WS1.py', 'WIMpy/WS2.py', 'LICENSE.md']
expected = ['f10638d10f196e98d69887e72e46909e131306946fd3f4b64aa177d2fd79b813',
            'c1a31d8b543cae5ade1c026fa14ec51e8ff1a858268404352eaf3217c731f08d',
            'bcb52680c7dcf397a9bbe2b8577b1cd5d3121f766b36eb9b6c7a250ce5afa086',
            'b84122bafe1db4faf284a084f70348f015085b6f5a34c1668dbc0646eeec1e76']
records = []
for name in files:
    url = f'https://api.github.com/repos/bradkav/WIMpy_NREFT/contents/{name}?ref={REV}'
    target = ROOT / name.replace('/', '__')
    if not target.exists():
        with urlopen(Request(url, headers={'User-Agent': 'Casimir-response-audit'}), timeout=30) as response:
            payload = json.load(response)
        target.write_bytes(base64.b64decode(payload['content']))
    raw = target.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == expected[files.index(name)], f'Archive hash mismatch: {name}'
    records.append({'source': url, 'file': str(target), 'sha256': hashlib.sha256(raw).hexdigest()})

inventory = {line.split()[0] for line in (ROOT/'WIMpy__Nuclei.txt').read_text().splitlines()
             if line.strip() and not line.startswith('#')}
coverage = {}
for module in ['WS1', 'WS2']:
    tree = ast.parse((ROOT/f'WIMpy__{module}.py').read_text())
    keys = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Subscript) and isinstance(target.value, ast.Name) and target.value.id == 'dispatchtable':
                    if isinstance(target.slice, ast.Constant):
                        keys.add(target.slice.value)
    coverage[module] = {isotope: isotope in keys for isotope in ['C12', 'C13', 'Xe129', 'Xe131']}

def require_coverage(isotope):
    if isotope not in inventory or not all(row.get(isotope, False) for row in coverage.values()):
        raise ValueError(f'UNAVAILABLE_NUCLEAR_RESPONSE:{isotope}')

checks = {}
try:
    require_coverage('C13')
    checks['missing_C13_rejected'] = False
except ValueError as error:
    checks['missing_C13_rejected'] = str(error) == 'UNAVAILABLE_NUCLEAR_RESPONSE:C13'
for isotope in ['Xe129', 'Xe131']:
    require_coverage(isotope)
    checks[f'{isotope}_coverage_present'] = True
assert all(checks.values())
output = {'upstream_commit': REV, 'records': records, 'coverage': coverage, 'checks': checks,
          'joint_prediction_admitted': False,
          'meaning': 'Coverage is not normalization, provenance equivalence to LZ, or numerical validation. C12 zero-spin absence differs physically from missing C13.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(output, indent=2)+'\n')
print(json.dumps(output, indent=2))
