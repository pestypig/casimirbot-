"""Apply authenticated visible-mediator contours to the strong transport product."""
import hashlib,json,math,os,subprocess
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-coupled-attenuation-branches-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='16e728335769bbfa142a873a44d585de38118fb5a686705517d8866246d7e9f1'
branch=json.loads(p.read_text())['rows'][1]
q=base/'casimir-dp-virtual-visible-continuous-screen-2026-09-07.json'
prior=json.loads(q.read_text());ext=Path(os.environ['TEMP'])/'casimir-darkcast-intake'
commit=subprocess.check_output(['git','-C',str(ext),'rev-parse','HEAD'],text=True).strip()
assert commit=='5a2a53a8984827be06e2939e6c3705f79d180048'
for r in prior['intervals']:
    f=ext/'darkcast/limits'/(r['name']+'.lmt')
    assert hashlib.sha256(f.read_bytes()).hexdigest()==r['sha256']
alpha_em=1/137.035999084;rows=[]
for scale in [1,3.9]:
    product=branch['effective_proton_alpha']*math.sqrt(scale)
    epsmin=product/math.sqrt(alpha_em) # alpha_D<=1, unlike the prior splitting model's .5 cap
    epsmax=.01;reach=epsmin;used=[]
    for r in sorted(prior['intervals'],key=lambda x:x['lower']):
        if r['upper']<=reach:continue
        assert r['lower']<reach, 'Uncovered coupling interval'
        reach=r['upper'];used.append(r['name'])
        if reach>=epsmax:break
    assert reach>=epsmax
    for ep in np.geomspace(epsmin,epsmax,10001):
        assert any(r['lower']<ep<=r['upper'] for r in prior['intervals'])
    mu=100*.94/(100+.94)
    sigma=16*math.pi*mu**2*product**2/.01**4*.3893793721e-27
    assert math.isclose(sigma,branch['zero_momentum_proton_cross_section_cm2']*scale,rel_tol=1e-12)
    rows.append(dict(scale=scale,effective_alpha_product=product,epsilon_domain=[epsmin,epsmax],
        alpha_D_domain=[product**2/(alpha_em*epsmax**2),1],covered=True,covering_searches=used))
out=dict(status='conditional_visible_completion_excluded_in_declared_domain',rows=rows,
    contour_commit=commit,contour_receipt_sha256=hashlib.sha256(q.read_bytes()).hexdigest(),
    intervals=prior['intervals'],assumptions=['10 MeV kinetically mixed dark photon',
       '100 GeV Dirac dark matter; no additional open dark decays',
       'Standard electromagnetic production and dominant electron-pair decay',
       'alpha_D<=1 and epsilon<=.01 declared weak-coupling scope'],
    limitations=['Union of published/recast contours, not a combined confidence level',
       'No exclusion of altered mediator masses or decay completions',
       'Does not validate the Born transport normalization or produce a shared signal'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
