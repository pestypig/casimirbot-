"""Selected contact responses along fixed-gu family, including rounded-gu repair."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-axion-gluon-insertion-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='bf74fbe7aa05a0f03b17b411b7db3a2c09ff2556ecfb9f723d6ecbea54d60b42'
n={'__file__':str(p)};exec(compile(p.read_text().split('\nforecasts=[]')[0],str(p),'exec'),n)
p=base/'casimir-dp-axion-family-loop-cost-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='05947f618f2aa6e9377522bec7e27714612bf6d6b932aa2113be2add44d97466'
family=json.loads(p.read_text())['rows'];a=n['a'];s=n['s'];ct=n['ct'];common=n['common']
gu=5.5700260688158226e-5
oldgu=a['t']['s']['a']['gu'];assert oldgu==5.6e-5
ratio=(gu/oldgu)**2
def forecast(r,halo_name='central',repair=True,mode='linear_interference'):
    halo=a['h']['scenarios'][halo_name]
    spin=next(w for w in a['t']['spin'] if w['mchi_GeV']==400 and w['B0_GeV']==2.7 and w['b_C13_fm']==1.7 and w['halo']==halo_name)
    kaa=r['Kaa_GeV_minus2'];kh=r['Kh_GeV_minus1']
    cg=-kaa*s['g']**2*s['mx']*s['I'](0)/(8*math.pi**2)
    extra=-cg*n['trace']+s['tree'](0)*(-n['v']*kh*n['trace']/n['mn'])/.3
    factor=ratio if repair else 1.
    dp=common-factor*a['bp']+extra;dn=common-factor*a['bn']+extra
    def integrate(lo,hi):return quad(lambda E:a['xenon'](E,ct,dp,dn,halo,mode),lo,hi,epsabs=1e-11)[0]
    full=integrate(5.4,269.9)+factor*a['spin_scale']*spin['Xe_raw_full']
    high=integrate(200,269.9)+factor*a['spin_scale']*spin['Xe_raw_high']
    local=a['local'](ct,dp,dn,halo,mode)+factor*a['spin_scale']*spin['D_upper']
    return dict(yL=r['yL'],halo=halo_name,mode=mode,gu_repaired=repair,extra_scalar_potential_GeV_minus2=extra,Xe_raw_full=full,Xe_raw_high=high,D_independent_nuclei_upper=local)
old=forecast(family[-1],repair=False)
assert math.isclose(old['Xe_raw_full'],1.3745995413578174,rel_tol=1e-12)
assert math.isclose(old['D_independent_nuclei_upper'],2.1799972035538893e-29,rel_tol=1e-12)
rows=[forecast(r,h,True,mode) for r in family for h in a['h']['scenarios'] for mode in ['linear_interference','squared_subset']]
assert all(0<r['Xe_raw_high']<r['Xe_raw_full'] and r['D_independent_nuclei_upper']>0 for r in rows)
out=dict(scope='Q=0 contact scalar insertion, approximate spin response, raw xenon exposure and independent free nuclei D<=2N; not full matched amplitude, detector likelihood, solid response or uncertainty band.',fixed_inputs=dict(gu=gu,ma_GeV=1,mchi_GeV=400,lambda_PhiH=.03,mr_GeV=1000,fTG=.9),rounded_gu_squared_correction=ratio,archived_reference_replayed=old,rows=rows,checks=dict(archived_reference_recovered=True,positive_nested_windows=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(dict(ratio=ratio,central=[r for r in rows if r['halo']=='central' and r['mode']=='linear_interference']),indent=2))
