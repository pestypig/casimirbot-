"""Compare conditional local upper estimates per expected raw xenon event."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent
def read(name,digest):
    p=base/(name+'-2026-09-07.json')
    assert hashlib.sha256(p.read_bytes()).hexdigest()==digest
    return json.loads(p.read_text())
axion=read('casimir-dp-axion-assembled-subsets','67b7415b216708c65733a8b978d238cdea478d0b19ce93939c07c5c7894ee1e0')
absorption=read('casimir-dp-absorption-source-form','d026067ddcf588d9a9178c6855df19ece48d787c8acff1923023cb4660541730')
rows=[]
for r in axion['rows']:
    rows.append(dict(model='axion_assembled_subset',parameters={k:r[k] for k in ['lambda_PhiH','halo','mode']},D_upper=r['D_free_nuclei_upper'],Xe_raw=r['Xe_total_full'],ratio_upper=r['D_free_nuclei_upper']/r['Xe_total_full']))
for r in absorption['rows']:
    rows.append(dict(model='absorption_exclusive_nuclear',parameters={k:r[k] for k in ['m_GeV','form']},D_upper=r['local_D_le_2N'],Xe_raw=r['Xe_raw'],ratio_upper=r['local_D_le_2N']/r['Xe_raw']))
summaries=[]
for model in sorted(set(r['model'] for r in rows)):
    group=[r for r in rows if r['model']==model]
    summaries.append(dict(model=model,rows=len(group),minimum=min(group,key=lambda r:r['ratio_upper']),maximum=max(group,key=lambda r:r['ratio_upper'])))
checks=dict(positive=all(r['ratio_upper']>0 for r in rows),recover_parent=all(math.isclose(r['ratio_upper']*r['Xe_raw'],r['D_upper'],rel_tol=1e-12) for r in rows),common_rate_scaling_cancels=all(math.isclose((x*r['D_upper'])/(x*r['Xe_raw']),r['ratio_upper'],rel_tol=1e-12) for r in rows for x in [.1,1,10]))
assert all(checks.values())
out=dict(scope='Each ratio compares its own conditional local upper estimate with expected raw Xe counts in 2.84 t yr. Not a detector fit, full-model bound, or a common UV coupling scan. Source response prescriptions and target approximations remain distinct.',checks=checks,summaries=summaries,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(checks=checks,summaries=summaries),indent=2))
